import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Edit2, Image as ImageIcon, Eye, Trash2 } from 'lucide-react';

interface ProfilePhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photo: string, frame?: string) => void;
  currentPhoto?: string;
  currentFrame?: string;
}

const ProfilePhotoEditor: React.FC<ProfilePhotoEditorProps> = ({ isOpen, onClose, onSave, currentPhoto, currentFrame }) => {
  const [photo, setPhoto] = useState(currentPhoto || '');
  const [selectedFrame, setSelectedFrame] = useState(currentFrame || 'none');
  const [showFrames, setShowFrames] = useState(false);
  const [editing, setEditing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPhoto(currentPhoto || '');
      setSelectedFrame(currentFrame || 'none');
      setShowFrames(false);
      setEditing(false);
      setZoom(1);
    }
  }, [isOpen, currentPhoto, currentFrame]);

  const frames = [
    { id: 'none', name: 'No Frame', color: 'transparent' },
    { id: 'blue', name: 'Professional', color: '#0A66C2' },
    { id: 'green', name: 'Open to Work', color: '#057642' },
    { id: 'purple', name: 'Hiring', color: '#7C3AED' },
    { id: 'gold', name: 'Premium', color: '#F59E0B' },
  ];
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const handlePhotoUpload = (file: File) => {
    if (!allowedImageTypes.includes(file.type)) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Only JPG, JPEG, PNG, and WEBP files are allowed.' } }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'File size exceeds the maximum limit of 5 MB.' } }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => { setPhoto(reader.result as string); setZoom(1); setEditing(false); };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handlePhotoUpload(file);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) handlePhotoUpload(file);
  };

  const handleDelete = async () => {
    const confirmed = await (window as any).confirmAsync('Are you sure you want to delete your profile photo?');
    if (!confirmed) return;
    setPhoto('');
    setSelectedFrame('none');
  };

  const handleSave = () => {
    if (!photo || zoom === 1) {
      onSave(photo, selectedFrame);
      onClose();
      return;
    }
    const image = new Image();
    image.onload = () => {
      const cropSize = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) {
        onSave(photo, selectedFrame);
        onClose();
        return;
      }
      context.drawImage(image, (image.naturalWidth - cropSize) / 2, (image.naturalHeight - cropSize) / 2, cropSize, cropSize, 0, 0, 512, 512);
      onSave(canvas.toDataURL('image/jpeg', 0.92), selectedFrame);
      onClose();
    };
    image.onerror = () => { onSave(photo, selectedFrame); onClose(); };
    image.src = photo;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-photo-title"
        className={`w-full max-w-[820px] overflow-hidden rounded-2xl border border-white/10 bg-[#1f2328] text-white shadow-2xl transition-colors ${dragOver ? 'ring-2 ring-blue-400' : ''}`}
        onClick={event => event.stopPropagation()}
        onDrop={handleDrop}
        onDragOver={event => { event.preventDefault(); setDragOver(true); }}
        onDragLeave={event => { event.preventDefault(); setDragOver(false); }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 sm:px-8">
          <div>
            <h2 id="profile-photo-title" className="text-lg font-semibold tracking-tight">Profile photo</h2>
            <p className="mt-0.5 text-xs text-gray-400">Preview and update the photo shown on your profile</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close profile photo editor" className="rounded-full p-2 text-gray-300 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-5 pb-5 pt-6 sm:px-8 sm:pt-7">
          <div className="flex min-h-[270px] items-center justify-center sm:min-h-[300px]">
            <div
              className={`relative h-60 w-60 overflow-hidden rounded-full bg-[#292e34] shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:h-[284px] sm:w-[284px] ${dragOver ? 'scale-[1.02]' : ''}`}
              style={{ border: selectedFrame !== 'none' ? `5px solid ${frames.find(frame => frame.id === selectedFrame)?.color}` : '5px solid transparent' }}
            >
              {photo ? (
                <img src={photo} alt="Profile photo preview" className="h-full w-full object-cover transition-transform duration-150" style={{ transform: `scale(${zoom})` }} onError={() => setPhoto('')} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <Camera className="mb-3 h-12 w-12" />
                  <span className="text-sm">No photo selected</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/50 px-3 py-1.5 text-xs font-medium text-gray-100" title="Profile photo visibility">
              <Eye className="h-4 w-4" /> Anyone
            </div>
            <p className="text-right text-[11px] text-gray-400">JPG, PNG, or WEBP · Max 5 MB</p>
          </div>

          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="hidden" />

          {editing && photo && (
            <div className="mx-auto mt-4 max-w-md rounded-xl border border-white/10 bg-black/15 px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-300">
                <label htmlFor="profile-photo-zoom">Adjust crop</label>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input id="profile-photo-zoom" type="range" min="1" max="2" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="w-full accent-blue-500" />
            </div>
          )}

          {showFrames && (
            <div className="mt-5 rounded-xl border border-white/10 bg-black/15 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-100">Choose a frame</h3>
                <button type="button" onClick={() => setShowFrames(false)} className="text-xs text-gray-400 hover:text-white">Done</button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {frames.map(frame => (
                  <button key={frame.id} type="button" onClick={() => setSelectedFrame(frame.id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${selectedFrame === frame.id ? 'border-blue-400 bg-blue-500/15 text-white' : 'border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/5'}`}>
                    <span className="h-4 w-4 shrink-0 rounded-full border-2" style={{ borderColor: frame.color === 'transparent' ? '#9ca3af' : frame.color }} />
                    <span className="truncate">{frame.name}</span>
                    {selectedFrame === frame.id && <Check className="ml-auto h-3.5 w-3.5 text-blue-300" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
            <div className="flex items-end gap-5 sm:gap-7">
              <button type="button" disabled={!photo} onClick={() => setEditing(value => !value)} className="flex min-w-12 flex-col items-center gap-1.5 text-gray-300 transition hover:text-white disabled:opacity-40" title="Adjust photo crop">
                <Edit2 className="h-5 w-5" /><span className="text-xs">Edit</span>
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-w-12 flex-col items-center gap-1.5 text-gray-300 transition hover:text-white" title="Upload a new photo">
                <Camera className="h-5 w-5" /><span className="text-xs">Update</span>
              </button>
              <button type="button" onClick={() => setShowFrames(value => !value)} className={`flex min-w-12 flex-col items-center gap-1.5 transition ${showFrames ? 'text-blue-300' : 'text-gray-300 hover:text-white'}`} title="Choose a photo frame">
                <ImageIcon className="h-5 w-5" /><span className="text-xs">Frames</span>
              </button>
            </div>
            <button type="button" onClick={handleDelete} disabled={!photo} className="flex min-w-12 flex-col items-center gap-1.5 text-gray-300 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40" title="Delete profile photo">
              <Trash2 className="h-5 w-5" /><span className="text-xs">Delete</span>
            </button>
          </div>

          <footer className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white">Cancel</button>
            <button type="button" onClick={handleSave} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">Save changes</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoEditor;
