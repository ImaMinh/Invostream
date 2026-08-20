import React, { useState } from 'react';
import BentoCard from '../general/BentoCard';
import Alert from '../general/Alert';
import { FileUp, FileText, X, Loader2, Upload } from 'lucide-react';

/**
 * UploadDropzone Component:
 * Harmonious, professional file dropzone conforming precisely to BentoCard
 * styling tokens, typography, and dark/light theme palettes.
 */
export default function UploadDropzone({
  files = [],
  uploading,
  uploadStatus,
  sizeAlert,
  fileInputRef,
  isScrolled,
  onFileSelect,
  onUpload,
  onTriggerFileInput,
  onRemoveFile,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect({ target: { files: e.dataTransfer.files } });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div className="p-4 sm:p-6 space-y-4 bg-[var(--bento-inner-bg)]">
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={onTriggerFileInput}
          className={`group relative border border-dashed rounded-none py-10 px-4 sm:py-12 sm:px-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[230px] ${
            isDragOver
              ? 'border-sky-500 bg-sky-500/[0.06]'
              : 'border-[var(--bento-inner-border)] hover:border-slate-400 dark:hover:border-slate-500 bg-black/[0.015] dark:bg-white/[0.015]'
          }`}
        >
          {/* Upload File Icon */}
          <div className="mb-3.5 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--bento-inner-border)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:border-slate-400 dark:group-hover:border-slate-500 transition-all shrink-0">
            <FileUp className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-1.5 max-w-md pointer-events-none text-center">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-sans">
              {isDragOver ? 'Drop your invoice files here' : 'Drop your invoice files here, or click to browse'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              PDF, JPG, or PNG up to 10MB each
            </p>
          </div>

          {/* Consistent Theme-Styled Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTriggerFileInput();
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--bento-inner-bg)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-[var(--text-primary)] border border-[var(--bento-inner-border)] hover:border-slate-400 dark:hover:border-slate-500 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Select Files
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={onFileSelect}
            className="hidden"
          />
        </div>

        {/* Staged Files List */}
        {files.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>{files.length} file{files.length > 1 ? 's' : ''} ready to process</span>
              <span>Total size: {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[var(--bento-inner-border)]">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="pt-1.5 first:pt-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                    <span className="font-medium text-[var(--text-primary)] truncate">{file.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono shrink-0">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>

                  {onRemoveFile && (
                    <button
                      type="button"
                      onClick={() => onRemoveFile(idx)}
                      title="Remove file"
                      className="text-[var(--text-secondary)] hover:text-rose-400 p-1 cursor-pointer transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Batch Action */}
            <div className="pt-3 border-t border-[var(--bento-inner-border)] flex items-center justify-end">
              <button
                type="button"
                onClick={onUpload}
                disabled={uploading}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-2 active:scale-95"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Invoices...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload {files.length} Invoice{files.length > 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {uploadStatus === 'success' && (
          <Alert type="success" message="Invoices uploaded successfully! Extraction in progress." />
        )}

        {uploadStatus === 'error' && (
          <Alert type="error" message="Upload failed. Please check your connection and try again." />
        )}

        {sizeAlert && (
          <Alert type="error" message={sizeAlert} />
        )}
      </div>
    </BentoCard>
  );
}
