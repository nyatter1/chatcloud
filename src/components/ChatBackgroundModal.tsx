import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { uploadImageToCloudinary } from '../utils/cloudinary';

interface ChatBackgroundModalProps {
  isOpen: boolean;
  currentBackground: string | null;
  onClose: () => void;
  onPreviewBackground: (bg: string | null) => void;
  onSaveBackground: (bg: string | null) => void;
  onResetBackground: () => void;
}

export const ChatBackgroundModal: React.FC<ChatBackgroundModalProps> = ({
  isOpen,
  currentBackground,
  onClose,
  onPreviewBackground,
  onSaveBackground,
  onResetBackground,
}) => {
  const [selectedBackground, setSelectedBackground] = useState<string | null>(currentBackground);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBackground(currentBackground);
      setUploadError(null);
    }
  }, [isOpen, currentBackground]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadError(null);
      try {
        const cloudUrl = await uploadImageToCloudinary(file);
        setSelectedBackground(cloudUrl);
        onPreviewBackground(cloudUrl);
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        // Fallback to local base64 if network fails
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setSelectedBackground(result);
          onPreviewBackground(result);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = () => {
    onSaveBackground(selectedBackground);
    onClose();
  };

  const handleCancel = () => {
    // Discard any newly selected preview and restore previous
    onPreviewBackground(currentBackground);
    setSelectedBackground(currentBackground);
    onClose();
  };

  const handleReset = () => {
    onResetBackground();
    setSelectedBackground(null);
    onClose();
  };

  const hasCustomBackground = Boolean(currentBackground || selectedBackground);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click backdrop to cancel */}
      <div className="absolute inset-0" onClick={handleCancel} />

      <div className="relative w-full max-w-[360px] max-h-[92dvh] overflow-y-auto bg-[#16171d] border border-[#2c2e37] rounded-sm p-4 sm:p-5 shadow-2xl shadow-black/90 z-10 text-left flex flex-col gap-3.5 sm:gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262832] pb-3">
          <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
            Chat Background
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            className="p-1 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {uploadError && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            {uploadError}
          </div>
        )}

        {/* Upload Button */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-[#20222a] hover:bg-[#282a35] disabled:opacity-50 border border-[#323442] hover:border-zinc-500 text-neutral-200 hover:text-white rounded-xs text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-300" />
                <span>Uploading to Cloudinary...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                <span>Upload chat background</span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Pricing Label */}
          <span className="text-xs font-semibold text-emerald-400">
            Free
          </span>
        </div>

        {/* Action Buttons: Save & Cancel */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isUploading}
            onClick={handleSave}
            className="flex-1 py-2 bg-zinc-200 hover:bg-white disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xs transition-colors cursor-pointer text-center"
          >
            Save
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={handleCancel}
            className="flex-1 py-2 bg-[#20222a] hover:bg-[#292b36] border border-[#2f313e] text-neutral-300 font-semibold text-xs rounded-xs transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
        </div>

        {/* Reset (Only if user already has a custom chat background) */}
        {hasCustomBackground && (
          <div className="pt-2 border-t border-[#262832]">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleReset}
              className="w-full py-2 bg-[#261a1f] hover:bg-[#341d24] border border-red-900/40 text-red-400 hover:text-red-300 font-semibold text-xs rounded-xs transition-colors cursor-pointer text-center"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
