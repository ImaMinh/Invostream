import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload as UploadIcon, UploadCloud, CheckCircle, AlertCircle, Loader2, FileText, FileCheck, FileSearch, FileX, Timer, FolderPlus } from 'lucide-react';
import cardTexture from '../../images/card_texture.jpeg';

{/* Brand New Sharp Wireframe Mesh Canvas Component with vh Scaling */}
const WireframeMeshCanvas = ({ isScrolled, heightVh = 25 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || window.innerWidth;
      const cssH = rect.height || window.innerHeight;

      // 1. Physical Hardware Buffer Dimensions
      const physW = Math.round(cssW * dpr);
      const physH = Math.round(cssH * dpr);
      canvas.width = physW;
      canvas.height = physH;

      // 2. Direct 1:1 Physical Pixel Context Matrix (zero CSS scaling artifacts)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, physW, physH);

      // 3. Vertical Mesh Height scaling relative to Viewport Height (vh)
      const physMeshH = (physH * heightVh) / 100;

      // 4. Responsive Grid Density
      const isMobile = cssW < 640;
      const cols = Math.max(10, Math.floor(cssW / (isMobile ? 30 : 48)));
      const rows = isMobile ? 4 : 5;
      const physDotRadius = Math.round((isMobile ? 1.5 : 2.0) * dpr);

      // 5. Calculate Direct Integer Physical Device Pixel Coordinates:
      // - Line coordinates: Exact integer + 0.5 for 100% solid single-device-pixel strokes
      // - Dot coordinates: Exact integer physical pixel centers
      const lineXs = new Float64Array(cols);
      const dotXs = new Float64Array(cols);
      for (let c = 0; c < cols; c++) {
        const pX = Math.round((c * (physW - 1)) / (cols - 1));
        lineXs[c] = pX + 0.5;
        dotXs[c] = pX;
      }

      const lineYs = new Float64Array(rows);
      const dotYs = new Float64Array(rows);
      for (let r = 0; r < rows; r++) {
        const pY = Math.round((r * (physMeshH - 1)) / (rows - 1));
        lineYs[r] = pY + 0.5;
        dotYs[r] = pY;
      }

      // 6. Direct 1 Physical Pixel Stroke Width
      ctx.lineWidth = 1;

      // Get theme colors dynamically
      const cs = getComputedStyle(canvas);
      const strokeColor = cs.getPropertyValue('--mesh-stroke').trim() 
        || (isScrolled ? 'rgba(30, 41, 59, 0.35)' : 'rgba(255, 255, 255, 0.45)');
      const dotColor = cs.getPropertyValue('--mesh-dot').trim() 
        || (isScrolled ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)');

      // 7. Draw Sharp Wireframe Grid Lines (100% Solid Opacity Per Line)
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();
      const xMin = lineXs[0], xMax = lineXs[cols - 1];
      const yMin = lineYs[0], yMax = lineYs[rows - 1];

      for (let r = 0; r < rows; r++) {
        ctx.moveTo(xMin, lineYs[r]);
        ctx.lineTo(xMax, lineYs[r]);
      }
      for (let c = 0; c < cols; c++) {
        ctx.moveTo(lineXs[c], yMin);
        ctx.lineTo(lineXs[c], yMax);
      }
      ctx.stroke();

      // 8. Draw Crisp Grid Dots
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const y = dotYs[r];
        for (let c = 0; c < cols; c++) {
          const x = dotXs[c];
          ctx.moveTo(x + physDotRadius, y);
          ctx.arc(x, y, physDotRadius, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isScrolled, heightVh]);

  // Mask gradient dynamically scales with the heightVh prop
  const maskGradient = `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) ${heightVh * 0.6}vh, rgba(0,0,0,0) ${heightVh}vh)`;

  return (
    <canvas 
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none opacity-90 w-full h-full"
      style={{
        maskImage: maskGradient,
        WebkitMaskImage: maskGradient
      }}
    />
  );
};


/**
 * Custom SVG Circular Progress Bar Component
 */
const CircularProgress = ({ value, total, colorClass, strokeColor, centerSubtext, singleNumberOnly }) => {
  const radius = 38;
  const strokeWidth = 13;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = total > 0 ? value / total : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="relative w-[140px] h-[140px] flex items-center justify-center mx-auto my-2">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        {/* Background Track Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="var(--circular-track-stroke)"
          strokeWidth={strokeWidth}
          fill="none"
          className="transition-colors duration-500"
        />
        {/* Colored Progress Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={strokeColor || "currentColor"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="square"
          fill="none"
          className={`${colorClass || ''} transition-all duration-1000 ease-out`}
        />
      </svg>
      {/* Center Text Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)] transition-colors duration-500">
          {singleNumberOnly ? value : `${value} / ${total}`}
        </span>
        {centerSubtext && (
          <span className="text-[11px] mt-0.5 font-normal text-[var(--text-subtext)] transition-colors duration-500">
            {centerSubtext}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * BentoCard Component featuring:
 * - Solid opaque background mask layer (100% blocks inside gradient rays)
 * - Crisp solid white outline border along outer 1.5px edge
 * - Interactive gradient blue border beam running ONCE (1.2s) on hover
 * - Subtle grid texture overlay on card background
 */
const BentoCard = ({ children, className = '', isDrag = false, isScrolled = false, disableHover = false, ...props }) => {
  return (
    <div 
      className={`relative ${disableHover ? '' : 'group'} rounded-none p-[1px] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden shadow-xl bg-[var(--bento-outer-bg)] ${
        isScrolled ? 'scale-[0.998]' : 'scale-100'
      } ${className}`}
      {...props}
    >
      {/* Border beam — one 1.2s sweep per hover, self-fading via keyframes */}
      {!disableHover && (
        <div
          className="beam absolute -inset-[200%] pointer-events-none z-0"
          style={{ background: 'conic-gradient(from 0deg at 50% 50%, rgba(0,242,254,0) 0%, rgba(0, 0, 0, 0) 75%, #1f1f1fff 85%, #616161ff 92%, #ffffffff 97%, #222222ff 100%)' }}
        />
      )}

      {/* Solid opaque inner layer — masks the wedge, leaves only the 1px ring */}
      <div 
        className={`relative z-10 w-full h-full rounded-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden bg-[var(--bento-inner-bg)] ${
          isDrag 
            ? 'border border-[var(--bento-drag-border)]' 
            : `border border-solid border-[var(--bento-inner-border)] ${disableHover ? '' : 'group-hover:border-transparent'}`
        }`}
      >
        {/* Custom Texture Overlay (Grayscale + Screen/Multiply blend mode) */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-500"
          style={{
            backgroundImage: `url(${cardTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'var(--card-texture-blend)',
            opacity: 'var(--bento-texture-opacity)',
            filter: 'grayscale(100%)',
          }}
        />
        {children}
      </div>
    </div>
  );
};

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [sizeAlert, setSizeAlert] = useState(null);
  const [uploadedFilesHistory, setUploadedFilesHistory] = useState(new Set());
  const [isScrolled, setIsScrolled] = useState(false);
  const fileInputRef = useRef(null);

  // Dynamic / telemetry state counters
  const [processingCount] = useState(15);
  const [completedCount] = useState(18);
  const [successCount] = useState(14);
  const [reviewCount] = useState(3);
  const [failedCount] = useState(1);

  const totalBatchCount = processingCount + completedCount;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  // Theme Switch Scroll Listener — Toggles root .theme-light / .theme-dark class via isScrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const addFiles = (newlySelectedFiles) => {
    setUploadStatus(null);
    setDuplicateAlert(null);
    setSizeAlert(null);
    
    // 1. Filter out files that are too large
    const validSizeFiles = newlySelectedFiles.filter(file => file.size <= MAX_FILE_SIZE);
    const oversizedFiles = newlySelectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      setSizeAlert(`Skipped ${oversizedFiles.length} file(s) exceeding the 10MB limit.`);
    }

    // 2. Filter out duplicates from valid-sized files
    const duplicates = validSizeFiles.filter(
      file => files.some(f => f.name === file.name) || uploadedFilesHistory.has(file.name)
    );
    
    const uniqueFiles = validSizeFiles.filter(
      file => !files.some(f => f.name === file.name) && !uploadedFilesHistory.has(file.name)
    );

    if (duplicates.length > 0) {
      setDuplicateAlert(`Warning: ${duplicates.length} file(s) already exist or were previously uploaded.`);
    }

    setFiles(prev => [...prev, ...uniqueFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.items) {
      const droppedFiles = Array.from(e.dataTransfer.items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile());
      addFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = ''; 
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('invoices', file));
      
      const response = await fetch('http://localhost:8000/invoices/batch', { 
        method: 'POST', 
        body: formData 
      });

      if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
      
      setUploadedFilesHistory(prev => {
        const newHistory = new Set(prev);
        files.forEach(f => newHistory.add(f.name));
        return newHistory;
      });

      setUploadStatus('success');
      setFiles([]);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

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
          isDrag={isDragging} 
          isScrolled={isScrolled}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-4 sm:p-5 text-center relative transition-colors duration-500 bg-[var(--bento-inner-bg)]">
            {/* Softened Dashed File Upload Container */}
            <div className="border-2 border-dashed rounded-xl p-6 sm:p-12 flex flex-col items-center justify-center relative z-10 transition-colors duration-500 bg-[var(--dropzone-bg)] border-[var(--dropzone-border)]">
              {/* Custom Texture Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none z-0 rounded-xl transition-all duration-500"
                style={{
                  backgroundImage: `url(${cardTexture})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  mixBlendMode: 'var(--card-texture-blend)',
                  opacity: 'var(--dropzone-texture-opacity)',
                  filter: 'grayscale(100%)',
                }}
              />
              
              {/* Header Container: Inline on small screens, stacked on sm+ */}
              <div className="flex flex-row sm:flex-col items-center justify-center gap-3.5 sm:gap-2 mb-6 sm:mb-6 text-left sm:text-center z-10">
                {/* Minimalist Upload Icon */}
                <div 
                  onClick={triggerFileInput}
                  className="cursor-pointer shrink-0 transition-colors duration-200 text-[var(--upload-icon-color)] hover:text-[var(--upload-icon-hover)]"
                >
                  <UploadIcon className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.5]" />
                </div>

                {/* Title & Subtext */}
                <div>
                  <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)] transition-colors duration-500">
                    Drag &amp; Drop Invoices
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
                className="relative z-10 font-semibold text-sm px-7 py-2.5 rounded-none transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-md bg-[var(--btn-select-bg)] hover:bg-[var(--btn-select-hover-bg)] text-[var(--btn-select-text)] border border-[var(--btn-select-border)] shadow-[var(--btn-select-shadow)]"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Select Files</span>
              </button>

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
              <div className="relative z-10 mt-4 p-3 rounded-none border text-sm flex items-center justify-center gap-2 bg-emerald-500/10 border-emerald-500/30 text-[var(--alert-success-text)]">
                <CheckCircle size={18} /> Batch uploaded successfully! Workers dispatched.
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="relative z-10 mt-4 p-3 rounded-none border text-sm flex items-center justify-center gap-2 bg-rose-500/10 border-rose-500/30 text-[var(--alert-error-text)]">
                <AlertCircle size={18} /> Upload failed. Please check network connection or server status.
              </div>
            )}

            {duplicateAlert && (
              <div className="relative z-10 mt-4 p-3 rounded-none border text-sm flex items-center justify-center gap-2 bg-amber-500/10 border-amber-500/30 text-[var(--alert-warning-text)]">
                <AlertCircle size={18} /> {duplicateAlert}
              </div>
            )}
            
            {sizeAlert && (
              <div className="relative z-10 mt-4 p-3 rounded-none border text-sm flex items-center justify-center gap-2 bg-rose-500/10 border-rose-500/30 text-[var(--alert-error-text)]">
                <AlertCircle size={18} /> {sizeAlert}
              </div>
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
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-[48px] pointer-events-none"></div>
              
              <div className="w-full flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">PROCESSING</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse"></span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress value={processingCount} total={totalBatchCount} strokeColor="#fbbf24" singleNumberOnly={true} centerSubtext="In Progress" />
              </div>

              <div className="z-10 w-full text-center">
                <span className="text-xs font-medium text-[var(--card-processing-footer)]">
                  {Math.round((processingCount / totalBatchCount) * 100)}% of current batch
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Right Card: COMPLETED */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-5 flex flex-col justify-between items-center text-center min-h-[210px] h-full relative">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-600/10 rounded-full blur-[48px] pointer-events-none"></div>

              <div className="w-full flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">COMPLETED</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress value={completedCount} total={totalBatchCount} strokeColor="#34d399" singleNumberOnly={true} centerSubtext="Extracted" />
              </div>

              <div className="z-10 w-full text-center">
                <span className="text-xs font-medium text-[var(--card-completed-footer)]">
                  {Math.round((completedCount / totalBatchCount) * 100)}% batch finished
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
              <div className="absolute inset-0 bg-cyan-500/5 blur-2xl pointer-events-none"></div>

              <div className="w-full flex items-center gap-1.5 z-10">
                <FileCheck className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">SUCCESS</span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress value={successCount} total={completedCount} colorClass="text-cyan-400" strokeColor="#22d3ee" />
              </div>

              <div className="z-10 mt-2">
                <span className="text-sm font-medium text-[var(--staged-text-color)]">99.8% Parse Accuracy</span>
              </div>
            </div>
          </BentoCard>

          {/* Card 2: REVIEW */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-5 flex flex-col justify-between items-center text-center min-h-[230px] h-full relative">
              <div className="absolute inset-0 bg-amber-500/5 blur-2xl pointer-events-none"></div>

              <div className="w-full flex items-center gap-1.5 z-10">
                <FileSearch className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">REVIEW</span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress value={reviewCount} total={completedCount} colorClass="text-amber-400" strokeColor="#fbbf24" centerSubtext="Missing data" />
              </div>

              <div className="z-10 mt-2">
                <span className="text-sm font-medium text-[var(--card-review-footer)]">Manual Intervention Required</span>
              </div>
            </div>
          </BentoCard>

          {/* Card 3: FAILED */}
          <BentoCard isScrolled={isScrolled} disableHover={true}>
            <div className="p-5 flex flex-col justify-between items-center text-center min-h-[230px] h-full relative">
              <div className="absolute inset-0 bg-rose-500/5 blur-2xl pointer-events-none"></div>

              <div className="w-full flex items-center gap-1.5 z-10">
                <FileX className="w-3.5 h-3.5 text-[var(--text-primary)] transition-colors duration-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-500">FAILED</span>
              </div>

              <div className="z-10 my-2">
                <CircularProgress value={failedCount} total={completedCount} colorClass="text-rose-500" strokeColor="#f43f5e" />
              </div>

              <div className="z-10 mt-2">
                <span className="text-sm font-medium text-[var(--alert-error-text)]">Invalid File Format / Corrupt PDF</span>
              </div>
            </div>
          </BentoCard>
        </div>

      </div>
    </div>
  );
}