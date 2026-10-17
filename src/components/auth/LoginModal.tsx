import React, { useState } from 'react';
import { Mail, Shield, Check, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { Modal, Button } from '@dineflow/ui';
import { supabase } from '@dineflow/database';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSelectDemoUser?: (persona: 'hotel_owner' | 'hotel_manager' | 'super_admin') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSelectDemoUser,
}) => {
  const [email, setEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      setErrorMessage(
        err.message ||
          'Google authentication could not be completed. You can use the instant demo credentials below.'
      );
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      setIsEmailLoading(true);
      setErrorMessage(null);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      setIsEmailLoading(false);
      if (error) throw error;
      setEmailSent(true);
    } catch (err: any) {
      setIsEmailLoading(false);
      setErrorMessage(err.message || 'Failed to send login link.');
    }
  };

  const handleDemoLogin = (persona: 'hotel_owner' | 'hotel_manager' | 'super_admin') => {
    if (onSelectDemoUser) {
      onSelectDemoUser(persona);
    }
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to DineFlow"
      description="Sign in to create your hotel digital menu or manage your restaurant."
      maxWidth="md"
    >
      <div className="space-y-5">
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {emailSent ? (
          <div className="p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-2xl text-center space-y-2">
            <Check className="w-8 h-8 mx-auto text-emerald-400" />
            <h4 className="font-bold text-sm text-white">Magic Login Link Sent</h4>
            <p className="text-xs text-slate-300">
              Check your inbox at <strong>{email}</strong> and click the link to log in.
            </p>
          </div>
        ) : (
          <>
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs rounded-xl shadow-md transition flex items-center justify-center gap-3 cursor-pointer border border-slate-200 active:scale-[0.98] disabled:opacity-50"
            >
              {/* Google G logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-4 text-slate-500 text-[11px] uppercase tracking-wider">
                Or with Email Link
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            {/* Email Magic Link Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@restaurant.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="md"
                className="w-full"
                isLoading={isEmailLoading}
              >
                Send Magic Sign In Link
              </Button>
            </form>
          </>
        )}

        {/* Instant Demo Accounts */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Instant One-Click Demo Logins:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('hotel_owner')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-left transition cursor-pointer"
            >
              <p className="text-xs font-semibold text-white">Hotel Owner</p>
              <p className="text-[10px] text-orange-400">Marco (Gusto Bistro)</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('hotel_manager')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-left transition cursor-pointer"
            >
              <p className="text-xs font-semibold text-white">Hotel Manager</p>
              <p className="text-[10px] text-sky-400">Priya (Malabar)</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('super_admin')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-left transition cursor-pointer"
            >
              <p className="text-xs font-semibold text-white">Super Admin</p>
              <p className="text-[10px] text-purple-400">Platform Owner</p>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
