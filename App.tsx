import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ComparisonTable } from './components/ComparisonTable';
import { comparePolicies } from './services/geminiService';
import { FileWithPreview, ComparisonResult } from './types';
import { Loader2, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [data, setData] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (files.length < 2) {
      setError("Lütfen karşılaştırma yapmak için en az 2 dosya yükleyin.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const fileObjects = files.map(f => f.file);
      const result = await comparePolicies(fileObjects);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Analiz sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Section */}
        {!data && !loading && (
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Sigorta Tekliflerini Saniyeler İçinde Karşılaştırın
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Kasko, Trafik veya Sağlık sigortası tekliflerinizi (PDF veya Excel) yükleyin. 
              Yapay zeka sizin için teminatları, limitleri ve fiyatları analiz etsin.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Input Section - Hide if we have results to reduce clutter, or allow re-upload */}
          {(!data || loading) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <FileUpload files={files} setFiles={setFiles} maxFiles={6} />
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCompare}
                  disabled={loading || files.length < 1}
                  className={`
                    flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold transition-all
                    ${loading || files.length < 1 
                      ? 'bg-slate-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}
                  `}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analiz Ediliyor...
                    </>
                  ) : (
                    <>
                      Karşılaştır
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {data && !loading && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Analiz Sonuçları</h2>
                <button 
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Yeni Karşılaştırma
                </button>
              </div>
              <ComparisonTable data={data} />
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} SigortaKiyasla AI. Powered by Gemini 2.5 Flash.
          <p className="mt-2 text-xs text-slate-400">
            Bu araç bilgilendirme amaçlıdır. Kesin poliçe onayı için lütfen sigorta şirketiyle görüşün.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;