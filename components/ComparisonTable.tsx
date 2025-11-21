import React from 'react';
import { ComparisonResult } from '../types';
import { CheckCircle, AlertTriangle, Info, FileDown, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ComparisonTableProps {
  data: ComparisonResult;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  const { policies, summary } = data;

  // Chart data preparation
  const chartData = policies.map(p => ({
    name: p.companyName.length > 15 ? p.companyName.substring(0, 12) + '...' : p.companyName,
    fullAmount: p.premiumAmount,
    displayAmount: `${p.premiumAmount} ${p.currency}`
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

  // Helper to handle Turkish characters for PDF (since default fonts often break them)
  const normalizeForPdf = (text: string) => {
    const map: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
    };
    return text.replace(/[çğışöüÇĞİŞÖÜ]/g, (match) => map[match] || match);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(normalizeForPdf("Sigorta Karsilastirma Raporu"), 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('tr-TR');
    doc.text(normalizeForPdf(`Olusturulma Tarihi: ${dateStr}`), 14, 28);
    doc.setTextColor(0);

    // Summary
    doc.setFontSize(11);
    doc.text(normalizeForPdf("Ozet:"), 14, 38);
    const splitSummary = doc.splitTextToSize(normalizeForPdf(summary), 180);
    doc.text(splitSummary, 14, 44);
    
    const startY = 44 + (splitSummary.length * 5) + 10;

    // Table Data
    const head = [['Ozellik', ...policies.map(p => normalizeForPdf(p.companyName))]];
    const body = [
      ['Police Turu', ...policies.map(p => normalizeForPdf(p.policyType))],
      ['Fiyat', ...policies.map(p => normalizeForPdf(`${p.premiumAmount} ${p.currency}`))],
      ['Teminat', ...policies.map(p => normalizeForPdf(p.coverageAmount))],
      ['Muafiyet', ...policies.map(p => normalizeForPdf(p.deductible))],
      ['Limitler', ...policies.map(p => normalizeForPdf(p.limits.join('\n• ')))],
      ['Avantajlar', ...policies.map(p => normalizeForPdf(p.pros.join('\n+ ')))],
      ['Eksiler', ...policies.map(p => normalizeForPdf(p.cons.join('\n- ')))],
    ];

    autoTable(doc, {
      startY: startY,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 }
      }
    });

    doc.save("sigorta-karsilastirma.pdf");
  };

  const downloadExcel = () => {
    const headers = ['Özellik', ...policies.map(p => p.companyName)];
    const rows = [
      ['Poliçe Türü', ...policies.map(p => p.policyType)],
      ['Prim Tutarı', ...policies.map(p => `${p.premiumAmount} ${p.currency}`)],
      ['Sigorta Bedeli', ...policies.map(p => p.coverageAmount)],
      ['Muafiyet', ...policies.map(p => p.deductible)],
      ['Önemli Limitler', ...policies.map(p => p.limits.join('\n'))],
      ['Avantajlar', ...policies.map(p => p.pros.join('\n'))],
      ['Dezavantajlar', ...policies.map(p => p.cons.join('\n'))],
    ];

    // Add Summary at the top
    const dataWithSummary = [
      ['Karşılaştırma Özeti:', summary],
      [],
      headers,
      ...rows
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dataWithSummary);
    
    // Basic column width adjustment
    const wscols = [{wch: 25}];
    policies.forEach(() => wscols.push({wch: 40}));
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Karşılaştırma");
    XLSX.writeFile(wb, "sigorta-karsilastirma.xlsx");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Actions & Summary Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="flex-grow bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
              <Info className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Yapay Zeka Özeti</h3>
              <p className="text-indigo-800 leading-relaxed text-sm md:text-base">
                {summary}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={downloadPDF}
            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF İndir
          </button>
          <button 
            onClick={downloadExcel}
            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel İndir
          </button>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Fiyat Karşılaştırması</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="fullAmount" radius={[6, 6, 0, 0]} barSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 min-w-[200px]">Özellikler</th>
              {policies.map((policy, idx) => (
                <th key={idx} className="px-6 py-4 min-w-[250px]">
                  <div className="flex flex-col">
                    <span className="text-base text-slate-900">{policy.companyName}</span>
                    <span className="text-xs text-slate-500 font-normal mt-1">{policy.policyType}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            
            {/* Price Row */}
            <tr>
              <td className="px-6 py-4 font-medium text-slate-900 bg-slate-50/50">Prim Tutarı (Fiyat)</td>
              {policies.map((policy, idx) => (
                <td key={idx} className="px-6 py-4">
                  <span className="text-xl font-bold text-blue-600">
                    {policy.premiumAmount.toLocaleString('tr-TR')} {policy.currency}
                  </span>
                </td>
              ))}
            </tr>

            {/* Coverage Row */}
            <tr>
              <td className="px-6 py-4 font-medium text-slate-900 bg-slate-50/50">Sigorta Bedeli</td>
              {policies.map((policy, idx) => (
                <td key={idx} className="px-6 py-4 text-slate-700 font-medium">
                  {policy.coverageAmount}
                </td>
              ))}
            </tr>

            {/* Deductible Row */}
            <tr>
              <td className="px-6 py-4 font-medium text-slate-900 bg-slate-50/50">Muafiyet</td>
              {policies.map((policy, idx) => (
                <td key={idx} className="px-6 py-4 text-slate-700">
                  {policy.deductible}
                </td>
              ))}
            </tr>

            {/* Limits Row */}
            <tr>
              <td className="px-6 py-4 font-medium text-slate-900 bg-slate-50/50 align-top">Önemli Limitler</td>
              {policies.map((policy, idx) => (
                <td key={idx} className="px-6 py-4 align-top">
                  <ul className="space-y-2">
                    {policy.limits.map((limit, lIdx) => (
                      <li key={lIdx} className="flex items-start text-slate-600">
                        <span className="mr-2 text-blue-500">•</span>
                        {limit}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Pros Row */}
            <tr>
              <td className="px-6 py-4 font-medium text-slate-900 bg-slate-50/50 align-top">Avantajlar</td>
              {policies.map((policy, idx) => (
                <td key={idx} className="px-6 py-4 align-top bg-green-50/30">
                  <ul className="space-y-2">
                    {policy.pros.map((pro, pIdx) => (
                      <li key={pIdx} className="flex items-start text-slate-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Cons Row */}
            <tr>
              <td className="px-6 py-4 font-medium text-slate-900 bg-slate-50/50 align-top">Dikkat Edilmesi Gerekenler</td>
              {policies.map((policy, idx) => (
                <td key={idx} className="px-6 py-4 align-top bg-orange-50/30">
                  <ul className="space-y-2">
                    {policy.cons.map((con, cIdx) => (
                      <li key={cIdx} className="flex items-start text-slate-700">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};