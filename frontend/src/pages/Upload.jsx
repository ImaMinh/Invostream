import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, FolderUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [uploadedFilesHistory, setUploadedFilesHistory] = useState(new Set());
  const fileInputRef = useRef(null);

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
    
    const duplicates = newlySelectedFiles.filter(
      file => files.some(f => f.name === file.name) || uploadedFilesHistory.has(file.name)
    );
    
    const uniqueFiles = newlySelectedFiles.filter(
      file => !files.some(f => f.name === file.name) && !uploadedFilesHistory.has(file.name)
    );

    if (duplicates.length > 0) {
      setDuplicateAlert(`Warning: ${duplicates.length} file(s) already exist or were previously uploaded and have been skipped.`);
    } else {
      setDuplicateAlert(null);
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
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    // Simulate an upload process
    try {
      // In a real app, you would use FormData and fetch/axios here
      // const formData = new FormData();
      // files.forEach(file => formData.append('folder', file));
      // await fetch('/api/upload', { method: 'POST', body: formData });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadedFilesHistory(prev => {
        const newHistory = new Set(prev);
        files.forEach(f => newHistory.add(f.name));
        return newHistory;
      });

      setUploadStatus('success');
      setFiles([]);
      setDuplicateAlert(null);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '80vh'
    }}>
      <div className="page-header" style={{ marginBottom: '2rem', width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'center' }}>
        <h1 className="page-title">Upload Invoices</h1>
      </div>

      <div className="upload-container" style={{ width: '100%' }}>
        <div 
          className={`upload-dropzone ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <div className="upload-icon-wrapper">
            <FolderUp size={48} className="upload-icon-main" />
          </div>
          
          <h3 className="upload-heading">Drag & drop your folder here</h3>
          <p className="upload-subheading">or click to browse files</p>
          
          <form id="folder-submission-form" onSubmit={handleUpload} className="hidden-form">
            <input
              ref={fileInputRef}
              name="folder"
              id="folder-submission-form-input"
              type="file"
              webkitdirectory="true"
              directory="true"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </form>
        </div>

        {files.length > 0 && (
          <div className="upload-summary animate-fade-in delay-1">
            <div className="file-info">
              <UploadIcon size={20} className="file-info-icon" />
              <span>{files.length} file{files.length > 1 ? 's' : ''} selected for upload</span>
            </div>
            
            <button 
              className="btn btn-primary upload-btn" 
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon size={18} />
                  Start Upload
                </>
              )}
            </button>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="upload-alert success animate-fade-in">
            <CheckCircle size={20} />
            Files uploaded successfully!
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="upload-alert error animate-fade-in">
            <AlertCircle size={20} />
            An error occurred during upload. Please try again.
          </div>
        )}

        {duplicateAlert && (
          <div className="upload-alert error animate-fade-in" style={{ backgroundColor: 'rgba(253, 203, 110, 0.1)', color: 'var(--warning)', borderColor: 'rgba(253, 203, 110, 0.2)' }}>
            <AlertCircle size={20} />
            {duplicateAlert}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
