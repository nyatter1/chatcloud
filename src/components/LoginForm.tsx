import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onLoginSuccess?: (username: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  const [validatedFeedback, setValidatedFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForgotNotice(false);
    setValidatedFeedback(null);

    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Please enter your username or ID';
    }

    if (!password) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (onLoginSuccess) {
      onLoginSuccess(identifier.trim());
    } else {
      setValidatedFeedback(
        'Login credentials format validated client-side. Backend connection will be implemented in the next phase.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full" noValidate>
      {/* Client-side submission status feedback */}
      {validatedFeedback && (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#18211b] border border-emerald-900/60 text-emerald-300 text-xs leading-relaxed animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>{validatedFeedback}</span>
        </div>
      )}

      {/* Forgot password info notice */}
      {showForgotNotice && (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#22201b] border border-amber-900/50 text-amber-200/90 text-xs leading-relaxed animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>Password recovery is temporarily unavailable until backend setup.</span>
        </div>
      )}

      {/* Username or ID Field */}
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="login-identifier" className="text-xs font-medium text-neutral-300">
          Username or ID
        </label>
        <input
          id="login-identifier"
          type="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
          }}
          placeholder="Enter username or ID"
          autoComplete="username"
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
          <button
            type="button"
            onClick={() => setShowForgotNotice((prev) => !prev)}
            className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative flex items-center">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Enter password"
            autoComplete="current-password"
            className={`w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#16171a] border rounded-md text-neutral-100 placeholder-neutral-500 outline-none transition-colors ${
              errors.password
                ? 'border-red-500/80 focus:border-red-400'
                : 'border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
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
        className="w-full mt-2 py-2.5 px-4 bg-zinc-200 hover:bg-white text-zinc-950 font-medium text-sm rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-[#1a1b20]"
      >
        Login
      </button>

      {/* Switch to Signup */}
      <div className="pt-2 text-center text-xs text-neutral-400">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-neutral-200 hover:text-white font-medium underline underline-offset-4 decoration-neutral-600 hover:decoration-neutral-300 transition-colors ml-1"
        >
          Sign Up
        </button>
      </div>
    </form>
  );
};
