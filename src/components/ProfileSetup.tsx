import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw, User, Image as ImageIcon, Loader2 } from 'lucide-react';
import { TextSegment, ProfileData } from '../types/bio';
import { BioEditor } from './BioEditor';
import { ProfilePreview } from './ProfilePreview';
import { uploadImageToCloudinary } from '../utils/cloudinary';

interface ProfileSetupProps {
  initialUsername: string;
  initialProfile?: ProfileData | null;
  onDone: (data: ProfileData) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  initialUsername,
  initialProfile,
  onDone,
}) => {
  const [username, setUsername] = useState(
    initialProfile?.username || initialUsername || ''
  );
  const [profilePicture, setProfilePicture] = useState<string | null>(
    initialProfile?.profilePicture || null
  );
  const [banner, setBanner] = useState<string | null>(
    initialProfile?.banner || null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [mood, setMood] = useState(initialProfile?.mood || '');
  const [bioSegments, setBioSegments] = useState<TextSegment[]>(
    initialProfile?.bioSegments || [
      { id: 'initial-bio', text: 'Chatting on chatlaxy. Connect and chill!' },
    ]
  );

  const [usernameError, setUsernameError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Avatar file handling (Uploads to Cloudinary)
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        const cloudUrl = await uploadImageToCloudinary(file, { isBanner: false });
        setProfilePicture(cloudUrl);
      } catch (err) {
        console.error('Failed to upload avatar to Cloudinary:', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  // Banner file handling (Uploads to Cloudinary)
  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBanner(true);
      try {
        const cloudUrl = await uploadImageToCloudinary(file, { isBanner: true });
        setBanner(cloudUrl);
      } catch (err) {
        console.error('Failed to upload banner to Cloudinary:', err);
      } finally {
        setIsUploadingBanner(false);
      }
    }
  };

  const handleDone = () => {
    if (!username.trim()) {
      setUsernameError('Please enter a username');
      return;
    }

    const profileData: ProfileData = {
      username: username.trim(),
      profilePicture,
      banner,
      mood: mood.trim(),
      bioSegments,
      age: initialProfile?.age,
      gender: initialProfile?.gender,
      rank: initialProfile?.rank,
      chatBackground: initialProfile?.chatBackground,
      wallet: initialProfile?.wallet,
      effects: initialProfile?.effects || {
        starEffect: true,
        borderEffect: 'subtle-glow',
        pfpBorder: 'square-neon',
      },
    };

    // Save locally
    try {
      localStorage.setItem('chatcloud_profile', JSON.stringify(profileData));
    } catch {
      // LocalStorage fallback
    }

    onDone(profileData);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100">
          Set up your profile
        </h1>
        <p className="text-sm text-neutral-400 font-normal tracking-wide mt-1">
          Make your profile yours.
        </p>
      </div>

      {/* Main 2-column layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Setup Form & Editor (7 cols) */}
        <div className="lg:col-span-7 bg-[#1a1b20] border border-[#282930] rounded-lg shadow-2xl shadow-black/50 p-6 sm:p-7 flex flex-col gap-6">
          
          {/* 1. USERNAME */}
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="setup-username" className="text-xs font-medium text-neutral-300">
              Username
            </label>
            <input
              id="setup-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError(null);
              }}
              placeholder="Your username"
              className={`w-full px-3.5 py-2.5 text-sm bg-[#16171a] border rounded-md text-neutral-100 placeholder-neutral-500 outline-none transition-colors ${
                usernameError
                  ? 'border-red-500/80 focus:border-red-400'
                  : 'border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400'
              }`}
            />
            {usernameError && (
              <span className="text-[11px] text-red-400 tracking-wide mt-0.5">
                {usernameError}
              </span>
            )}
          </div>

          {/* 2. PROFILE PICTURE */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-xs font-medium text-neutral-300">
              Profile Picture
            </label>
            <div className="flex items-center gap-4 p-3 bg-[#15161a] border border-[#2a2b33] rounded-md">
              <div className="w-16 h-16 rounded-full bg-[#20222a] border border-[#323440] flex items-center justify-center overflow-hidden shrink-0">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-neutral-500" />
                )}
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="py-1.5 px-3 bg-[#262832] hover:bg-[#31333f] text-neutral-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                  >
                    {profilePicture ? (
                      <>
                        <RefreshCw className="w-3 h-3 text-neutral-400" />
                        <span>Replace</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 text-neutral-400" />
                        <span>Click to upload</span>
                      </>
                    )}
                  </button>

                  {profilePicture && (
                    <button
                      type="button"
                      onClick={() => setProfilePicture(null)}
                      className="py-1.5 px-2.5 text-neutral-400 hover:text-red-400 hover:bg-[#251f22] text-xs rounded transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-neutral-500">
                  PNG, JPG or WebP (square recommended)
                </span>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />
          </div>

          {/* 3. BANNER */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-xs font-medium text-neutral-300">
              Banner
            </label>
            <div className="flex flex-col gap-2 p-3 bg-[#15161a] border border-[#2a2b33] rounded-md">
              {banner ? (
                <div className="relative w-full h-24 bg-[#1f2026] rounded overflow-hidden border border-[#2f313c]">
                  <img
                    src={banner}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm p-1 rounded">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="p-1 text-neutral-200 hover:text-white"
                      title="Replace Banner"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBanner(null)}
                      className="p-1 text-neutral-400 hover:text-red-400"
                      title="Remove Banner"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-full py-5 border border-dashed border-[#343644] hover:border-zinc-500 rounded flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-neutral-500" />
                  <span className="text-xs font-medium">Click to upload banner</span>
                  <span className="text-[10px] text-neutral-500">
                    Recommended ratio 3:1 (e.g. 900x300)
                  </span>
                </button>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerFile}
              className="hidden"
            />
          </div>

          {/* 4. MOOD */}
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="setup-mood" className="text-xs font-medium text-neutral-300">
                Mood
              </label>
              <span className="text-[11px] text-neutral-500">
                Type anything you want
              </span>
            </div>
            <input
              id="setup-mood"
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="feeling pretty good today"
              maxLength={60}
              className="w-full px-3.5 py-2.5 text-sm bg-[#16171a] border border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400 rounded-md text-neutral-100 placeholder-neutral-500 outline-none transition-colors"
            />
          </div>

          {/* 5. RICH BIO EDITOR */}
          <BioEditor
            segments={bioSegments}
            onChange={(newSegments) => setBioSegments(newSegments)}
          />

          {/* DONE BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDone}
              className="w-full py-2.5 px-4 bg-zinc-200 hover:bg-white text-zinc-950 font-medium text-sm rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-[#1a1b20]"
            >
              Done
            </button>
          </div>

        </div>

        {/* Right column: Live Profile Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 flex flex-col gap-3">
          <ProfilePreview
            username={username}
            profilePicture={profilePicture}
            banner={banner}
            mood={mood}
            bioSegments={bioSegments}
          />
        </div>

      </div>
    </div>
  );
};
