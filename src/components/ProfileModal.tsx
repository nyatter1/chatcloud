import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Edit2,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Music,
  Volume2,
  VolumeX,
  Upload,
  Play,
  Pause,
  Trash2,
  Heart,
} from 'lucide-react';
import { ProfileData } from '../types/bio';
import { SYSTEM_BOT } from '../constants/systemBot';
import { getRankConfig } from '../constants/ranks';
import { RankId } from '../types/ranks';
import { isFounderOrAbove } from '../utils/permissions';
import { addAuditLog } from '../utils/auditLogger';
import { uploadImageToCloudinary, uploadAudioToCloudinary } from '../utils/cloudinary';
import {
  saveUserToFirestore,
  getUserFromFirestore,
  sendNotificationToFirestore,
} from '../services/apiService';
import { AppNotification } from '../types/notifications';
import { ProfileEffectCanvas } from './ProfileEffectCanvas';
import { ProfileEffectsModal } from './ProfileEffectsModal';
import { ProfileBordersModal } from './ProfileBordersModal';
import { ProfileDecorationsModal } from './ProfileDecorationsModal';
import { CustomRankNameModal } from './CustomRankNameModal';
import { StyleCustomizerModal } from './StyleCustomizerModal';
import { TextStyleConfig } from '../types/bio';
import { UserAvatar } from './UserAvatar';
import { getBorderConfig } from '../types/profileBorders';
import { getDecorationConfig } from '../types/profileDecorations';

interface ProfileModalProps {
  isOpen: boolean;
  targetUserId: string | null;
  currentUser: ProfileData;
  allUsers?: Record<string, ProfileData>;
  onClose: () => void;
  onUpdateCurrentUser: (updated: ProfileData) => void;
}

