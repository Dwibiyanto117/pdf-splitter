import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, SplitSquareHorizontal, Settings } from 'lucide-react';
import { loadPdfData, processPdfs } from './utils/pdfProcessor';
import type { PdfFileItem } from './utils/pdfProcessor';
import './App.css';

function App() {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [globalFrom, setGlobalFrom] = useState<number>(1);
  const [globalTo, setGlobalTo] = useState<number>(2);
  const [mergeOutput, setMergeOutput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    let uploadedFiles: FileList | null = null;
    
    if ('dataTransfer' in event) {
      uploadedFiles = event.dataTransfer.files;
    } else if (event.target instanceof HTMLInputElement) {
      uploadedFiles = event.target.files;
    }

    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newFiles: PdfFileItem[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (file.type !== 'application/pdf') continue;

      try {
        const { totalPages, pdfBytes } = await loadPdfData(file);
        
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          file,
          name: file.name,
          totalPages,
          fromPage: globalFrom,
          toPage: Math.min(globalTo, totalPages), // Restrict based on total pages
          pdfBytes
        });
      } catch (err) {
        console.error(`Failed to read PDF ${file.name}`, err);
      }
      
      setUploadProgress(Math.round(((i + 1) / uploadedFiles.length) * 100));
    }

    setFiles((prev) => [...prev, ...newFiles]);
    
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
    }, 1000);
    
    // Clear the input value so the same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setShowDeleteConfirm(false);
  };

  const updateFileSetting = (id: string, field: 'fromPage' | 'toPage', value: number) => {
    setFiles((prev) => prev.map((f) => {
      if (f.id === id) {
        let newValue = Math.max(1, value);
        if (field === 'toPage') {
          newValue = Math.min(newValue, f.totalPages);
        }
        return { ...f, [field]: newValue };
      }
      return f;
    }));
  };

  const handleGlobalChange = (field: 'from' | 'to', value: number) => {
    const val = Math.max(1, value);
    if (field === 'from') {
      setGlobalFrom(val);
      setFiles((prev) => prev.map((f) => ({ ...f, fromPage: val })));
    } else {
      setGlobalTo(val);
      setFiles((prev) => prev.map((f) => ({ ...f, toPage: Math.min(val, f.totalPages) })));
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      await processPdfs(files, mergeOutput, (p) => setProgress(p));
    } catch (err) {
      alert("Error processing PDFs. Check console for details.");
    } finally {
      setIsProcessing(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>PDF Splitter Pro</h1>
        <p>Extract specific pages from multiple PDF files simultaneously</p>
      </header>

      {/* Global Settings */}
      <div className="glass settings-panel">
        <div className="settings-header">
          <Settings size={20} className="dropzone-icon"/>
          <span>Global Settings</span>
        </div>
        <div className="settings-controls">
          <div className="control-group">
            <label>Default Extract From Page</label>
            <input 
              type="number" 
              min="1" 
              value={globalFrom} 
              onChange={(e) => handleGlobalChange('from', parseInt(e.target.value) || 1)} 
            />
          </div>
          <div className="control-group">
            <label>Default Extract To Page</label>
            <input 
              type="number" 
              min="1" 
              value={globalTo} 
              onChange={(e) => handleGlobalChange('to', parseInt(e.target.value) || 1)} 
            />
          </div>
        </div>
        <div className="control-group" style={{ marginTop: '0.5rem', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="mergeOutput" 
            checked={mergeOutput} 
            onChange={(e) => setMergeOutput(e.target.checked)} 
            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
          />
          <label htmlFor="mergeOutput" style={{ fontSize: '1rem', cursor: 'pointer' }}>
            Merge output into a single PDF
          </label>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        className={`dropzone glass ${isUploading ? 'active' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={isUploading ? undefined : handleFileUpload}
        onClick={() => isUploading ? undefined : fileInputRef.current?.click()}
        style={{ pointerEvents: isUploading ? 'none' : 'auto' }}
      >
        <div className="dropzone-content" style={{ width: '100%' }}>
          {isUploading ? (
            <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', textAlign: 'center' }}>
              <Upload size={48} className="dropzone-icon uploading-icon" />
              <h3>Uploading {uploadProgress}%</h3>
              <div className="progress-bar-container" style={{ marginTop: '1rem' }}>
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          ) : (
            <>
              <Upload size={48} className="dropzone-icon" />
              <h3>Drag & Drop PDF files here</h3>
              <p className="text-muted">or click to browse</p>
            </>
          )}
        </div>
        <input 
          type="file" 
          multiple 
          accept="application/pdf" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
          disabled={isUploading}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="glass settings-panel">
          <div className="settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} className="dropzone-icon"/>
              <span>Selected Files ({files.length})</span>
            </div>
            <button 
              className="btn-icon" 
              onClick={() => setShowDeleteConfirm(true)} 
              title="Delete all files" 
              style={{ color: 'var(--error)' }}
            >
              <Trash2 size={20} />
            </button>
          </div>
          <div className="file-list">
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <FileText size={18} className="text-muted"/>
                  <span className="file-name" title={file.name}>{file.name}</span>
                  <span className="file-pages">{file.totalPages} pages</span>
                </div>
                <div className="file-controls">
                  <div className="file-input-group">
                    <label>From</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={file.totalPages}
                      value={file.fromPage}
                      onChange={(e) => updateFileSetting(file.id, 'fromPage', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="file-input-group">
                    <label>To</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={file.totalPages}
                      value={file.toPage}
                      onChange={(e) => updateFileSetting(file.id, 'toPage', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <button className="btn-icon" onClick={() => removeFile(file.id)} title="Remove file">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button 
              className="btn-primary" 
              onClick={handleProcess} 
              disabled={isProcessing}
            >
              <SplitSquareHorizontal size={20} />
              {isProcessing ? 'Processing...' : (mergeOutput ? 'Split & Download Merged PDF' : 'Split & Download ZIP')}
            </button>
          </div>
          
          {isProcessing && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h3>Are you sure want to delete all files?</h3>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-confirm" onClick={clearAllFiles}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
