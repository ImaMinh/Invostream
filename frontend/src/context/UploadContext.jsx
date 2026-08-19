import React, { createContext, useContext, useState, useEffect } from 'react';

const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  // Read initial upload ID from sessionStorage on boot
  const [activeUploadId, setActiveUploadId] = useState(() => {
    return sessionStorage.getItem('activeUploadId') || null;
  });

  const [metrics, setMetrics] = useState({
    total_files: 0,
    under_process: 0,
    finished_processed: 0,
    successful_files: 0,
    review_files: 0,
    failed_files: 0,
    progress_percent: 0,
    status: 'idle'
  });

  // Sync activeUploadId changes to sessionStorage
  useEffect(() => {
    if (activeUploadId) {
      sessionStorage.setItem('activeUploadId', activeUploadId);
    } else {
      sessionStorage.removeItem('activeUploadId');
    }
  }, [activeUploadId]);

  // Root SSE listener stays active across page navigation
  useEffect(() => {
    if (!activeUploadId) return;

    // Open persistent SSE stream connection to backend StreamingResponse endpoint
    const sse = new EventSource(`http://localhost:8000/api/invoices/upload/${activeUploadId}/progress`);

    // Handle real-time progress updates pushed from the backend
    sse.onmessage = (event) => {
      try { 
        // Parse incoming SSE JSON payload and sync with React metrics state
        const data = JSON.parse(event.data);
        setMetrics({
          total_files: data.total_files,
          under_process: data.under_process,
          finished_processed: data.finished_processed,
          successful_files: data.successful_files,
          review_files: data.review_files,
          failed_files: data.failed_files,
          progress_percent: data.progress_percent,
          status: data.status
        });

        // Close stream once batch processing is complete
        if (data.status === 'completed') {
          sse.close();
        }
      } catch (err) {
        console.error("Error parsing SSE telemetry frame:", err);
      }
    };

    sse.onerror = (err) => {
      console.error("SSE stream connection error:", err);
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [activeUploadId]);

  const startUpload = (uploadId) => {
    setActiveUploadId(uploadId);
  };

  const resetUpload = () => {
    setActiveUploadId(null);
    setMetrics({
      total_files: 0,
      under_process: 0,
      finished_processed: 0,
      successful_files: 0,
      review_files: 0,
      failed_files: 0,
      progress_percent: 0,
      status: 'idle'
    });
  };

  return (
    <UploadContext.Provider value={{ activeUploadId, metrics, startUpload, resetUpload }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
