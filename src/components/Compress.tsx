import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, ArrowDownToLine, ArrowUp, ArrowDown } from 'lucide-react';
import { compressPdfs } from '../utils/pdfProcessor';

export interface CompressFileItem {
  id: string;
  file: File;
  name: string;
  originalSizeBytes: number;
  compressedSizeBytes?: number;
}

export function Compress() {
  const [files, setFiles] = useState<CompressFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    let uploadedFiles: FileList | null = null;
    
    if ('dataTransfer' in event) {
      uploadedFiles = (event as React.DragEvent<HTMLDivElement>).dataTransfer.files;
    } else if (event.target instanceof HTMLInputElement) {
      uploadedFiles = (event.target as HTMLInputElement).files;
    }

    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);

    const newFiles: CompressFileItem[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (file.type !== 'application/pdf') continue;

      newFiles.push({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        originalSizeBytes: file.size
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
    
    setTimeout(() => {
      setIsUploading(false);
    }, 500);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    setFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  const moveFileDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      return newFiles;
    });
  };

  const sortFilesAsc = () => {
    setFiles(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const sortFilesDesc = () => {
    setFiles(prev => [...prev].sort((a, b) => b.name.localeCompare(a.name)));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const processedFiles = await compressPdfs(files, (p) => setProgress(p));
      setFiles(processedFiles);
    } catch (err) {
      alert("Error compressing PDFs. Check console for details.");
    } finally {
      setIsProcessing(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <>
      <div 
        className={`dropzone glass ${isUploading ? 'active' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={isUploading ? undefined : handleFileUpload}
        onClick={() => isUploading ? undefined : fileInputRef.current?.click()}
        style={{ pointerEvents: isUploading ? 'none' : 'auto' }}
      >
        <div className="dropzone-content" style={{ width: '100%' }}>
          <Upload size={48} className="dropzone-icon" />
          <h3>Drag & Drop PDF files to Compress</h3>
          <p className="text-muted">or click to browse</p>
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

      {files.length > 0 && (
        <div className="glass settings-panel">
          <div className="settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} className="dropzone-icon"/>
              <span>Files to Compress ({files.length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="btn-secondary" 
                onClick={sortFilesAsc} 
                title="Sort A-Z"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
              >
                Sort A-Z
              </button>
              <button 
                className="btn-secondary" 
                onClick={sortFilesDesc} 
                title="Sort Z-A"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
              >
                Sort Z-A
              </button>
              <button 
                className="btn-icon" 
                onClick={clearAllFiles} 
                title="Clear all files" 
                style={{ color: 'var(--error)' }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          <div className="file-list">
            {files.map((file, index) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <FileText size={18} className="text-muted"/>
                  <span className="file-name" title={file.name}>{file.name}</span>
                  <span className="file-pages">{formatSize(file.originalSizeBytes)}</span>
                  {file.compressedSizeBytes && (
                    <span className="file-pages" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                      → {formatSize(file.compressedSizeBytes)}
                    </span>
                  )}
                </div>
                <div className="file-controls">
                  <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => moveFileUp(index)} 
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => moveFileDown(index)} 
                      disabled={index === files.length - 1}
                      title="Move down"
                    >
                      <ArrowDown size={18} />
                    </button>
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
              <ArrowDownToLine size={20} />
              {isProcessing ? 'Compressing...' : 'Compress PDF'}
            </button>
          </div>
          
          {isProcessing && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
