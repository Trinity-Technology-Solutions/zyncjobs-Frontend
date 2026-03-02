import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Edit2, Trash2, Upload } from 'lucide-react';

interface ProfilePhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photo: string, frame?: string) => void;
  currentPhoto?: string;
  currentFrame?: string;
}

const ProfilePhotoEditor: React.FC<ProfilePhotoEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPhoto,
  currentFrame
}) => {
  const [photo, setPhoto] = useState(currentPhoto || '');
  const [selectedFrame, setSelectedFrame] = useState(currentFrame || 'none');
  const [showFrames, setShowFrames] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPhoto(currentPhoto || '');
      setSelectedFrame(currentFrame || 'none');
      setShowFrames(false);
    }
  }, [isOpen, currentPhoto, currentFrame]);

  const frames = [
    { id: 'none', name: 'No Frame', color: 'transparent' },
    { id: 'blue', name: 'Professional', color: '#0A66C2' },
    { id: 'green', name: 'Open to Work', color: '#057642' },
    { id: 'purple', name: 'Hiring', color: '#7C3AED' },
    { id: 'gold', name: 'Premium', color: '#F59E0B' }
  ];

  const handlePhotoUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDelete = () => {
    setPhoto('');
    setSelectedFrame('none');
  };

  const handleSave = () => {
    onSave(photo, selectedFrame);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Profile Photo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Photo Preview */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div 
                className="w-48 h-48 rounded-full overflow-hidden flex items-center justify-center bg-gray-100"
                style={{ 
                  borderWidth: selectedFrame !== 'none' ? '4px' : '0',
                  borderStyle: 'solid',
                  borderColor: frames.find(f => f.id === selectedFrame)?.color 
                }}
              >
                {photo ? (
                  <img 
                    src={photo} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', photo);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => console.log('Image loaded successfully:', photo)}
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Camera className="w-16 h-16 mb-2" />
                    <span className="text-sm">No photo selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center mb-6 transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Drag and drop your photo here, or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose Photo
            </button>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 5MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Frame Selection Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowFrames(!showFrames)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              <span>{showFrames ? 'Hide Frames' : 'Choose Frame'}</span>
            </button>
          </div>

          {/* Frame Selection */}
          {showFrames && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Select Frame</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {frames.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame.id)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      selectedFrame === frame.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className="w-12 h-12 rounded-full border-4 bg-gray-100"
                        style={{ 
                          borderColor: frame.color === 'transparent' ? '#E5E7EB' : frame.color 
                        }}
                      />
                      <span className="text-xs font-medium">{frame.name}</span>
                      {selectedFrame === frame.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handleDelete}
              disabled={!photo}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Photo
            </button>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoEditor;
