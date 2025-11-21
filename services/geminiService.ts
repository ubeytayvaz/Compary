import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ComparisonResult } from "../types";
import * as XLSX from "xlsx";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to read Excel file and convert to CSV-like text
const readExcelFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        let textContent = "";
        workbook.SheetNames.forEach(sheetName => {
           const worksheet = workbook.Sheets[sheetName];
           const csv = XLSX.utils.sheet_to_csv(worksheet);
           // Add sheet name to context
           if (csv.trim().length > 0) {
             textContent += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
           }
        });
        resolve(textContent);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } } | { text: string }> => {
  // Check for Excel or CSV files
  const isExcel = file.type.includes('sheet') || file.type.includes('excel') || 
                  file.name.endsWith('.xls') || file.name.endsWith('.xlsx');
  const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');

  if (isExcel || isCsv) {
    try {
      let content = "";
      if (isCsv) {
        content = await file.text();
      } else {
        content = await readExcelFile(file);
      }
      
      return { 
        text: `File Name: ${file.name}\nFile Type: ${isExcel ? 'Excel' : 'CSV'}\nContent:\n${content}` 
      };
    } catch (error) {
      console.error("Error parsing Excel/CSV:", error);
      throw new Error(`Excel dosyası okunamadı: ${file.name}`);
    }
  }

  // Default handling for PDF and Images (Base64)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Content = base64data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const policySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    companyName: { type: Type.STRING, description: "Sigorta şirketinin adı." },
    policyType: { type: Type.STRING, description: "Poliçe türü (Kasko, Trafik, Sağlık, Konut vb.)." },
    premiumAmount: { type: Type.NUMBER, description: "Toplam prim tutarı (sadece sayı)." },
    currency: { type: Type.STRING, description: "Para birimi (TL, USD, EUR)." },
    coverageAmount: { type: Type.STRING, description: "Toplam sigorta bedeli veya teminat limiti." },
    deductible: { type: Type.STRING, description: "Muafiyet tutarı veya oranı." },
    limits: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Önemli teminat limitlerinin listesi (İhtiyari Mali Mesuliyet vb.)." 
    },
    pros: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Bu teklifin diğerlerine göre veya genel olarak avantajlı yönleri."
    },
    cons: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Bu teklifin dezavantajları veya dikkat edilmesi gereken eksiklikleri."
    }
  },
  required: ["companyName", "premiumAmount", "currency", "coverageAmount", "deductible", "limits"]
};

const comparisonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    policies: {
      type: Type.ARRAY,
      items: policySchema,
      description: "Analiz edilen her bir dosya için çıkarılan yapılandırılmış veriler."
    },
    summary: {
      type: Type.STRING,
      description: "Tüm tekliflerin karşılaştırmalı kısa bir özeti ve öneri."
    }
  },
  required: ["policies", "summary"]
};

export const comparePolicies = async (files: File[]): Promise<ComparisonResult> => {
  try {
    const model = "gemini-2.5-flash";
    
    // Convert files to parts (handling text conversion for Excel)
    const fileParts = await Promise.all(files.map(fileToGenerativePart));

    const prompt = `
      Ekli sigorta poliçelerini veya tekliflerini analiz et.
      Kullanıcının bu teklifleri kolayca karşılaştırmasını sağlamak için aşağıdaki verileri her bir belge için çıkar:
      1. Sigorta Şirketi Adı
      2. Poliçe Türü
      3. Prim Tutarı (Fiyat)
      4. Para Birimi
      5. Sigorta Bedeli (Toplam Teminat)
      6. Muafiyet (Deductible) bilgisi
      7. Önemli Limitler (Özellikle İMM - İhtiyari Mali Mesuliyet, Manevi Tazminat vb.)
      8. Avantajlar ve Dezavantajlar

      Eğer bir belgede bilgi bulunamıyorsa, ilgili alan için "Belirtilmemiş" veya 0 değerini kullan.
      Para birimi sembollerini temizle ve sadece sayısal değeri 'premiumAmount' alanına yaz.
      
      Not: Excel/CSV dosyaları metin formatına dönüştürülmüştür, lütfen içeriklerini buna göre analiz et.
    `;

    const result = await genAI.models.generateContent({
      model: model,
      contents: {
        role: "user",
        parts: [
          ...fileParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: comparisonSchema,
        systemInstruction: "Sen uzman bir sigorta danışmanısın. Kullanıcıların karmaşık sigorta tekliflerini anlamalarına yardımcı oluyorsun. Türkçe yanıt ver."
      }
    });

    if (result.text) {
      return JSON.parse(result.text) as ComparisonResult;
    } else {
      throw new Error("Veri üretilemedi.");
    }

  } catch (error: any) {
    console.error("Gemini API Hatası:", error);
    // Enhance error message for users
    if (error.message?.includes('Unsupported MIME type')) {
       throw new Error("Desteklenmeyen dosya formatı. Lütfen PDF veya Excel dosyası yüklediğinizden emin olun.");
    }
    throw error;
  }
};
