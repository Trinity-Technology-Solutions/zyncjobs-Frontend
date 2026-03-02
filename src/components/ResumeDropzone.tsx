import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface ResumeDropzoneProps {
  onFileUrlChange: (fileUrl: string | null) => void;
  playgroundView?: boolean;
}

export const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({ onFileUrlChange, playgroundView }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = (file: File) => {
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      onFileUrlChange(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-lg font-medium text-gray-900 mb-2">
        Drop your resume here or click to browse
      </p>
      <p className="text-sm text-gray-500 mb-4">PDF files only</p>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
        id="resume-file-input"
      />
      <label
        htmlFor="resume-file-input"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
      >
        Choose File
      </label>
    </div>
  );
};