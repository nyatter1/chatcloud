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
import { ChatlaxyLogo } from './components/ChatlaxyLogo';
import { ProfileData } from './types/bio';
import { RankId } from './types/ranks';
import { addAuditLog } from './utils/auditLogger';
import { signup, login, logout, getCurrentUser, saveUserToFirestore } from './services/apiService';

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
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Initialize and verify active session strictly against live secure HTTP-Only backend cookies
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await getCurrentUser();
        if (res && res.authenticated && res.user) {
          setCurrentUserProfile(res.user);
          setScreenStep('chat');
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    restoreSession();
  }, []);

  // Transition from signup to profile setup: Immediately saves new user to Firestore
  const handleSignupSuccess = async (data: {
    username: string;
    password?: string;
    email?: string;
    age?: string;
    gender?: string;
  }) => {
    if (!data.password) return;

    setUsername(data.username);
    setUserPassword(data.password);
    setUserEmail(data.email);
    setUserAge(data.age);
    setUserGender(data.gender);

    setIsAuthChecking(true);
    try {
      const initialProfile = {
        email: data.email,
        age: data.age,
        gender: data.gender,
        bioSegments: [
          { id: 'initial-bio', text: 'Chatting on chatlaxy. Connect and chill!' },
        ],
        rank: getDefaultRankForUsername(data.username),
        effects: {
          starEffect: true,
          borderEffect: 'subtle-glow',
          pfpBorder: 'square-neon',
        },
      };

      const user = await signup(data.username, data.password, initialProfile);
      if (user) {
        setCurrentUserProfile(user);
        setScreenStep('profile_setup');
      } else {
        alert('Signup failed. Username might already be taken.');
      }
    } catch (err) {
      console.error('Failed to register user:', err);
      alert('Signup failed. Please try again.');
    } finally {
      setIsAuthChecking(false);
    }
  };

  // Transition from profile setup to chatlaxy chat
  const handleProfileDone = async (profile: ProfileData) => {
    const completeProfile: ProfileData = {
      ...profile,
      username: profile.username.trim(),
      email: userEmail || currentUserProfile?.email || profile.email,
      age: profile.age || userAge || currentUserProfile?.age,
      gender: profile.gender || userGender || currentUserProfile?.gender,
      rank: profile.rank ?? currentUserProfile?.rank ?? getDefaultRankForUsername(profile.username),
      chatBackground: profile.chatBackground ?? currentUserProfile?.chatBackground ?? null,
      wallet: profile.wallet ?? currentUserProfile?.wallet ?? {
        ruby: 5,
        gold: 1000,
      },
    };

    try {
      await saveUserToFirestore(completeProfile);
    } catch (err) {
      console.warn('User profile update error:', err);
    }

    setCurrentUserProfile(completeProfile);
    addAuditLog(
      completeProfile.username,
      'User Registered',
      `${completeProfile.username} joined chatlaxy (Age: ${completeProfile.age || 'N/A'}, Gender: ${completeProfile.gender || 'N/A'})`,
      'user'
    );
    setScreenStep('chat');
  };

  // Update profile immediately when modified (e.g. from bio editor, store purchases, etc.)
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
    } catch (err) {
      console.warn('User update error:', err);
    }
  };

  // Login with verified backend account
  const handleLoginSuccess = (user: ProfileData) => {
    setCurrentUserProfile(user);
    addAuditLog(user.username, 'User Logged In', `${user.username} logged into account.`, 'user');
    setScreenStep('chat');
  };

  // Sign out and clear active session
  const handleLogout = async () => {
    setIsAuthChecking(true);
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setCurrentUserProfile(null);
      setUsername('');
      setUserPassword(undefined);
      setUserEmail(undefined);
      setUserAge(undefined);
      setUserGender(undefined);
      setAuthMode('login');
      setScreenStep('auth');
      setIsAuthChecking(false);
    }
  };

  if (isAuthChecking) {
    return (
      <main className="min-h-screen w-full bg-[#121316] text-neutral-100 flex flex-col items-center justify-center select-none animate-pulse">
        <ChatlaxyLogo size="lg" className="mb-2" />
        <span className="text-xs text-neutral-500 font-mono">Verifying secure session...</span>
      </main>
    );
  }

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
        {/* Minimal top bar with logo */}
        <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#23242a]">
          <ChatlaxyLogo size="sm" />
          <span className="text-xs text-neutral-500 font-mono">
            Profile Setup
          </span>
        </header>

        <ProfileSetup
          initialUsername={username || currentUserProfile?.username || 'Member'}
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
        
        {/* Branding Header with Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <ChatlaxyLogo size="lg" className="mb-2" />
          <p className="text-sm text-neutral-400 font-normal tracking-wide mt-1">
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
