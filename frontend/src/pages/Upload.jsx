import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Loader2, FileText, FileCheck, FileSearch, FileX, Timer, FolderPlus, FilePlus } from 'lucide-react';
import WireframeMeshCanvas from '../components/background/WireframeMeshCanvas';
import BentoCard from '../components/ui/BentoCard';
import CircularProgress from '../components/ui/CircularProgress';
import Alert from '../components/ui/Alert';

import { useUpload } from '../context/UploadContext';

export default function Upload() {
  const [isScrolled, setIsScrolled] = useState(false);
  // Theme switch handler for `isScrolled`. 
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [sizeAlert, setSizeAlert] = useState(null);
  

  // Set fileInputRef initially as an object with current field initially pointing to nothing. 
  const fileInputRef = useRef(null);

  const { metrics, startUpload } = useUpload();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  // Central helper: Validates file sizes (<= 10MB) and appends valid files to state
  const addFiles = (newlySelectedFiles) => {
    setUploadStatus(null);
    setSizeAlert(null);
    
    const validSizeFiles = newlySelectedFiles.filter(file => file.size <= MAX_FILE_SIZE);
    const oversizedFiles = newlySelectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      setSizeAlert(`Skipped ${oversizedFiles.length} file(s) exceeding the 10MB limit.`);
    }

    setFiles(prev => [...prev, ...validSizeFiles]);
  };

  // Handler (File Browser Dialog): Captures files picked via OS dialog, forwards to addFiles(), and resets input
  const handleFileSelect = (e) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = ''; 
    }
  };

  // Submits staged files via POST multipart/form-data to the backend API endpoint
  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('folder', file));
      
      const response = await fetch('http://localhost:8000/invoices/batch', { 
        method: 'POST', 
        body: formData 
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      } 

      const data = await response.json();

      if (data.upload_id) {
        console.log(data.upload_id);
        startUpload(data.upload_id);
      }

      setUploadStatus('success');
      setFiles([]);

    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  // Triggers OS file dialog programmatically via fileInputRef
  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div
      className={`relative min-h-screen p-6 lg:p-8 font-sans transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[var(--page-bg)] text-[var(--page-text)] ${isScrolled ? 'theme-light' : 'theme-dark'}`}
    >
      {/* Layer 1: ambient blurred gradient blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700">
        {isScrolled ? (
          <>
            <div className="absolute inset-0 bg-slate-50" />
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(224,242,254,0.85),transparent_70%)] blur-[90px]" />
            <div className="absolute top-[25%] right-[-10%] w-[650px] h-[650px] bg-[radial-gradient(ellipse_at_center,rgba(241,245,249,0.95),transparent_70%)] blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(238,242,255,0.85),transparent_70%)] blur-[110px]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-zinc-950" />
            <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.18),transparent_70%)] blur-[90px]" />
            <div className="absolute top-[20%] right-[-10%] w-[650px] h-[650px] bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.60),transparent_70%)] blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[750px] h-[750px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.08),transparent_70%)] blur-[110px]" />
          </>
        )}
      </div>

      {/* Layer 2: grid mesh, sits above the blobs, below content */}
      <WireframeMeshCanvas isScrolled={isScrolled} heightVh={25} />

      
      <div className="relative z-10 max-w-6xl mx-auto space-y-2.5 flex flex-col gap-2.5">
        {/* 1. UPLOAD SECTION */}
        <BentoCard 
          isScrolled={isScrolled}
        >
          <div className="p-4 sm:p-5 text-center relative transition-colors duration-500 bg-[var(--bento-inner-bg)]">
            
            {/* Softened Dashed File Upload Container */}
            <div className="border-2 border-dashed rounded-xl p-6 sm:p-12 flex flex-col items-center justify-center relative z-10 transition-colors duration-500 bg-[var(--dropzone-bg)] border-[var(--dropzone-border)]">
              
              {/* Custom Texture Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none z-0 rounded-xl transition-all duration-500"
                style={{
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  mixBlendMode: 'var(--card-texture-blend)',
                  opacity: 'var(--dropzone-texture-opacity)',
                  filter: 'grayscale(100%)',
                }}
              />
              
              {/* Header Container: Inline Upload Icon and Title Text */}
              <div className="flex flex-row items-center justify-center gap-3.5 mb-6 text-left z-10">
                {/* Minimalist Document with Plus Icon */}
                <div 
                  onClick={triggerFileInput}
                  className="cursor-pointer shrink-0 transition-colors duration-200 text-[var(--upload-icon-color)] hover:text-[var(--upload-icon-hover)]"
                >
                  <FilePlus className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.5]" />
                </div>

                {/* Title & Subtext */}
                <div>
                  <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)] transition-colors duration-500">
                    Upload Invoices
                  </h2>
                  <p className="text-xs sm:text-sm font-normal text-[var(--upload-subtext-color)] transition-colors duration-500">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </div>
              </div>

              {/* Standout Select Files Button */}
              <button 
                type="button"
                onClick={triggerFileInput}
                className="relative z-10 font-semibold text-base px-12 py-1.5 rounded-md transition-all duration-200 cursor-pointer flex items-center gap-2.5 shadow-md bg-[var(--btn-select-bg)] hover:bg-[var(--btn-select-hover-bg)] text-[var(--btn-select-text)] border border-[var(--btn-select-border)] shadow-[var(--btn-select-shadow)]"
              >
                <FolderPlus className="w-5 h-5" />
                <span>Select Files</span>
              </button>

              {
              /* Hidden native file input element bound to fileInputRef.
              Programmatically triggered by fileInputRef.current.click() 
              when custom UI buttons or icons are clicked. */
              }
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Selected File Summary & Submit Action */}
            {files.length > 0 && (
              <div className="relative z-10 mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-500 border-[var(--staged-row-border)]">
                <div className="text-sm font-medium text-[var(--staged-text-color)]">
                  {files.length} file{files.length > 1 ? 's' : ''} staged for extraction
                </div>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-none text-sm flex items-center gap-2 transition-all cursor-pointer border-0"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading Batch...</>
                  ) : (
                    <><UploadCloud className="w-4 h-4" /> Start Batch Ingestion</>
                  )}
                </button>
              </div>
            )}

            {/* Alerts */}
            {uploadStatus === 'success' && (
              <Alert type="success" message="Batch uploaded successfully! Workers dispatched." />
            )}

            {uploadStatus === 'error' && (
              <Alert type="error" message="Upload failed. Please check network connection or server status." />
            )}
            
            {sizeAlert && (
              <Alert type="error" message={sizeAlert} />
            )}
          </div>
        </BentoCard>

        {/* SUMMARY HEADING (Standalone Text with breathing room) */}
        <div className="mt-4 mb-6 flex items-center gap-2 px-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] transition-colors duration-500">
            Summary
          </h1>
          <Timer className="w-4.5 h-4.5 text-[var(--summary-timer-color)] transition-colors duration-500" />
        </div>

        {/* 2. LIVE PROCESSING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Left Card: PROCESSING */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-5 flex flex-col justify-between items-center text-center min-h-[210px] h-full relative">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-[48px] pointer-events-none"></div>
              
              <div className="w-full flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">PROCESSING</span>
                </div>
              </div>

              <div className="z-10 my-2">
                <CircularProgress 
                  value={metrics.under_process} 
                  total={metrics.total_files} 
                  singleNumberOnly={true} 
                  centerSubtext="In Progress" 
                />
              </div>

              <div className="z-10 w-full text-center">
                <span className="text-xs font-medium text-[var(--card-processing-footer)] transition-colors duration-500">
                  {metrics.total_files > 0 ? Math.round((metrics.under_process / metrics.total_files) * 100) : 0}% of current batch
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Right Card: COMPLETED */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-5 flex flex-col justify-between items-center text-center min-h-[210px] h-full relative">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-[48px] pointer-events-none"></div>

              <div className="w-full flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">COMPLETED</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[var(--pulse-completed-dot)] shadow-[0_0_8px_var(--pulse-completed-dot)] transition-colors duration-500"></span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress 
                  value={metrics.finished_processed} 
                  total={metrics.total_files} 
                  singleNumberOnly={true} 
                  centerSubtext="Extracted" 
                />
              </div>

              <div className="z-10 w-full text-center">
                <span className="text-xs font-medium text-[var(--card-completed-footer)] transition-colors duration-500">
                  {metrics.total_files > 0 ? Math.round((metrics.finished_processed / metrics.total_files) * 100) : 0}% batch finished
                </span>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* 3. RESULTS BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Card 1: SUCCESS */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-5 flex flex-col justify-between items-center text-center min-h-[230px] h-full relative">
              <div className="absolute inset-0 bg-white/5 blur-2xl pointer-events-none"></div>

              <div className="w-full flex items-center gap-1.5 z-10">
                <FileCheck className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">SUCCESS</span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress 
                  value={metrics.successful_files} 
                  total={metrics.total_files} 
                />
              </div>

              <div className="z-10 mt-2">
                <span className="text-sm font-medium text-[var(--card-success-footer)] transition-colors duration-500">
                  {metrics.finished_processed > 0 ? ((metrics.successful_files / metrics.finished_processed) * 100).toFixed(1) : '100'}% Parse Accuracy
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Card 2: REVIEW */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-5 flex flex-col justify-between items-center text-center min-h-[230px] h-full relative">
              <div className="absolute inset-0 bg-white/5 blur-2xl pointer-events-none"></div>

              <div className="w-full flex items-center gap-1.5 z-10">
                <FileSearch className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">REVIEW</span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress 
                  value={metrics.review_files} 
                  total={metrics.total_files} 
                  centerSubtext="Missing data" 
                />
              </div>

              <div className="z-10 mt-2">
                <span className="text-sm font-medium text-[var(--card-review-footer)] transition-colors duration-500">Manual Intervention Required</span>
              </div>
            </div>
          </BentoCard>

          {/* Card 3: FAILED */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-5 flex flex-col justify-between items-center text-center min-h-[230px] h-full relative">
              <div className="absolute inset-0 bg-white/5 blur-2xl pointer-events-none"></div>

              <div className="w-full flex items-center gap-1.5 z-10">
                <FileX className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">FAILED</span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress 
                  value={metrics.failed_files} 
                  total={metrics.total_files} 
                />
              </div>

              <div className="z-10 mt-2">
                <span className="text-sm font-medium text-[var(--card-failed-footer)] transition-colors duration-500">Invalid File Format / Corrupt PDF</span>
              </div>
            </div>
          </BentoCard>
        </div>

      </div>
    </div>
  );
}