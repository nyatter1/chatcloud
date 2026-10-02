import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { ProfileData } from '../types/bio';
import { SYSTEM_BOT } from '../constants/systemBot';
import { getRankConfig } from '../constants/ranks';
import { BORDERS, getBorderByIdOrName } from '../constants/borders';
import { RankId } from '../types/ranks';
import { isFounderOrAbove } from '../utils/permissions';
import { addAuditLog } from '../utils/auditLogger';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { saveUserToFirestore, getUserFromFirestore } from '../services/firestoreService';
import { AvatarWithBorder } from './AvatarWithBorder';

interface ProfileModalProps {
  isOpen: boolean;
  targetUserId: string | null;
  currentUser: ProfileData;
  allUsers?: Record<string, ProfileData>;
  onClose: () => void;
  onUpdateCurrentUser: (updated: ProfileData) => void;
}

type ProfileTab = 'info' | 'about_me';
type EditMode = 'view' | 'edit_menu' | 'edit_info' | 'edit_customisation' | 'edit_bio' | 'edit_mood';
type CustomiseView = 'single' | 'grid';

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  targetUserId,
  currentUser,
  allUsers = {},
  onClose,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [editMode, setEditMode] = useState<EditMode>('view');
  const [customiseView, setCustomiseView] = useState<CustomiseView>('single');

  // Active profile state
  const [activeProfile, setActiveProfile] = useState<ProfileData>(currentUser);

  // Border Customisation state
  const [selectedBorderIndex, setSelectedBorderIndex] = useState<number>(0);
  const [justEquipped, setJustEquipped] = useState(false);

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

  // Load target profile from allUsers, currentUser, or live Firestore
  useEffect(() => {
    if (!isOpen || !targetUserId) return;

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
        pfpBorder: null,
      });
      return;
    }

    if (
      targetUserId === 'current_user' ||
      targetUserId.toLowerCase().trim() === currentUser.username.toLowerCase().trim()
    ) {
      setActiveProfile(currentUser);
      const currentBorder = currentUser.effects?.pfpBorder || currentUser.pfpBorder;
      const borderItem = getBorderByIdOrName(currentBorder);
      if (borderItem) {
        setSelectedBorderIndex(borderItem.index);
      }
      return;
    }

    // Check in-memory real-time users first
    const cleanTarget = targetUserId.toLowerCase().trim();
    const liveMatch = allUsers[cleanTarget];
    if (liveMatch) {
      setActiveProfile(liveMatch);
      const currentBorder = liveMatch.effects?.pfpBorder || liveMatch.pfpBorder;
      const borderItem = getBorderByIdOrName(currentBorder);
      if (borderItem) {
        setSelectedBorderIndex(borderItem.index);
      }
    } else {
      setActiveProfile({
        username: targetUserId,
        profilePicture: null,
        banner: null,
        mood: '',
        bioSegments: [],
        rank: 'VIP',
        pfpBorder: null,
      });
    }

    // Fetch latest directly from Firestore
    getUserFromFirestore(targetUserId)
      .then((doc) => {
        if (doc) {
          setActiveProfile(doc);
          const currentBorder = doc.effects?.pfpBorder || doc.pfpBorder;
          const borderItem = getBorderByIdOrName(currentBorder);
          if (borderItem) {
            setSelectedBorderIndex(borderItem.index);
          }
        }
      })
      .catch((err) => {
        console.error('Error loading user profile from Firestore:', err);
      });
  }, [targetUserId, currentUser, allUsers, isOpen]);

  // Sync edit form fields whenever activeProfile changes
  useEffect(() => {
    setEditUsername(activeProfile.username);
    setEditAge(activeProfile.age || '');
    setEditGender(activeProfile.gender || '');
    setEditMood(activeProfile.mood || '');
    setEditBio(activeProfile.bioSegments?.map((s) => s.text).join('') || '');

    const currentBorder = activeProfile.effects?.pfpBorder || activeProfile.pfpBorder;
    const borderItem = getBorderByIdOrName(currentBorder);
    if (borderItem) {
      setSelectedBorderIndex(borderItem.index);
    }
  }, [activeProfile, editMode]);

  // Reset editMode when opening / switching profiles
  useEffect(() => {
    setEditMode('view');
    setActiveTab('info');
    setCustomiseView('single');
  }, [targetUserId, isOpen]);

  if (!isOpen || !targetUserId) return null;

  const isOwner =
    targetUserId === 'current_user' ||
    targetUserId.toLowerCase().trim() === currentUser.username.toLowerCase().trim();
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
  const saveProfileData = async (updated: ProfileData, fieldDescription?: string) => {
    setActiveProfile(updated);
    if (isOwner) {
      onUpdateCurrentUser(updated);
    } else {
      try {
        await saveUserToFirestore(updated);
        if (fieldDescription) {
          addAuditLog(
            currentUser.username,
            'Edited User Profile',
            `${currentUser.username} updated ${updated.username}'s ${fieldDescription}`,
            'admin'
          );
        }
      } catch (err) {
        console.error('Error saving updated profile to Firestore:', err);
      }
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

  // Carousel navigation for borders
  const handlePrevBorder = () => {
    setSelectedBorderIndex((prev) => (prev > 0 ? prev - 1 : BORDERS.length - 1));
  };

  const handleNextBorder = () => {
    setSelectedBorderIndex((prev) => (prev < BORDERS.length - 1 ? prev + 1 : 0));
  };

  // Select / Equip current border
  const handleSelectBorder = (borderIdToEquip?: string | null) => {
    if (!isOwner) return;
    const borderId = borderIdToEquip !== undefined ? borderIdToEquip : BORDERS[selectedBorderIndex]?.id;
    const updated: ProfileData = {
      ...activeProfile,
      pfpBorder: borderId || null,
      effects: {
        ...(activeProfile.effects || {}),
        pfpBorder: borderId || undefined,
      },
    };
    saveProfileData(updated, `PFP border to "${borderId || 'None'}"`);
    setJustEquipped(true);
    setTimeout(() => setJustEquipped(false), 2000);
  };

  const currentEquippedBorderId = activeProfile.effects?.pfpBorder || activeProfile.pfpBorder;
  const currentPreviewBorder = BORDERS[selectedBorderIndex] || BORDERS[0];
  const isSelectedBorderEquipped = currentEquippedBorderId === currentPreviewBorder?.id;

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
                chatlaxy
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
          {/* Avatar Area: Shows custom PFP border in VIEW mode */}
          <div className="relative -mt-10 mb-3 flex items-end justify-between">
            <div className="relative group shrink-0">
              {/* Avatar with PFP Border (NOT shown in editor mode to keep upload clean) */}
              <AvatarWithBorder
                src={activeProfile.profilePicture}
                borderId={currentEquippedBorderId}
                alt={activeProfile.username}
                size="2xl"
                shape="circle"
                showBorder={editMode === 'view'}
              />

              {/* PFP Upload Controls in edit mode */}
              {canEdit && editMode !== 'view' && (
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-[#141519]/90 p-0.5 rounded-full border border-[#343644] shadow-md z-20">
                  <button
                    type="button"
                    onClick={() => pfpInputRef.current?.click()}
                    title="Change profile picture"
                    className="p-1 bg-[#252732] hover:bg-[#343646] text-neutral-200 hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  {activeProfile.profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemovePfp}
                      title="Remove profile picture"
                      className="p-1 bg-[#252732] hover:bg-[#343646] text-neutral-200 hover:text-red-400 rounded-full transition-colors cursor-pointer"
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
            {/* Rank display */}
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
          {/* A. NORMAL VIEW MODE (ONLY Info & About Me)         */}
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

                {/* Customisation option ONLY on own profile */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomiseView('single');
                      setEditMode('edit_customisation');
                    }}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Customisation</span>
                    </div>
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
          {/* C. CUSTOMISATION EDITOR (OWNER ONLY)               */}
          {/* ================================================== */}
          {editMode === 'edit_customisation' && isOwner && (
            <div className="flex flex-col animate-in fade-in duration-150 text-left">
              {customiseView === 'single' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full flex items-center justify-between border-b border-[#25262f] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Customise Border
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditMode('edit_menu')}
                      className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>

                  {/* Profile Card Preview in Middle */}
                  <div className="w-full bg-[#181a22] border border-[#2a2c38] rounded-md p-3.5 flex items-center gap-3.5 shadow-lg relative overflow-hidden">
                    {/* Avatar with Previewed Border */}
                    <AvatarWithBorder
                      src={activeProfile.profilePicture}
                      borderId={currentPreviewBorder.id}
                      alt={activeProfile.username}
                      size="xl"
                      shape="circle"
                    />

                    {/* Card Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      {rankConfig && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <img
                            src={rankConfig.iconUrl}
                            alt={rankConfig.name}
                            className="w-3.5 h-3.5 object-contain"
                          />
                          <span className="text-[11px] font-bold text-white tracking-wide">
                            {rankConfig.name}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-bold text-neutral-100 truncate">
                        {activeProfile.username}
                      </span>
                      <span className="text-xs text-neutral-400 truncate">
                        {activeProfile.mood ? `"${activeProfile.mood}"` : 'Chatting on chatlaxy'}
                      </span>
                    </div>
                  </div>

                  {/* Carousel Selector: < [Border Name] > */}
                  <div className="w-full flex items-center justify-between bg-[#121318] border border-[#282a36] rounded-md p-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={handlePrevBorder}
                      aria-label="Previous border"
                      className="p-2 hover:bg-[#20222e] text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col items-center text-center px-2 min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                        {currentPreviewBorder.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Row {currentPreviewBorder.row + 1} &bull; {selectedBorderIndex + 1}/{BORDERS.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextBorder}
                      aria-label="Next border"
                      className="p-2 hover:bg-[#20222e] text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* < view grid > button */}
                  <button
                    type="button"
                    onClick={() => setCustomiseView('grid')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium tracking-wide flex items-center gap-1.5 py-1 px-3 rounded hover:bg-purple-950/30 transition-colors cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>&lt; view grid &gt;</span>
                  </button>

                  {/* [select] Button */}
                  <div className="w-full flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectBorder(currentPreviewBorder.id)}
                      className={`w-full py-2 px-4 rounded font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelectedBorderEquipped
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 hover:bg-white text-zinc-950 shadow-sm'
                      }`}
                    >
                      {justEquipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Equipped!</span>
                        </>
                      ) : isSelectedBorderEquipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Equipped</span>
                        </>
                      ) : (
                        <span>[ Select ]</span>
                      )}
                    </button>
                  </div>

                  {/* Option to clear border */}
                  {currentEquippedBorderId && (
                    <button
                      type="button"
                      onClick={() => handleSelectBorder(null)}
                      className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Remove Border
                    </button>
                  )}
                </div>
              ) : (
                /* Grid View: 5 in each row */
                <div className="flex flex-col gap-2">
                  {/* Grid Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#25262f]">
                    <span className="text-xs font-bold text-neutral-200">
                      Profile Borders (5 in each row)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomiseView('single')}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                    >
                      &lt; Back to preview
                    </button>
                  </div>

                  {/* 5-Column Grid */}
                  <div className="grid grid-cols-5 gap-2 max-h-[260px] overflow-y-auto p-1 border border-[#23252f] rounded-md bg-[#101115]">
                    {BORDERS.map((border) => {
                      const isSelected = selectedBorderIndex === border.index;
                      const isEquipped = currentEquippedBorderId === border.id;

                      return (
                        <button
                          key={border.id}
                          type="button"
                          onClick={() => {
                            setSelectedBorderIndex(border.index);
                            setCustomiseView('single');
                          }}
                          title={border.name}
                          className={`flex flex-col items-center p-1 rounded-sm border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-950/50 border-purple-500 ring-1 ring-purple-500'
                              : isEquipped
                              ? 'bg-[#1e202a] border-emerald-500/80'
                              : 'bg-[#171820] border-[#2c2d38] hover:border-zinc-500'
                          }`}
                        >
                          {/* Thumbnail preview */}
                          <div className="w-10 h-10 relative flex items-center justify-center">
                            <AvatarWithBorder
                              src={activeProfile.profilePicture}
                              borderId={border.id}
                              size="sm"
                              shape="circle"
                            />
                          </div>

                          {/* Border Name */}
                          <span className="text-[9px] text-neutral-300 font-medium text-center truncate w-full mt-1">
                            {border.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================== */}
          {/* D. EDIT INFO FORM (OWNER ONLY)                     */}
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
          {/* E. EDIT BIO FORM                                   */}
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
          {/* F. EDIT MOOD FORM                                  */}
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
