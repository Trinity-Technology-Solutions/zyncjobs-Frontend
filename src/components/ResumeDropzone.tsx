import React, { useState } from 'react';
import { Upload, Linkedin } from 'lucide-react';

interface ResumeDropzoneProps {
  onFileUrlChange: (fileUrl: string | null) => void;
  playgroundView?: boolean;
}

export const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({ onFileUrlChange, playgroundView }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'linkedin'>('resume');

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
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setActiveTab('resume');
            setTimeout(() => document.getElementById('resume-file-input')?.click(), 50);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'resume'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Resume
        </button>
        <button
          onClick={() => setActiveTab('linkedin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'linkedin'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Import from LinkedIn
        </button>
      </div>

      {/* Resume Upload Tab */}
      {activeTab === 'resume' && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
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
      )}

      {/* LinkedIn Import Tab */}
      {activeTab === 'linkedin' && (
        <div className="border-2 border-blue-200 rounded-lg bg-blue-50 p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Import from LinkedIn</h3>
              <p className="text-xs text-blue-700">Auto-fill your profile from LinkedIn PDF</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-5">
            {[
              { step: '1', text: 'Go to linkedin.com and login', icon: '🌐' },
              { step: '2', text: 'Click your Profile photo → View Profile', icon: '👤' },
              { step: '3', text: 'Click "More" button → Save to PDF', icon: '📄' },
              { step: '4', text: 'Upload that downloaded PDF below', icon: '⬆️' },
            ].map(({ step, text, icon }) => (
              <div key={step} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-blue-100">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {step}
                </div>
                <span className="text-sm text-gray-700">{icon} {text}</span>
              </div>
            ))}
          </div>

          {/* What gets imported */}
          <div className="bg-white rounded-lg p-3 border border-blue-100 mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">✅ What gets auto-filled:</p>
            <div className="flex flex-wrap gap-1.5">
              {['Name', 'Email', 'Phone', 'Location', 'Job Title', 'Skills', 'Experience', 'Education', 'Summary'].map(f => (
                <span key={f} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </div>

          {/* Upload button */}
          <div
            className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
              isDragOver ? 'border-blue-500 bg-blue-100' : 'border-blue-300 hover:border-blue-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <p className="text-sm text-blue-800 font-medium mb-3">Upload your LinkedIn PDF here</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              id="linkedin-file-input"
            />
            <label
              htmlFor="linkedin-file-input"
              className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer text-sm font-medium"
            >
              Choose LinkedIn PDF
            </label>
            <p className="text-xs text-blue-600 mt-2">Same parser — works perfectly with LinkedIn PDFs</p>
          </div>

          {/* Quick link */}
          <a
            href="https://www.linkedin.com/in/me"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Open LinkedIn Profile →
          </a>
        </div>
      )}
    </div>
  );
};
