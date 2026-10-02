import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Edit2,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { ProfileData } from '../types/bio';
import { SYSTEM_BOT } from '../constants/systemBot';
import { getRankConfig } from '../constants/ranks';
import { RankId } from '../types/ranks';
import { isFounderOrAbove } from '../utils/permissions';
import { addAuditLog } from '../utils/auditLogger';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { saveUserToFirestore } from '../services/firestoreService';

interface ProfileModalProps {
  isOpen: boolean;
  targetUserId: string | null;
  currentUser: ProfileData;
  onClose: () => void;
  onUpdateCurrentUser: (updated: ProfileData) => void;
}

type ProfileTab = 'info' | 'about_me';
type EditMode = 'view' | 'edit_menu' | 'edit_info' | 'edit_bio' | 'edit_mood';

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  targetUserId,
  currentUser,
  onClose,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [editMode, setEditMode] = useState<EditMode>('view');

  // Active profile state
  const [activeProfile, setActiveProfile] = useState<ProfileData>(currentUser);

  // Form states for in-profile editor
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editAge, setEditAge] = useState(currentUser.age || '');
  const [editGender, setEditGender] = useState(currentUser.gender || '');
  const [editMood, setEditMood] = useState(currentUser.mood || '');
  const [editBio, setEditBio] = useState(
    currentUser.bioSegments?.map((s) => s.text).join('') || ''
  );

  const pfpInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Load target profile whenever targetUserId or currentUser changes
  useEffect(() => {
    if (!targetUserId) return;

    if (targetUserId === 'system') {
      setActiveProfile({
        username: SYSTEM_BOT.name,
        profilePicture: SYSTEM_BOT.avatar,
        banner: null,
        mood: '',
        bioSegments: [],
        age: '999',
        gender: '',
        rank: 'BOT',
      });
    } else if (
      targetUserId === 'current_user' ||
      targetUserId.toLowerCase() === currentUser.username.toLowerCase()
    ) {
      setActiveProfile(currentUser);
    } else {
      try {
        const raw = localStorage.getItem('chatcloud_users');
        const accounts: Record<string, ProfileData> = raw ? JSON.parse(raw) : {};
        const found = accounts[targetUserId.toLowerCase()];
        if (found) {
          setActiveProfile(found);
        } else {
          setActiveProfile({
            username: targetUserId,
            profilePicture: null,
            banner: null,
            mood: '',
            bioSegments: [],
            rank: 'VIP',
          });
        }
      } catch {
        setActiveProfile({
          username: targetUserId,
          profilePicture: null,
          banner: null,
          mood: '',
          bioSegments: [],
          rank: 'VIP',
        });
      }
    }
  }, [targetUserId, currentUser, isOpen]);

  // Sync edit form fields whenever activeProfile changes
  useEffect(() => {
    setEditUsername(activeProfile.username);
    setEditAge(activeProfile.age || '');
    setEditGender(activeProfile.gender || '');
    setEditMood(activeProfile.mood || '');
    setEditBio(activeProfile.bioSegments?.map((s) => s.text).join('') || '');
  }, [activeProfile, editMode]);

  // Reset editMode when opening / switching profiles
  useEffect(() => {
    setEditMode('view');
    setActiveTab('info');
  }, [targetUserId, isOpen]);

  if (!isOpen || !targetUserId) return null;

  const isOwner =
    targetUserId === 'current_user' ||
    targetUserId.toLowerCase() === currentUser.username.toLowerCase();
  const isSystemBot = targetUserId === 'system';
  const isDevOrFounder = isFounderOrAbove(currentUser);
  const canEdit = isOwner || (isDevOrFounder && !isSystemBot);

  // Effective rank
  const effectiveRank: RankId = isSystemBot
    ? 'BOT'
    : (activeProfile.rank ||
      (activeProfile.username.toLowerCase() === 'null' ? 'DEV' : 'VIP'));
  const rankConfig = getRankConfig(effectiveRank);

  // Bio plain text
  const plainBioText =
    activeProfile.bioSegments?.map((s) => s.text).join('\n') || '';
  const hasBio = Boolean(plainBioText.trim());

  // Helper to persist updates to activeProfile (and currentUser if owner)
  const saveProfileData = (updated: ProfileData, fieldDescription?: string) => {
    setActiveProfile(updated);
    if (isOwner) {
      onUpdateCurrentUser(updated);
    } else {
      try {
        const raw = localStorage.getItem('chatcloud_users');
        const accounts: Record<string, ProfileData> = raw ? JSON.parse(raw) : {};
        accounts[updated.username.toLowerCase()] = updated;
        localStorage.setItem('chatcloud_users', JSON.stringify(accounts));
        saveUserToFirestore(updated).catch(() => {});
        if (fieldDescription) {
          addAuditLog(
            currentUser.username,
            'Edited User Profile',
            `${currentUser.username} updated ${updated.username}'s ${fieldDescription}`,
            'admin'
          );
        }
      } catch {}
    }
  };

  // Handle uploading new PFP
  const handlePfpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canEdit) {
      try {
        const cloudUrl = await uploadImageToCloudinary(file);
        saveProfileData(
          {
            ...activeProfile,
            profilePicture: cloudUrl,
          },
          'profile picture'
        );
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          saveProfileData(
            {
              ...activeProfile,
              profilePicture: result,
            },
            'profile picture'
          );
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle removing PFP
  const handleRemovePfp = () => {
    if (canEdit) {
      saveProfileData(
        {
          ...activeProfile,
          profilePicture: null,
        },
        'profile picture (removed)'
      );
    }
  };

  // Handle uploading new banner
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canEdit) {
      try {
        const cloudUrl = await uploadImageToCloudinary(file);
        saveProfileData(
          {
            ...activeProfile,
            banner: cloudUrl,
          },
          'banner'
        );
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          saveProfileData(
            {
              ...activeProfile,
              banner: result,
            },
            'banner'
          );
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle removing banner
  const handleRemoveBanner = () => {
    if (canEdit) {
      saveProfileData(
        {
          ...activeProfile,
          banner: null,
        },
        'banner (removed)'
      );
    }
  };

  // Save Info (username, age, gender - ONLY for owner)
  const handleSaveInfo = () => {
    if (!editUsername.trim() || !isOwner) return;
    const updated = {
      ...activeProfile,
      username: editUsername.trim(),
      age: editAge.trim() || undefined,
      gender: editGender.trim() || undefined,
    };
    saveProfileData(updated);
    setEditMode('view');
  };

  // Save Mood
  const handleSaveMood = () => {
    const updated = {
      ...activeProfile,
      mood: editMood.trim(),
    };
    saveProfileData(updated, `mood to "${editMood.trim()}"`);
    setEditMode('view');
  };

  // Save Bio
  const handleSaveBio = () => {
    const updated = {
      ...activeProfile,
      bioSegments: editBio.trim()
        ? [{ id: 'bio-seg-1', text: editBio.trim() }]
        : [],
    };
    saveProfileData(updated, 'bio');
    setEditMode('view');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Hidden file inputs for avatar & banner upload */}
      <input
        ref={pfpInputRef}
        type="file"
        accept="image/*"
        onChange={handlePfpChange}
        className="hidden"
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        onChange={handleBannerChange}
        className="hidden"
      />

      {/* Main Profile Dialog Window */}
      <div
        className="relative z-10 w-full max-w-sm sm:max-w-md bg-[#141519] border border-[#2c2d38] rounded-xs shadow-2xl shadow-black overflow-hidden flex flex-col text-left select-none animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================== */}
        {/* BANNER SECTION                                     */}
        {/* ================================================== */}
        <div className="h-28 sm:h-32 w-full bg-[#1b1c23] relative overflow-hidden border-b border-[#25262f]">
          {activeProfile.banner ? (
            <img
              src={activeProfile.banner}
              alt="Profile banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#1c1e26] flex items-center justify-center">
              <span className="text-neutral-600 text-xs font-mono uppercase tracking-widest select-none">
                ChatCloud
              </span>
            </div>
          )}

          {/* Banner Controls (Camera & X in EDIT mode) */}
          {canEdit && editMode !== 'view' && (
            <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                title="Change banner"
                className="p-1.5 bg-black/60 hover:bg-black/85 text-neutral-200 hover:text-white rounded-xs border border-white/10 transition-colors shadow-sm cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              {activeProfile.banner && (
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  title="Remove banner"
                  className="p-1.5 bg-black/60 hover:bg-black/85 text-neutral-200 hover:text-red-400 rounded-xs border border-white/10 transition-colors shadow-sm cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Top-Right Control Buttons */}
          <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5">
            {/* Pencil: Enter in-profile edit mode */}
            {canEdit && editMode === 'view' && (
              <button
                type="button"
                onClick={() => setEditMode('edit_menu')}
                title={isOwner ? 'Edit profile' : 'Edit user profile (Dev Mode)'}
                className="p-1.5 bg-black/60 hover:bg-black/85 border border-white/10 text-neutral-200 hover:text-white rounded-xs transition-colors shadow-sm cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Back button if inside an edit section */}
            {editMode !== 'view' && (
              <button
                type="button"
                onClick={() => {
                  if (editMode === 'edit_menu') {
                    setEditMode('view');
                  } else {
                    setEditMode('edit_menu');
                  }
                }}
                title="Back"
                className="p-1.5 bg-black/60 hover:bg-black/85 border border-white/10 text-neutral-200 hover:text-white rounded-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px]">Back</span>
              </button>
            )}

            {/* Close X button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile"
              className="p-1.5 bg-black/60 hover:bg-black/85 border border-white/10 text-neutral-200 hover:text-white rounded-xs transition-colors shadow-sm cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================================================== */}
        {/* PROFILE DETAILS CONTAINER                         */}
        {/* ================================================== */}
        <div className="px-5 pt-0 pb-5 relative flex flex-col flex-1">
          {/* Avatar Area with Sharp Square Frame */}
          <div className="relative -mt-10 mb-3 flex items-end justify-between">
            <div className="relative group shrink-0">
              {/* Square Avatar container */}
              <div className="w-20 h-20 rounded-xs border-2 border-[#141519] bg-[#22242c] overflow-hidden flex items-center justify-center shadow-lg ring-1 ring-[#3a3b48]">
                {activeProfile.profilePicture ? (
                  <img
                    src={activeProfile.profilePicture}
                    alt={activeProfile.username}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-neutral-400" />
                )}
              </div>

              {/* PFP Controls in edit mode */}
              {canEdit && editMode !== 'view' && (
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-[#141519]/90 p-0.5 rounded-xs border border-[#343644] shadow-md z-10">
                  <button
                    type="button"
                    onClick={() => pfpInputRef.current?.click()}
                    title="Change profile picture"
                    className="p-1 bg-[#252732] hover:bg-[#343646] text-neutral-200 hover:text-white rounded-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  {activeProfile.profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemovePfp}
                      title="Remove profile picture"
                      className="p-1 bg-[#252732] hover:bg-[#343646] text-neutral-200 hover:text-red-400 rounded-xs transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mood text */}
            {activeProfile.mood ? (
              <div className="mb-1 text-right max-w-[200px] truncate">
                <span className="text-xs text-neutral-300 font-bold italic truncate">
                  &ldquo;{activeProfile.mood}&rdquo;
                </span>
              </div>
            ) : null}
          </div>

          {/* User Name & Handle */}
          <div className="flex flex-col mb-3">
            {/* Rank display: compact icon + WHITE text, NO background, NO badge, NO pill, NO card */}
            {rankConfig && (
              <div className="flex items-center gap-1.5 mb-0.5 select-none">
                <img
                  src={rankConfig.iconUrl}
                  alt={rankConfig.name}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 object-contain shrink-0"
                />
                <span className="text-xs font-bold text-white tracking-wide">
                  {rankConfig.name}
                </span>
              </div>
            )}

            <h2 className="text-lg font-bold text-neutral-100 tracking-tight flex items-center gap-2">
              <span>{activeProfile.username}</span>
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              @{activeProfile.username.toLowerCase().replace(/\s+/g, '')}
            </span>
          </div>

          {/* ================================================== */}
          {/* A. NORMAL VIEW MODE                                */}
          {/* ================================================== */}
          {editMode === 'view' && (
            <>
              {/* Tabs: Info and optionally About me */}
              <div className="flex items-center border-b border-[#25262f] gap-1 mb-3.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-xs border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'info'
                      ? 'border-purple-500 text-neutral-100 bg-[#1b1c23]'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#181920]'
                  }`}
                >
                  Info
                </button>
                {hasBio && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('about_me')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-t-xs border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'about_me'
                        ? 'border-purple-500 text-neutral-100 bg-[#1b1c23]'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#181920]'
                    }`}
                  >
                    About me
                  </button>
                )}
              </div>

              {/* Tab 1: Info */}
              {activeTab === 'info' && (
                <div className="flex flex-col text-xs text-neutral-200 divide-y divide-[#20222a]">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400 font-medium">Username</span>
                    <span className="text-neutral-100 font-semibold">{activeProfile.username}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400 font-medium">Handle</span>
                    <span className="text-neutral-300 font-mono">
                      @{activeProfile.username.toLowerCase().replace(/\s+/g, '')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400 font-medium">Age</span>
                    <span className="text-neutral-200 font-mono">
                      {activeProfile.age || (isSystemBot ? '999' : '—')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400 font-medium">Gender</span>
                    <span className="text-neutral-200">
                      {activeProfile.gender || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400 font-medium">Mood</span>
                    <span className="text-neutral-200 italic font-bold">
                      {activeProfile.mood ? activeProfile.mood : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: About me */}
              {activeTab === 'about_me' && hasBio && (
                <div className="py-2 min-h-[100px] max-h-[220px] overflow-y-auto">
                  <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap break-words select-text">
                    {plainBioText}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================================================== */}
          {/* B. IN-PROFILE EDIT MENU                            */}
          {/* ================================================== */}
          {editMode === 'edit_menu' && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-[#25262f] pb-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  {isOwner ? 'Edit Profile' : `Edit ${activeProfile.username}'s Profile`}
                </span>
                <button
                  type="button"
                  onClick={() => setEditMode('view')}
                  className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Done
                </button>
              </div>

              <div className="flex flex-col gap-1 text-xs">
                {/* Info option ONLY on own profile */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setEditMode('edit_info')}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <span>Edit info</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setEditMode('edit_bio')}
                  className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                >
                  <span>Edit bio</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setEditMode('edit_mood')}
                  className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                >
                  <span>Edit mood</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* C. EDIT INFO FORM (OWNER ONLY)                     */}
          {/* ================================================== */}
          {editMode === 'edit_info' && isOwner && (
            <div className="flex flex-col gap-2.5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-[#25262f] pb-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Edit Info
                </span>
                <button
                  type="button"
                  onClick={() => setEditMode('edit_menu')}
                  className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#101115] border border-[#2c2e37] rounded-xs text-neutral-100 outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-neutral-400 font-medium">Age</label>
                    <input
                      type="text"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      placeholder="e.g. 17"
                      className="w-full px-2.5 py-1.5 bg-[#101115] border border-[#2c2e37] rounded-xs text-neutral-100 outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-neutral-400 font-medium">Gender</label>
                    <input
                      type="text"
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      placeholder="e.g. Male"
                      className="w-full px-2.5 py-1.5 bg-[#101115] border border-[#2c2e37] rounded-xs text-neutral-100 outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[#25262f]">
                <button
                  type="button"
                  onClick={() => setEditMode('edit_menu')}
                  className="px-3 py-1.5 bg-[#1e2027] hover:bg-[#282a34] text-neutral-300 rounded-xs text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveInfo}
                  className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 font-semibold rounded-xs text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* D. EDIT BIO FORM                                   */}
          {/* ================================================== */}
          {editMode === 'edit_bio' && (
            <div className="flex flex-col gap-2.5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-[#25262f] pb-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Edit Bio
                </span>
                <button
                  type="button"
                  onClick={() => setEditMode('edit_menu')}
                  className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-400 font-medium">
                  Bio / About Me
                </label>
                <textarea
                  rows={5}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Write bio here..."
                  className="w-full px-3 py-2 bg-[#101115] border border-[#2c2e37] rounded-xs text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-zinc-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[#25262f]">
                <button
                  type="button"
                  onClick={() => setEditMode('edit_menu')}
                  className="px-3 py-1.5 bg-[#1e2027] hover:bg-[#282a34] text-neutral-300 rounded-xs text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBio}
                  className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 font-semibold rounded-xs text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* E. EDIT MOOD FORM                                  */}
          {/* ================================================== */}
          {editMode === 'edit_mood' && (
            <div className="flex flex-col gap-2.5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-[#25262f] pb-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Edit Mood
                </span>
                <button
                  type="button"
                  onClick={() => setEditMode('edit_menu')}
                  className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-400 font-medium">Mood</label>
                <input
                  type="text"
                  value={editMood}
                  onChange={(e) => setEditMood(e.target.value)}
                  placeholder="e.g. Gaming, Vibing, Chilling"
                  className="w-full px-3 py-2 bg-[#101115] border border-[#2c2e37] rounded-xs text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[#25262f]">
                <button
                  type="button"
                  onClick={() => setEditMode('edit_menu')}
                  className="px-3 py-1.5 bg-[#1e2027] hover:bg-[#282a34] text-neutral-300 rounded-xs text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMood}
                  className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 font-semibold rounded-xs text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
