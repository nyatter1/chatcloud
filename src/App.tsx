/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

const SESSION_KEY = 'chatlaxy_current_session';

export default function App() {
  const [screenStep, setScreenStep] = useState<ScreenStep>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [userAge, setUserAge] = useState<string | undefined>(undefined);
  const [userGender, setUserGender] = useState<string | undefined>(undefined);
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileData | null>(null);
  const [adminProfileModalTarget, setAdminProfileModalTarget] = useState<string | null>(null);

  // Initialize and verify active session strictly against live Firestore
  useEffect(() => {
    // Delete any old legacy offline accounts cache
    try {
      localStorage.removeItem('chatcloud_users');
      localStorage.removeItem('chatcloud_profile');
    } catch {}

    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.username) {
            // Verify with Firestore
            const liveUser = await getUserFromFirestore(parsed.username);
            if (liveUser) {
              setCurrentUserProfile(liveUser);
              setScreenStep('chat');
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
          }
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    };

    restoreSession();
  }, []);

  // Transition from signup to profile setup
  const handleSignupSuccess = (data: {
    username: string;
    password?: string;
    email?: string;
    age?: string;
    gender?: string;
  }) => {
    setUsername(data.username);
    setUserPassword(data.password);
    setUserEmail(data.email);
    setUserAge(data.age);
    setUserGender(data.gender);
    setScreenStep('profile_setup');
  };

  // Transition from profile setup to chatlaxy chat
  const handleProfileDone = async (profile: ProfileData) => {
    const completeProfile: ProfileData = {
      ...profile,
      username: profile.username.trim(),
      password: userPassword || profile.password,
      email: userEmail || profile.email,
      age: profile.age || userAge,
      gender: profile.gender || userGender,
      rank: profile.rank ?? getDefaultRankForUsername(profile.username),
      chatBackground: profile.chatBackground ?? null,
      wallet: profile.wallet ?? {
        ruby: 5,
        gold: 1000,
      },
    };

    try {
      await saveUserToFirestore(completeProfile);
      localStorage.setItem(SESSION_KEY, JSON.stringify(completeProfile));
    } catch (err) {
      console.warn('Firestore user save error:', err);
    }

    setCurrentUserProfile(completeProfile);
    addAuditLog(
      completeProfile.username,
      'User Registered',
      `${completeProfile.username} registered (Age: ${completeProfile.age || 'N/A'}, Gender: ${completeProfile.gender || 'N/A'})`,
      'user'
    );
    setScreenStep('chat');
  };

  // Update profile immediately when modified
  const handleUpdateCurrentUser = async (updated: ProfileData) => {
    const completeProfile: ProfileData = {
      ...updated,
      rank: updated.rank ?? getDefaultRankForUsername(updated.username),
      wallet: updated.wallet ?? {
        ruby: 5,
        gold: 1000,
      },
    };
    setCurrentUserProfile(completeProfile);
    try {
      await saveUserToFirestore(completeProfile);
      localStorage.setItem(SESSION_KEY, JSON.stringify(completeProfile));
    } catch (err) {
      console.warn('Firestore user update error:', err);
    }
  };

  // Login with verified Firestore account
  const handleLoginSuccess = (user: ProfileData) => {
    setCurrentUserProfile(user);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {}
    addAuditLog(user.username, 'User Logged In', `${user.username} logged into account.`, 'user');
    setScreenStep('chat');
  };

  // Sign out and clear active session
  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    setCurrentUserProfile(null);
    setUsername('');
    setUserPassword(undefined);
    setUserEmail(undefined);
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

  // Screen 3: chatlaxy Chat Screen
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
            chatlaxy
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
            chatlaxy
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
          <span>chatlaxy</span> &middot; <span>Authentication</span>
        </div>

      </div>
    </main>
  );
}
