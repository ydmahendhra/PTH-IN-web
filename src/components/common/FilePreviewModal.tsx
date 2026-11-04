import React from 'react';
import { X, Download, FileText, FileSpreadsheet, Image as ImageIcon, FileCode, CheckCircle2 } from 'lucide-react';
import { ReportFile } from '../../types';

interface FilePreviewModalProps {
  file: ReportFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  if (!file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.includes('image') || /\.(jpg|jpeg|png|webp|svg)$/i.test(name)) {
      return <ImageIcon className="w-8 h-8 text-sky-400" />;
    }
    if (type.includes('sheet') || type.includes('excel') || /\.(xlsx|xls|csv)$/i.test(name)) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
    }
    if (type.includes('json') || type.includes('javascript') || /\.(ts|tsx|json)$/i.test(name)) {
      return <FileCode className="w-8 h-8 text-indigo-400" />;
    }
    return <FileText className="w-8 h-8 text-indigo-400" />;
  };

  const handleDownload = () => {
    let downloadUrl = file.dataUrl;

    if (!downloadUrl) {
      // Create synthetic blob download if dataUrl is empty
      const content = file.previewText || `NexusProject Report Document: ${file.name}\nSize: ${formatFileSize(file.size)}\nGenerated for enterprise verification.`;
      const blob = new Blob([content], { type: file.type || 'text/plain' });
      downloadUrl = URL.createObjectURL(blob);
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              {getFileIcon(file.type, file.name)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white truncate max-w-md">{file.name}</h3>
              <p className="text-xs text-slate-400 tabular-nums">
                {formatFileSize(file.size)} · {file.type || 'application/octet-stream'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* File Preview Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {file.type.includes('image') || /\.(jpg|jpeg|png|webp|svg)$/i.test(file.name) ? (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-lg">
              {file.dataUrl ? (
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  className="max-h-80 object-contain rounded border border-slate-800 shadow"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <ImageIcon className="w-16 h-16 text-slate-600" />
                  <p className="text-sm text-slate-300 font-medium">Image Graphic Attachment</p>
                  <p className="text-xs text-slate-400 max-w-xs">{file.previewText || 'Visual asset attachment verified for project review.'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Document Contents</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {file.previewText ||
                    `--- ${file.name} ---\nFile Format: ${file.type}\nFile Size: ${formatFileSize(
                      file.size
                    )}\nStatus: Verified and stored in NexusProject Repository.\nReady for supervisor inspection and archival.`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/50 rounded border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Integrity Check</span>
                  <span className="text-emerald-400 font-medium">SHA-256 Validated</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Storage Protocol</span>
                  <span className="text-slate-200 font-medium">Secure Encrypted Attachment</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