type ProfileTab = 'info' | 'about_me';
type EditMode = 'view' | 'edit_menu' | 'edit_info' | 'edit_bio' | 'edit_mood' | 'edit_music';

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
  const [editSubTab, setEditSubTab] = useState<'info' | 'customisation'>('info');

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
  const [editMusic, setEditMusic] = useState(currentUser.profileMusic || '');

  const [isUploadingPfp, setIsUploadingPfp] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isProfileEffectsOpen, setIsProfileEffectsOpen] = useState(false);
  const [isProfileBordersOpen, setIsProfileBordersOpen] = useState(false);
  const [isProfileDecorationsOpen, setIsProfileDecorationsOpen] = useState(false);
  const [isCustomRankNameOpen, setIsCustomRankNameOpen] = useState(false);
  const [isUsernameColorOpen, setIsUsernameColorOpen] = useState(false);
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);

  // Decoration full-profile overlay state (plays once on profile open, then fades out until re-opened)
  const [showDecorationOverlay, setShowDecorationOverlay] = useState(false);
  const [isDecorationFading, setIsDecorationFading] = useState(false);
  const [decorationKey, setDecorationKey] = useState(0);

  const pfpInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      });
      return;
    }

    const cleanTarget = (
      targetUserId === 'current_user' ? currentUser.username : targetUserId
    ).toLowerCase().trim();

    // Check in-memory real-time users first
    const liveMatch = allUsers[cleanTarget];
    if (liveMatch) {
      setActiveProfile(liveMatch);
    } else if (
      targetUserId === 'current_user' ||
      cleanTarget === currentUser.username.toLowerCase().trim()
    ) {
      setActiveProfile(currentUser);
    } else {
      // Set initial placeholder while fetching from Firestore
      setActiveProfile({
        username: targetUserId,
        profilePicture: null,
        banner: null,
        mood: '',
        bioSegments: [],
        rank: 'VIP',
      });
    }

    // Fetch latest directly from Firestore to ensure real-time accuracy for likes, bio, etc.
    getUserFromFirestore(cleanTarget)
      .then((doc) => {
        if (doc) {
          setActiveProfile(doc);
          if (cleanTarget === currentUser.username.toLowerCase().trim()) {
            onUpdateCurrentUser(doc);
          }
        }
      })
      .catch((err) => {
        console.error('Error loading user profile from Firestore:', err);
      });
  }, [targetUserId, currentUser, allUsers, isOpen, onUpdateCurrentUser]);

  // Sync edit form fields whenever activeProfile changes
  useEffect(() => {
    setEditUsername(activeProfile.username);
    setEditAge(activeProfile.age || '');
    setEditGender(activeProfile.gender || '');
    setEditMood(activeProfile.mood || '');
    setEditBio(activeProfile.bioSegments?.map((s) => s.text).join('') || '');
    setEditMusic(activeProfile.profileMusic || '');
  }, [activeProfile, editMode]);

  // Auto-play profile music instantly on loop when viewing profile
  useEffect(() => {
    if (isOpen && activeProfile.profileMusic && audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsMusicPlaying(true))
          .catch((err) => {
            console.log('Audio autoplay prevented by browser policy:', err);
            setIsMusicPlaying(false);
          });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsMusicPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isOpen, activeProfile.profileMusic]);

  // Reset editMode when opening / switching profiles
  useEffect(() => {
    setEditMode('view');
    setActiveTab('info');
  }, [targetUserId, isOpen]);

  // Track profile view notification ("username is stalking you.")
  useEffect(() => {
    if (!isOpen || !targetUserId || !activeProfile.username || !currentUser.username) {
      return;
    }
    const isOwnerUser =
      targetUserId === 'current_user' ||
      targetUserId.toLowerCase().trim() === currentUser.username.toLowerCase().trim();
    const isBot = targetUserId === 'system';

    if (isOwnerUser || isBot) return;

    const sessionKey = `viewed_${currentUser.username}_${activeProfile.username}`;
    const lastViewed = sessionStorage.getItem(sessionKey);
    const now = Date.now();
    // Only send notification once every 10 minutes per viewed user
    if (!lastViewed || now - parseInt(lastViewed, 10) > 10 * 60 * 1000) {
      sessionStorage.setItem(sessionKey, now.toString());
      const notif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        recipientUsername: activeProfile.username,
        senderUsername: currentUser.username,
        senderAvatar: currentUser.profilePicture || null,
        senderAvatarFrame: currentUser.avatarFrame || currentUser.effects?.pfpBorder || null,
        senderUsernameStyle: currentUser.usernameStyle || null,
        type: 'profile_view',
        text: 'is stalking you.',
        timestamp: Date.now(),
        read: false,
      };
      sendNotificationToFirestore(notif).catch((err) => {
        console.warn('Error sending stalking notification:', err);
      });
    }
  }, [isOpen, targetUserId, activeProfile.username, currentUser]);

  // Handle profile decoration overlay animation (plays once on profile open, then fades out until re-opened)
  useEffect(() => {
    if (!isOpen || !activeProfile.profileDecoration || activeProfile.profileDecoration === 'none') {
      setShowDecorationOverlay(false);
      setIsDecorationFading(false);
      return;
    }

    const decoConfig = getDecorationConfig(activeProfile.profileDecoration);
    if (!decoConfig.assetUrl) {
      setShowDecorationOverlay(false);
      return;
    }

    setShowDecorationOverlay(true);
    setIsDecorationFading(false);
    setDecorationKey(Date.now());

    const duration = decoConfig.durationMs || 4000;
    const fadeOutDelay = Math.max(500, duration - 800);

    const fadeTimer = setTimeout(() => {
      setIsDecorationFading(true);
    }, fadeOutDelay);

    const hideTimer = setTimeout(() => {
      setShowDecorationOverlay(false);
      setIsDecorationFading(false);
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [isOpen, targetUserId, activeProfile.profileDecoration]);

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

  // Handle Like / Dislike Profile
  const isLikedByMe = Boolean(
    activeProfile.likedBy?.some(
      (u) => u.toLowerCase() === currentUser.username.toLowerCase()
    )
  );

  const handleToggleLike = async () => {
    if (isOwner || isSystemBot) return;

    const currentLikedBy = activeProfile.likedBy || [];
    const myName = currentUser.username.toLowerCase();
    const alreadyLiked = currentLikedBy.some((u) => u.toLowerCase() === myName);

    let nextLikedBy: string[];
    let nextLikesCount: number;

    if (alreadyLiked) {
      // Dislike / Unlike
      nextLikedBy = currentLikedBy.filter((u) => u.toLowerCase() !== myName);
      nextLikesCount = Math.max(0, (activeProfile.likesCount || currentLikedBy.length) - 1);
    } else {
      // Like
      nextLikedBy = [...currentLikedBy, currentUser.username];
      nextLikesCount = (activeProfile.likesCount || currentLikedBy.length) + 1;

      // Send notification: "Username liked your profile!"
      const notif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        recipientUsername: activeProfile.username,
        senderUsername: currentUser.username,
        senderAvatar: currentUser.profilePicture || null,
        senderAvatarFrame: currentUser.avatarFrame || currentUser.effects?.pfpBorder || null,
        senderUsernameStyle: currentUser.usernameStyle || null,
        type: 'profile_like',
        text: 'liked your profile!',
        timestamp: Date.now(),
        read: false,
      };
      sendNotificationToFirestore(notif).catch((err) => {
        console.warn('Error sending like notification:', err);
      });
    }

    const updated: ProfileData = {
      ...activeProfile,
      likedBy: nextLikedBy,
      likesCount: nextLikesCount,
    };

    saveProfileData(updated, alreadyLiked ? 'unliked profile' : 'liked profile');
  };

  // Helper to persist updates to activeProfile (and currentUser if owner)
  const saveProfileData = async (updated: ProfileData, fieldDescription?: string) => {
    setActiveProfile(updated);
    try {
      await saveUserToFirestore(updated);
      if (!isOwner && fieldDescription) {
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

    if (isOwner) {
      onUpdateCurrentUser(updated);
    }
  };

  // Handle uploading new PFP
  const handlePfpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canEdit) {
      setIsUploadingPfp(true);
      try {
        const cloudUrl = await uploadImageToCloudinary(file, { isBanner: false });
        await saveProfileData(
          {
            ...activeProfile,
            profilePicture: cloudUrl,
          },
          'profile picture'
        );
      } catch (err) {
        console.error('PFP upload error:', err);
      } finally {
        setIsUploadingPfp(false);
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
      setIsUploadingBanner(true);
      try {
        const cloudUrl = await uploadImageToCloudinary(file, { isBanner: true });
        await saveProfileData(
          {
            ...activeProfile,
            banner: cloudUrl,
          },
          'banner'
        );
      } catch (err) {
        console.error('Banner upload error:', err);
      } finally {
        setIsUploadingBanner(false);
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

  // Toggle music play / pause
  const toggleMusicPlay = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => setIsMusicPlaying(false));
    }
  };

  // Handle uploading music MP3 file to Cloudinary with progress tracking
  const handleMusicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingMusic(true);
      setUploadProgress(0);
      try {
        const cloudUrl = await uploadAudioToCloudinary(file, (pct) => {
          setUploadProgress(pct);
        });
        setEditMusic(cloudUrl);
      } catch (err) {
        console.warn('Audio upload warning, fallback to local data URL:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          setEditMusic(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingMusic(false);
      }
    }
  };

  // Save Music (Uploads to Cloudinary if needed and persists to profile)
  const handleSaveMusic = async () => {
    setIsUploadingMusic(true);
    setUploadProgress(0);
    try {
      let finalMusicUrl = editMusic.trim();
      if (
        finalMusicUrl &&
        !finalMusicUrl.startsWith('http://') &&
        !finalMusicUrl.startsWith('https://')
      ) {
        finalMusicUrl = await uploadAudioToCloudinary(finalMusicUrl, (pct) => {
          setUploadProgress(pct);
        });
      }
      const updated = {
        ...activeProfile,
        profileMusic: finalMusicUrl || null,
      };
      await saveProfileData(updated, 'profile music');
      setEditMode('view');
    } catch (err) {
      console.error('Error saving profile music:', err);
    } finally {
      setIsUploadingMusic(false);
    }
  };

  // Save Profile Effect
  const handleSaveProfileEffect = (effectId: string | null) => {
    const updated = {
      ...activeProfile,
      profileEffect: effectId,
    };
    saveProfileData(updated, `profile effect to "${effectId || 'none'}"`);
  };

  // Save Profile Border
  const handleSaveProfileBorder = (borderId: string | null) => {
    const updated = {
      ...activeProfile,
      profileBorder: borderId,
    };
    saveProfileData(updated, `profile border to "${borderId || 'none'}"`);
  };

  // Save Profile Decoration
  const handleSaveProfileDecoration = (decorationId: string | null) => {
    const updated = {
      ...activeProfile,
      profileDecoration: decorationId,
    };
    saveProfileData(updated, `profile decoration to "${decorationId || 'none'}"`);
  };

  // Save Custom Rank Name
  const handleSaveCustomRankName = (customName: string | null) => {
    const updated = {
      ...activeProfile,
      customRankName: customName,
    };
    saveProfileData(updated, `custom rank name to "${customName || 'default'}"`);
  };

  // Save Username Color & Font Style
  const handleSaveUsernameStyle = (style: TextStyleConfig | null) => {
    const updated = {
      ...activeProfile,
      usernameStyle: style,
    };
    saveProfileData(updated, 'username color and font style');
  };

  // Save Message Text Color & Font Style
  const handleSaveChatTextStyle = (style: TextStyleConfig | null) => {
    const updated = {
      ...activeProfile,
      chatTextStyle: style,
    };
    saveProfileData(updated, 'chat message text color and font style');
  };

  const activeBorderConfig = getBorderConfig(activeProfile.profileBorder);
  const activeProfileDecorationConfig = getDecorationConfig(activeProfile.profileDecoration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Hidden file inputs for avatar, banner & music upload */}
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
      <input
        ref={musicFileInputRef}
        type="file"
        accept="audio/*,.mp3"
        onChange={handleMusicFileChange}
        className="hidden"
      />

      {/* HTML5 Audio element for Profile Music */}
      {activeProfile.profileMusic && (
        <audio
          ref={audioRef}
          src={activeProfile.profileMusic}
          autoPlay
          loop
          playsInline
        />
      )}

      {/* Main Profile Dialog Window */}
      <div
        className={`relative z-10 w-full max-w-sm sm:max-w-md bg-[#141519] rounded-xs shadow-2xl overflow-hidden flex flex-col text-left select-none animate-in zoom-in-95 duration-150 transition-all ${activeBorderConfig.cardClasses}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Decoration: Collectible Animated Overlay across the entire profile */}
        {showDecorationOverlay && activeProfileDecorationConfig.assetUrl && (
          <div
            key={decorationKey}
            className={`absolute inset-0 z-40 pointer-events-none overflow-hidden flex items-center justify-center transition-opacity duration-700 ${
              isDecorationFading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <img
              src={activeProfileDecorationConfig.assetUrl}
              alt={activeProfileDecorationConfig.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover sm:object-fill pointer-events-none select-none"
            />
          </div>
        )}
        {/* ================================================== */}
        {/* BANNER SECTION                                     */}
        {/* ================================================== */}
        <div className="h-28 sm:h-32 w-full bg-[#1b1c23] relative z-0 overflow-hidden border-b border-[#25262f] shrink-0">
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

          {/* Banner Controls: Like button (VIEW mode) or Camera & X (EDIT mode) */}
          {editMode === 'view' ? (
            <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={isOwner || isSystemBot}
                title={
                  isOwner
                    ? 'You cannot like your own profile'
                    : isLikedByMe
                    ? 'Unlike profile'
                    : 'Like profile'
                }
                className={`px-2.5 py-1 rounded-xs flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
                  isLikedByMe
                    ? 'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/40 shadow-rose-900/50'
                    : 'bg-black/60 hover:bg-black/85 text-neutral-200 border border-white/10 hover:border-white/20'
                } ${isOwner || isSystemBot ? 'cursor-default opacity-85' : 'cursor-pointer active:scale-95'}`}
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-transform ${
                    isLikedByMe
                      ? 'fill-current text-white scale-110'
                      : 'text-rose-400 fill-rose-500/20'
                  }`}
                />
                <span className="font-mono text-xs">
                  {activeProfile.likesCount ?? (activeProfile.likedBy?.length || 0)}
                </span>
              </button>
            </div>
          ) : (
            canEdit && (
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
            )
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
        <div className="px-5 pt-0 pb-5 relative z-10 flex flex-col flex-1">
          {/* Animated Profile Effect (Clipped inside lower section, behind content) */}
          {activeProfile.profileEffect && activeProfile.profileEffect !== 'none' && (
            <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden rounded-b-xs">
              <ProfileEffectCanvas effectId={activeProfile.profileEffect} />
              {/* Subtle dark overlay for 100% text readability */}
              <div className="absolute inset-0 bg-[#141519]/70 pointer-events-none" />
            </div>
          )}

          {/* Avatar Area with Sharp Square Frame */}
          <div className="relative z-20 -mt-10 mb-3 flex items-end justify-between">
            <div className="relative group shrink-0">
              {/* Square Avatar container with Avatar Frame */}
              <UserAvatar
                src={activeProfile.profilePicture}
                username={activeProfile.username}
                frameId={activeProfile.avatarFrame || activeProfile.effects?.pfpBorder}
                size="xl"
                shape="square"
              />

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
                  {activeProfile.customRankName?.trim() || rankConfig.name}
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
              {/* Profile Music Player indicator if set */}
              {activeProfile.profileMusic && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1b22] border border-[#292a36] rounded-xs text-xs mb-3 text-neutral-200">
                  <div className="flex items-center gap-2 truncate">
                    <Music className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
                    <span className="font-semibold text-neutral-300 truncate">
                      Profile Music
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMusicPlay}
                    className="p-1 hover:bg-[#252733] text-neutral-300 hover:text-white rounded-xs cursor-pointer transition-colors"
                    title={isMusicPlaying ? 'Mute/Pause music' : 'Play profile music'}
                  >
                    {isMusicPlaying ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </button>
                </div>
              )}

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

              {/* Editor Tab Headings: Info | Customisation */}
              <div className="flex items-center border-b border-[#25262f] gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => setEditSubTab('info')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-xs border-b-2 transition-colors cursor-pointer ${
                    editSubTab === 'info'
                      ? 'border-purple-500 text-neutral-100 bg-[#1b1c23]'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#181920]'
                  }`}
                >
                  Info
                </button>
                <button
                  type="button"
                  onClick={() => setEditSubTab('customisation')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-xs border-b-2 transition-colors cursor-pointer ${
                    editSubTab === 'customisation'
                      ? 'border-purple-500 text-neutral-100 bg-[#1b1c23]'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#181920]'
                  }`}
                >
                  Customisation
                </button>
              </div>

              {/* Tab 1: Info & Basic Things */}
              {editSubTab === 'info' && (
                <div className="flex flex-col gap-1 text-xs animate-in fade-in duration-100">
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
              )}

              {/* Tab 2: Customisation Features & Options */}
              {editSubTab === 'customisation' && (
                <div className="flex flex-col gap-1 text-xs animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => setIsUsernameColorOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <span>Username Color</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTextColorOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <span>Text Color</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode('edit_music')}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <span>Profile Music</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsProfileEffectsOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <span>Profile Effects</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsProfileBordersOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <span>Profile Borders</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsProfileDecorationsOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <span>Profile Decoration</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCustomRankNameOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#1a1c22] hover:bg-[#22242c] text-neutral-200 rounded-xs border border-[#272932] transition-colors cursor-pointer text-left font-medium"
                  >
                    <span>Custom Rank Name</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
              )}
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

          {/* ================================================== */}
          {/* F. EDIT MUSIC FORM                                 */}
          {/* ================================================== */}
          {editMode === 'edit_music' && (
            <div className="flex flex-col gap-2.5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-[#25262f] pb-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Profile Music
                </span>
                <button
                  type="button"
                  onClick={() => setEditMode('edit_menu')}
                  className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {/* File upload section */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400 font-medium">
                    Upload MP3 File
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => musicFileInputRef.current?.click()}
                      disabled={isUploadingMusic}
                      className="px-3 py-2 bg-[#21232d] hover:bg-[#2a2c38] text-neutral-200 text-xs font-medium rounded-xs border border-[#323444] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingMusic ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span>{editMusic ? 'Change MP3' : 'Upload MP3'}</span>
                    </button>
                    {editMusic && !isUploadingMusic && (
                      <button
                        type="button"
                        onClick={() => setEditMusic('')}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-[#282024] rounded-xs transition-colors cursor-pointer"
                        title="Remove music"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Progress Bar */}
                {isUploadingMusic && (
                  <div className="flex flex-col gap-1 my-1 p-2 bg-[#121317] border border-[#2b2d39] rounded-xs animate-in fade-in duration-100">
                    <div className="flex items-center justify-between text-xs text-neutral-300 font-medium">
                      <span>Uploading...</span>
                      <span className="font-mono text-purple-400 font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#20222c] border border-[#2e303c] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-150 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Music Preview Player if present */}
                {editMusic && !isUploadingMusic && (
                  <div className="mt-1 p-2 bg-[#101115] border border-[#2c2e37] rounded-xs flex flex-col gap-1">
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Music Preview:
                    </span>
                    <audio src={editMusic} controls className="w-full h-8 max-w-full" />
                  </div>
                )}
              </div>

              {/* Buttons */}
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
                  onClick={handleSaveMusic}
                  className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 font-semibold rounded-xs text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Effects Modal */}
        {isProfileEffectsOpen && (
          <ProfileEffectsModal
            isOpen={isProfileEffectsOpen}
            currentUser={currentUser}
            onClose={() => setIsProfileEffectsOpen(false)}
            onSaveEffect={handleSaveProfileEffect}
          />
        )}

        {/* Profile Borders Modal */}
        {isProfileBordersOpen && (
          <ProfileBordersModal
            isOpen={isProfileBordersOpen}
            currentUser={activeProfile}
            onClose={() => setIsProfileBordersOpen(false)}
            onSaveBorder={handleSaveProfileBorder}
          />
        )}

        {/* Profile Decorations Modal */}
        {isProfileDecorationsOpen && (
          <ProfileDecorationsModal
            isOpen={isProfileDecorationsOpen}
            currentUser={activeProfile}
            onClose={() => setIsProfileDecorationsOpen(false)}
            onSaveDecoration={handleSaveProfileDecoration}
          />
        )}

        {/* Custom Rank Name Modal */}
        {isCustomRankNameOpen && (
          <CustomRankNameModal
            isOpen={isCustomRankNameOpen}
            currentCustomRankName={activeProfile.customRankName}
            userRank={
              (activeProfile.rank ||
                (activeProfile.username.toLowerCase() === 'null' ? 'DEV' : 'VIP')) as RankId
            }
            onClose={() => setIsCustomRankNameOpen(false)}
            onSave={handleSaveCustomRankName}
          />
        )}

        {/* Username Color & Font Customizer Modal */}
        {isUsernameColorOpen && (
          <StyleCustomizerModal
            isOpen={isUsernameColorOpen}
            type="username"
            initialStyle={activeProfile.usernameStyle}
            username={activeProfile.username}
            avatarUrl={activeProfile.profilePicture}
            avatarFrame={activeProfile.avatarFrame || activeProfile.effects?.pfpBorder}
            onClose={() => setIsUsernameColorOpen(false)}
            onSave={handleSaveUsernameStyle}
          />
        )}

        {/* Text / Message Color & Font Customizer Modal */}
        {isTextColorOpen && (
          <StyleCustomizerModal
            isOpen={isTextColorOpen}
            type="text"
            initialStyle={activeProfile.chatTextStyle}
            username={activeProfile.username}
            avatarUrl={activeProfile.profilePicture}
            avatarFrame={activeProfile.avatarFrame || activeProfile.effects?.pfpBorder}
            onClose={() => setIsTextColorOpen(false)}
            onSave={handleSaveChatTextStyle}
          />
        )}
      </div>
    </div>
  );
};
