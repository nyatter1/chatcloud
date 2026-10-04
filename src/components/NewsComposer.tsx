import React, { useState, useRef } from 'react';
import { Upload, X, Send, Image, Video, Loader2 } from 'lucide-react';
import { uploadNewsMediaToCloudinary } from '../utils/cloudinary';

interface NewsComposerProps {
  onPublish: (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | 'gif' | null) => Promise<void>;
  onCancel?: () => void;
  compact?: boolean;
}

export const NewsComposer: React.FC<NewsComposerProps> = ({
  onPublish,
  onCancel,
  compact = false,
}) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'gif' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    const type: 'image' | 'video' | 'gif' = isVideo ? 'video' : isGif ? 'gif' : 'image';

    setSelectedFile(file);
    setMediaType(type);
    setErrorMsg(null);

    // Create local object URL for instant preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveMedia = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && !selectedFile) {
      setErrorMsg('Please enter a message or select media.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let uploadedUrl: string | null = null;
      let finalType = mediaType;

      if (selectedFile) {
        const uploadRes = await uploadNewsMediaToCloudinary(selectedFile);
        uploadedUrl = uploadRes.url;
        finalType = uploadRes.type;
      }

      await onPublish(trimmed, uploadedUrl, finalType);

      // Reset
      setContent('');
      handleRemoveMedia();
    } catch (err: any) {
      console.error('Error publishing news:', err);
      setErrorMsg(err?.message || 'Failed to publish news post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#181922] border border-[#2b2d3d] rounded-xs p-3 flex flex-col gap-2.5 text-left animate-in fade-in duration-150">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
          Create News Announcement
        </span>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Message textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your news announcement..."
        rows={compact ? 2 : 3}
        className="w-full px-3 py-2 bg-[#121318] border border-[#262836] focus:border-purple-400 text-xs text-neutral-100 placeholder:text-neutral-500 rounded-xs outline-none resize-none transition-colors"
      />

      {/* Media Upload Area */}
      {!previewUrl ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-2.5 bg-[#14151b] hover:bg-[#1a1b24] border border-dashed border-[#2f3142] hover:border-neutral-400 rounded-xs flex items-center justify-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer text-xs"
        >
          <Upload className="w-3.5 h-3.5 text-purple-400" />
          <span>Click to upload image, video, or GIF</span>
        </button>
      ) : (
        <div className="relative w-full rounded-xs overflow-hidden bg-[#101115] border border-[#282a38] max-h-48 flex items-center justify-center">
          {mediaType === 'video' ? (
            <video src={previewUrl} controls className="max-h-48 w-full object-contain" />
          ) : (
            <img src={previewUrl} alt="Preview" className="max-h-48 w-full object-cover" />
          )}

          <button
            type="button"
            onClick={handleRemoveMedia}
            className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-xs transition-colors cursor-pointer"
            title="Remove media"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <span className="text-[11px] text-rose-400 font-medium">{errorMsg}</span>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#23242e]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200 rounded-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSend}
          disabled={isSubmitting || (!content.trim() && !selectedFile)}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-3 h-3" />
              <span>Send News</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
