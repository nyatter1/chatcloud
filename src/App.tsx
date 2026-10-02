/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { ProfileSetup } from './components/ProfileSetup';
import { ChatScreen } from './components/ChatScreen';
import { AdminPanel } from './components/AdminPanel';
import { ProfileModal } from './components/ProfileModal';
import { ProfileData } from './types/bio';
import { RankId } from './types/ranks';
import { addAuditLog } from './utils/auditLogger';
import { saveUserToFirestore, getUserFromFirestore } from './services/firestoreService';

type ScreenStep = 'auth' | 'profile_setup' | 'chat' | 'admin';
type AuthMode = 'login' | 'signup';

const getDefaultRankForUsername = (name: string): RankId => {
  if (name.trim().toLowerCase() === 'null') {
    return 'DEV';
  }
  return 'VIP';
};

// Persistent accounts helper
const getSavedAccounts = (): Record<string, ProfileData> => {
  try {
    const raw = localStorage.getItem('chatcloud_users');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

const saveAccount = (profile: ProfileData) => {
  try {
    const accounts = getSavedAccounts();
    accounts[profile.username.toLowerCase()] = profile;
    localStorage.setItem('chatcloud_users', JSON.stringify(accounts));
  } catch {}
};

export default function App() {
  const [screenStep, setScreenStep] = useState<ScreenStep>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState<string>('');
  const [userAge, setUserAge] = useState<string | undefined>(undefined);
  const [userGender, setUserGender] = useState<string | undefined>(undefined);
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileData | null>(null);
  const [adminProfileModalTarget, setAdminProfileModalTarget] = useState<string | null>(null);

  // Transition from signup to profile setup
  const handleSignupSuccess = (newUsername: string, age?: string, gender?: string) => {
    setUsername(newUsername);
    setUserAge(age);
    setUserGender(gender);
    setScreenStep('profile_setup');
  };

  // Transition from profile setup to ChatCloud chat
  const handleProfileDone = async (profile: ProfileData) => {
    const accounts = getSavedAccounts();
    const existing = accounts[profile.username.toLowerCase()];

    const completeProfile: ProfileData = {
      ...profile,
      age: profile.age || userAge,
      gender: profile.gender || userGender,
      rank: profile.rank ?? existing?.rank ?? getDefaultRankForUsername(profile.username),
      chatBackground: profile.chatBackground ?? existing?.chatBackground ?? null,
      wallet: profile.wallet ?? existing?.wallet ?? {
        ruby: 5,
        gold: 1000,
      },
    };

    saveAccount(completeProfile);
    saveUserToFirestore(completeProfile).catch((err) =>
      console.warn('Firestore user save error:', err)
    );
    setCurrentUserProfile(completeProfile);
    addAuditLog(
      completeProfile.username,
      'User Registered',
      `${completeProfile.username} completed signup (Age: ${completeProfile.age || 'N/A'}, Gender: ${completeProfile.gender || 'N/A'})`,
      'user'
    );
    setScreenStep('chat');
  };

  // Update profile immediately when modified
  const handleUpdateCurrentUser = (updated: ProfileData) => {
    const completeProfile: ProfileData = {
      ...updated,
      rank: updated.rank ?? getDefaultRankForUsername(updated.username),
      wallet: updated.wallet ?? {
        ruby: 5,
        gold: 1000,
      },
    };
    saveAccount(completeProfile);
    saveUserToFirestore(completeProfile).catch((err) =>
      console.warn('Firestore user update error:', err)
    );
    setCurrentUserProfile(completeProfile);
  };

  // Login with existing account (or create new with starting balance)
  const handleLoginSuccess = async (loginUsername: string) => {
    // Check Firestore first for live cloud sync
    let cloudUser: ProfileData | null = null;
    try {
      cloudUser = await getUserFromFirestore(loginUsername);
    } catch {}

    const accounts = getSavedAccounts();
    const existing = cloudUser || accounts[loginUsername.toLowerCase()];

    if (existing) {
      const withDefaults: ProfileData = {
        ...existing,
        rank: existing.rank ?? getDefaultRankForUsername(existing.username),
        wallet: existing.wallet ?? { ruby: 5, gold: 1000 },
      };
      saveAccount(withDefaults);
      saveUserToFirestore(withDefaults).catch(() => {});
      setCurrentUserProfile(withDefaults);
      addAuditLog(loginUsername, 'User Logged In', `${loginUsername} logged into account.`, 'user');
    } else {
      const newProfile: ProfileData = {
        username: loginUsername,
        profilePicture: null,
        banner: null,
        mood: '',
        bioSegments: [],
        rank: getDefaultRankForUsername(loginUsername),
        chatBackground: null,
        wallet: {
          ruby: 5,
          gold: 1000,
        },
      };
      saveAccount(newProfile);
      saveUserToFirestore(newProfile).catch(() => {});
      setCurrentUserProfile(newProfile);
      addAuditLog(loginUsername, 'User Registered', `${loginUsername} created and logged into account.`, 'user');
    }
    setScreenStep('chat');
  };

  // Sign out and return to ChatCloud login screen
  const handleLogout = () => {
    setCurrentUserProfile(null);
    setUsername('');
    setUserAge(undefined);
    setUserGender(undefined);
    setAuthMode('login');
    setScreenStep('auth');
  };

  // Screen 4: Admin Panel Screen
  if (screenStep === 'admin' && currentUserProfile) {
    return (
      <>
        <AdminPanel
          currentUser={currentUserProfile}
          onBackToChat={() => setScreenStep('chat')}
          onOpenProfile={(target) => setAdminProfileModalTarget(target)}
          onUpdateCurrentUser={handleUpdateCurrentUser}
        />
        <ProfileModal
          isOpen={adminProfileModalTarget !== null}
          targetUserId={adminProfileModalTarget}
          currentUser={currentUserProfile}
          onClose={() => setAdminProfileModalTarget(null)}
          onUpdateCurrentUser={handleUpdateCurrentUser}
        />
      </>
    );
  }

  // Screen 3: ChatCloud Chat Screen
  if (screenStep === 'chat' && currentUserProfile) {
    return (
      <ChatScreen
        currentUser={currentUserProfile}
        onLogout={handleLogout}
        onUpdateCurrentUser={handleUpdateCurrentUser}
        onEditProfile={() => setScreenStep('profile_setup')}
        onOpenAdminPanel={() => setScreenStep('admin')}
      />
    );
  }

  // Screen 2: Profile Setup Screen
  if (screenStep === 'profile_setup') {
    return (
      <main className="min-h-screen w-full bg-[#121316] text-neutral-100 flex flex-col items-center justify-start selection:bg-zinc-800 selection:text-white">
        {/* Minimal top bar with wordmark */}
        <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#23242a]">
          <span className="text-xl font-semibold tracking-tight text-neutral-100 select-none">
            ChatCloud
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            Profile Setup
          </span>
        </header>

        <ProfileSetup
          initialUsername={username || 'Member'}
          initialProfile={currentUserProfile}
          onDone={handleProfileDone}
        />
      </main>
    );
  }

  // Screen 1: Auth Landing (Login / Signup)
  return (
    <main className="min-h-screen w-full bg-[#121316] text-neutral-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12 selection:bg-zinc-800 selection:text-white">
      {/* Central Auth Container */}
      <div className="w-full max-w-[420px] flex flex-col items-center">
        
        {/* Pure Text Branding Header - NO LOGO */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100 select-none">
            ChatCloud
          </h1>
          <p className="text-sm text-neutral-400 font-normal tracking-wide mt-1.5">
            Chat. Connect. Chill.
          </p>
        </div>

        {/* Auth Panel Card */}
        <div className="w-full bg-[#1a1b20] border border-[#282930] rounded-lg shadow-2xl shadow-black/50 p-6 sm:p-7 flex flex-col transition-all duration-200">
          
          {/* Main Mode Toggle Buttons: [ Login ] [ Sign Up ] */}
          <div className="grid grid-cols-2 p-1 bg-[#141518] rounded-md border border-[#25262c] mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2 text-xs sm:text-sm font-medium rounded transition-all duration-150 text-center cursor-pointer ${
                authMode === 'login'
                  ? 'bg-[#282a32] text-neutral-100 shadow-sm border border-[#373944]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`py-2 text-xs sm:text-sm font-medium rounded transition-all duration-150 text-center cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-[#282a32] text-neutral-100 shadow-sm border border-[#373944]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Conditional Forms */}
          {authMode === 'login' ? (
            <LoginForm
              onSwitchToSignup={() => setAuthMode('signup')}
              onLoginSuccess={handleLoginSuccess}
            />
          ) : (
            <SignupForm
              onSwitchToLogin={() => setAuthMode('login')}
              onSignupSuccess={handleSignupSuccess}
            />
          )}
        </div>

        {/* Minimal clean footer text */}
        <div className="mt-8 text-center text-xs text-neutral-600">
          <span>ChatCloud</span> &middot; <span>Authentication</span>
        </div>

      </div>
    </main>
  );
}
