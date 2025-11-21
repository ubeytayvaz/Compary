import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { FileWithPreview } from '../types';

interface FileUploadProps {
  files: FileWithPreview[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles, maxFiles = 4 }) => {
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        previewUrl: URL.createObjectURL(file)
      }));
      
      setFiles((prev) => {
        const combined = [...prev, ...newFiles];
        return combined.slice(0, maxFiles);
      });
    }
    // Reset input
    event.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="w-full">
      <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 hover:bg-slate-100 transition-colors text-center">
        <input
          type="file"
          multiple
          accept=".pdf, .xls, .xlsx, .csv, image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={files.length >= maxFiles}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Teklifleri Buraya Bırakın</h3>
          <p className="text-sm text-slate-500">
            PDF veya Excel (Maksimum {maxFiles} dosya)
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{f.file.name}</p>
                  <p className="text-xs text-slate-500">{(f.file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(f.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
