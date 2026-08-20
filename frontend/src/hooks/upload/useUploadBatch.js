import { useState, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useUpload } from '../../context/UploadContext';
import { fetchWithAuth } from '../../lib/apiClient';

/**
 * Custom hook managing file validation, staging, drag-and-drop actions,
 * and multipart batch submission for the Upload page.
 */
export function useUploadBatch() {
  const { getToken } = useAuth();
  const { metrics, startUpload } = useUpload();

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [sizeAlert, setSizeAlert] = useState(null);

  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

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

  const handleFileSelect = (e) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleUpload = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('folder', file));

      const response = await fetchWithAuth('/invoices/batch', {
        method: 'POST',
        body: formData
      }, getToken);

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.upload_id) {
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

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return {
    files,
    uploading,
    uploadStatus,
    sizeAlert,
    fileInputRef,
    metrics,
    addFiles,
    removeFile,
    handleFileSelect,
    handleUpload,
    triggerFileInput,
  };
}
