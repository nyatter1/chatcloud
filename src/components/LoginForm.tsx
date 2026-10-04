import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { getUserFromFirestore } from '../services/apiService';
import { ProfileData } from '../types/bio';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onLoginSuccess: (user: ProfileData) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Please enter your username';
    }

    if (!password) {
      newErrors.password = 'Please enter your password';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Check live Firestore account
      const cleanUsername = identifier.trim();
      const firestoreUser = await getUserFromFirestore(cleanUsername);

      if (!firestoreUser) {
        setGeneralError('Account not found in Firestore. Please register first.');
        setIsLoading(false);
        return;
      }

      // Check password if stored
      if (firestoreUser.password && firestoreUser.password !== password) {
        setGeneralError('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Successful live login
      onLoginSuccess(firestoreUser);
    } catch (err: any) {
      console.error('Login error:', err);
      setGeneralError('Unable to connect to database. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full" noValidate>
      {/* General live error notice */}
      {generalError && (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#25181a] border border-red-900/60 text-red-300 text-xs leading-relaxed animate-in fade-in duration-200 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Username Field */}
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="login-identifier" className="text-xs font-medium text-neutral-300">
          Username
        </label>
        <input
          id="login-identifier"
          type="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setGeneralError(null);
            if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
          }}
          placeholder="Enter username"
          autoComplete="username"
          disabled={isLoading}
          className={`w-full px-3.5 py-2.5 text-sm bg-[#16171a] border rounded-md text-neutral-100 placeholder-neutral-500 outline-none transition-colors ${
            errors.identifier
              ? 'border-red-500/80 focus:border-red-400'
              : 'border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400'
          }`}
        />
        {errors.identifier && (
          <span className="text-[11px] text-red-400 tracking-wide mt-0.5">
            {errors.identifier}
          </span>
        )}
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-1.5 text-left">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-xs font-medium text-neutral-300">
            Password
          </label>
        </div>
        <div className="relative flex items-center">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setGeneralError(null);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Enter password"
            autoComplete="current-password"
            disabled={isLoading}
            className={`w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#16171a] border rounded-md text-neutral-100 placeholder-neutral-500 outline-none transition-colors ${
              errors.password
                ? 'border-red-500/80 focus:border-red-400'
                : 'border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-neutral-400 hover:text-neutral-200 transition-colors p-1 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <span className="text-[11px] text-red-400 tracking-wide mt-0.5">
            {errors.password}
          </span>
        )}
      </div>

      {/* Submit Login Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-2.5 px-4 bg-zinc-200 hover:bg-white disabled:opacity-50 text-zinc-950 font-medium text-sm rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-[#1a1b20] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            <span>Verifying...</span>
          </>
        ) : (
          <span>Login</span>
        )}
      </button>

      {/* Switch to Signup */}
      <div className="pt-2 text-center text-xs text-neutral-400">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-neutral-200 hover:text-white font-medium underline underline-offset-4 decoration-neutral-600 hover:decoration-neutral-300 transition-colors ml-1 cursor-pointer"
        >
          Sign Up
        </button>
      </div>
    </form>
  );
};
