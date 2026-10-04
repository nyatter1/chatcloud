import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { SearchableDropdown } from './SearchableDropdown';
import { GENDER_OPTIONS, AGE_OPTIONS } from '../constants/authOptions';
import { getUserFromFirestore } from '../services/apiService';

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (data: {
    username: string;
    password?: string;
    email?: string;
    age?: string;
    gender?: string;
  }) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSwitchToLogin,
  onSignupSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    email?: string;
    gender?: string;
    age?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const newErrors: {
      username?: string;
      password?: string;
      email?: string;
      gender?: string;
      age?: string;
    } = {};

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      newErrors.username = 'Only letters, numbers, underscores, and dashes allowed';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Gender dropdown validation
    if (!gender) {
      newErrors.gender = 'Please select a gender option';
    }

    // Age dropdown validation
    if (!age) {
      newErrors.age = 'Please select your age';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Verify username uniqueness in live Firestore
      const cleanUsername = username.trim();
      const existingUser = await getUserFromFirestore(cleanUsername);

      if (existingUser) {
        setGeneralError('This username is already taken. Please choose another or log in.');
        setIsLoading(false);
        return;
      }

      onSignupSuccess({
        username: cleanUsername,
        password,
        email: email.trim(),
        age,
        gender,
      });
    } catch (err: any) {
      console.error('Firestore check error during signup:', err);
      // If offline/error, proceed or show notification
      onSignupSuccess({
        username: username.trim(),
        password,
        email: email.trim(),
        age,
        gender,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 w-full" noValidate>
      {/* General error notice */}
      {generalError && (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#25181a] border border-red-900/60 text-red-300 text-xs leading-relaxed animate-in fade-in duration-200 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Username Field */}
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="signup-username" className="text-xs font-medium text-neutral-300">
          Username
        </label>
        <input
          id="signup-username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setGeneralError(null);
            if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
          }}
          placeholder="Choose a username"
          autoComplete="username"
          disabled={isLoading}
          className={`w-full px-3.5 py-2.5 text-sm bg-[#16171a] border rounded-md text-neutral-100 placeholder-neutral-500 outline-none transition-colors ${
            errors.username
              ? 'border-red-500/80 focus:border-red-400'
              : 'border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400'
          }`}
        />
        {errors.username && (
          <span className="text-[11px] text-red-400 tracking-wide mt-0.5">
            {errors.username}
          </span>
        )}
      </div>

      {/* Email Field */}
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="signup-email" className="text-xs font-medium text-neutral-300">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setGeneralError(null);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="name@example.com"
          autoComplete="email"
          disabled={isLoading}
          className={`w-full px-3.5 py-2.5 text-sm bg-[#16171a] border rounded-md text-neutral-100 placeholder-neutral-500 outline-none transition-colors ${
            errors.email
              ? 'border-red-500/80 focus:border-red-400'
              : 'border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400'
          }`}
        />
        {errors.email && (
          <span className="text-[11px] text-red-400 tracking-wide mt-0.5">
            {errors.email}
          </span>
        )}
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="signup-password" className="text-xs font-medium text-neutral-300">
          Password
        </label>
        <div className="relative flex items-center">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setGeneralError(null);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="At least 6 characters"
            autoComplete="new-password"
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

      {/* Gender & Age Dropdowns side-by-side on sm+ screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Gender Dropdown */}
        <SearchableDropdown
          id="signup-gender"
          label="Gender"
          placeholder="Select gender"
          searchPlaceholder="Filter gender options..."
          options={GENDER_OPTIONS}
          value={gender}
          onChange={(val) => {
            setGender(val);
            if (errors.gender) setErrors((prev) => ({ ...prev, gender: undefined }));
          }}
          error={errors.gender}
        />

        {/* Age Dropdown */}
        <SearchableDropdown
          id="signup-age"
          label="Age"
          placeholder="Select age"
          searchPlaceholder="Type to filter age..."
          options={AGE_OPTIONS}
          value={age}
          onChange={(val) => {
            setAge(val);
            if (errors.age) setErrors((prev) => ({ ...prev, age: undefined }));
          }}
          error={errors.age}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-2.5 px-4 bg-zinc-200 hover:bg-white disabled:opacity-50 text-zinc-950 font-medium text-sm rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-[#1a1b20] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            <span>Checking...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>

      {/* Switch to Login */}
      <div className="pt-1.5 text-center text-xs text-neutral-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-neutral-200 hover:text-white font-medium underline underline-offset-4 decoration-neutral-600 hover:decoration-neutral-300 transition-colors ml-1 cursor-pointer"
        >
          Login
        </button>
      </div>
    </form>
  );
};
