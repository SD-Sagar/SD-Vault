import React from 'react';
import {
  Folder,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File
} from 'lucide-react';

export function ItemIcon({ category, size = 26 }) {
  switch (category) {
    case 'folder':
      return <Folder size={size} />;
    case 'image':
      return <FileImage size={size} />;
    case 'video':
      return <FileVideo size={size} />;
    case 'audio':
      return <FileAudio size={size} />;
    case 'pdf':
      return <FileText size={size} />;
    case 'archive':
      return <FileArchive size={size} />;
    case 'code':
      return <FileCode size={size} />;
    case 'spreadsheet':
      return <FileSpreadsheet size={size} />;
    case 'document':
      return <FileText size={size} />;
    default:
      return <File size={size} />;
  }
}

