import React, { useState, useRef } from 'react';
import { Plus, Upload, FolderPlus, FolderUp } from 'lucide-react';
import { readDirectoryHandle } from '../../utils/fileSystem';
import './FloatingActionButton.css';

export function FloatingActionButton({ onUploadFiles, onUploadFolder, onOpenNewFolder }) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
      e.target.value = '';
      setIsOpen(false);
    }
  };

  const handleFolderChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFolder ? onUploadFolder(e.target.files) : onUploadFiles(e.target.files);
      e.target.value = '';
      setIsOpen(false);
    }
  };

  const handlePickFolder = async () => {
    // If modern File System Access API is supported, pick directory and capture all empty subfolders too
    if (typeof window !== 'undefined' && window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        if (dirHandle) {
          const extractedFiles = await readDirectoryHandle(dirHandle);
          if (extractedFiles && extractedFiles.length > 0) {
            onUploadFolder ? onUploadFolder(extractedFiles) : onUploadFiles(extractedFiles);
            setIsOpen(false);
            return;
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return; // User closed picker
        console.warn('showDirectoryPicker fallback to input:', err.message);
      }
    }
    // Fallback to hidden input
    folderInputRef.current?.click();
  };

  return (
    <div className="vault-fab-container">
      {/* Expanded Quick Actions */}
      {isOpen && (
        <div className="fab-menu">
          <button
            className="fab-menu-item"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Upload size={18} />
            <span>Upload Files</span>
          </button>

          <button
            className="fab-menu-item"
            onClick={handlePickFolder}
          >
            <FolderUp size={18} />
            <span>Upload Folder</span>
          </button>

          <button
            className="fab-menu-item"
            onClick={() => {
              onOpenNewFolder();
              setIsOpen(false);
            }}
          >
            <FolderPlus size={18} />
            <span>New Folder</span>
          </button>
        </div>
      )}

      {/* Main Google Drive-style + Button */}
      <button
        className={`fab-main-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Add files or folders"
        title="Create folder or upload files"
      >
        <Plus size={28} />
      </button>

      {/* Hidden File Picker Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Hidden Folder Picker Input */}
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: 'none' }}
        onChange={handleFolderChange}
      />
    </div>
  );
}
