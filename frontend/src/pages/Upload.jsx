import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUploadBatch } from '../hooks/upload/useUploadBatch';

// Modular Upload Components
import UploadHeader from '../components/upload/UploadHeader';
import UploadDropzone from '../components/upload/UploadDropzone';
import UploadMetricsGrid from '../components/upload/UploadMetricsGrid';
import UploadResultsBreakdown from '../components/upload/UploadResultsBreakdown';

/**
 * Upload Page:
 * Coordinates invoice drag-and-drop batch ingestion, live extraction progress,
 * and outcome summary reporting.
 */
export default function Upload() {
  const { isScrolled } = useTheme();

  const {
    files,
    uploading,
    uploadStatus,
    sizeAlert,
    fileInputRef,
    metrics,
    handleFileSelect,
    handleUpload,
    triggerFileInput,
    removeFile,
  } = useUploadBatch();

  return (
    <div
      className={`relative min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 font-sans transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[var(--page-bg)] text-[var(--page-text)] ${isScrolled ? 'theme-light' : 'theme-dark'
        }`}
    >
      {/* Background layer */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[var(--page-bg)] transition-colors duration-500" />

      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* 1. Header with 3D Grid & Navigation Link */}
        <UploadHeader isScrolled={isScrolled} />

        {/* 2. File Drag & Drop Dropzone */}
        <UploadDropzone
          files={files}
          uploading={uploading}
          uploadStatus={uploadStatus}
          sizeAlert={sizeAlert}
          fileInputRef={fileInputRef}
          isScrolled={isScrolled}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          onTriggerFileInput={triggerFileInput}
          onRemoveFile={removeFile}
        />

        {/* 3. Batch Progress & Extraction Summary */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-[var(--bento-inner-border)] pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)] font-sans">
              Batch Extraction Progress
            </h2>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              Status: <strong className="text-[var(--text-primary)] uppercase">{metrics?.status || 'Idle'}</strong>
            </span>
          </div>

          {/* Live Progress Bar & Status Cards */}
          <UploadMetricsGrid
            metrics={metrics}
            isScrolled={isScrolled}
          />

          {/* Results Breakdown Cards */}
          <UploadResultsBreakdown
            metrics={metrics}
            isScrolled={isScrolled}
          />
        </div>
      </div>
    </div>
  );
}