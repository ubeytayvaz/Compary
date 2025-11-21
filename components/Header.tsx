import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <ShieldCheck className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">SigortaKiyasla AI</h1>
              <p className="text-xs text-slate-500">Akıllı Teklif Karşılaştırma Asistanı</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              Gemini 2.5 Flash
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
