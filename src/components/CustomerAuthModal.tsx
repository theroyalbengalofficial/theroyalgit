import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, Copy, Check, ExternalLink, Settings, Sparkles } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import BrandLogo from './Logo';

export const CustomerAuthModal: React.FC = () => {
  const {
    isLoginModalOpen,
    loginRedirectNotice,
    closeLoginModal,
    authConfig,
    updateAuthConfig,
    loginWithGoogle,
    loginWithFacebook,
    loginWithCustom,
  } = useCustomerAuth();

  const [mode, setMode] = useState<'social' | 'custom' | 'setup_google' | 'setup_facebook'>('social');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick setup inputs
  const [googleClientIdInput, setGoogleClientIdInput] = useState(authConfig.googleClientId || '');
  const [facebookAppIdInput, setFacebookAppIdInput] = useState(authConfig.facebookAppId || '');
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  useEffect(() => {
    setGoogleClientIdInput(authConfig.googleClientId || '');
    setFacebookAppIdInput(authConfig.facebookAppId || '');
  }, [authConfig]);

  if (!isLoginModalOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const copyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        if (res.requiresSetup) {
          setMode('setup_google');
        } else if (res.error) {
          setErrorMessage(res.error);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await loginWithFacebook();
      if (!res.success) {
        if (res.requiresSetup) {
          setMode('setup_facebook');
        } else if (res.error) {
          setErrorMessage(res.error);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveGoogleAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleClientIdInput.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await updateAuthConfig({ googleClientId: googleClientIdInput.trim() });
      const res = await loginWithGoogle();
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveFacebookAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facebookAppIdInput.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await updateAuthConfig({ facebookAppId: facebookAppIdInput.trim() });
      const res = await loginWithFacebook();
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await loginWithCustom({
        name: customName.trim(),
        email: customEmail.trim(),
        phone: customPhone.trim(),
        address: customAddress.trim(),
        provider: 'email',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-neutral-950 border border-[#F25C05] shadow-[0_20px_50px_rgba(242,92,5,0.3)] p-6 sm:p-8 max-h-[95vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size="md" />
          <h3 className="mt-4 text-lg font-light tracking-[0.2em] uppercase text-white">
            Customer Portal
          </h3>
          <p className="text-xs text-neutral-400 font-light mt-1">
            Made For The Hunt &bull; Bangladesh
          </p>
        </div>

        {/* Mandatory notice if from checkout */}
        {loginRedirectNotice && (
          <div className="mb-5 p-3.5 bg-[#F25C05]/15 border border-[#F25C05] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#F25C05] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-200 leading-relaxed font-light">
              <strong className="text-[#F25C05] font-medium block mb-0.5">Authentication Required</strong>
              {loginRedirectNotice}
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-5 p-3 bg-red-950/60 border border-red-500/50 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* MODE: SOCIAL LOGIN */}
        {mode === 'social' && (
          <div className="space-y-3.5">
            <div className="mb-4 p-3 bg-white/5 border border-white/10 text-center">
              <p className="text-xs text-neutral-300 font-light leading-relaxed">
                Sign in with your <strong>Google</strong> or <strong>Facebook</strong> account, or proceed with your contact details.
              </p>
            </div>

            {/* Google / Gmail Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
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
              <span>{isProcessing ? 'Connecting...' : 'Continue with Gmail / Google'}</span>
            </button>

            {/* Facebook Login Button */}
            <button
              onClick={handleFacebookLogin}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{isProcessing ? 'Connecting...' : 'Continue with Facebook'}</span>
            </button>

            <div className="relative py-2 flex items-center justify-center">
              <div className="border-t border-white/10 w-full absolute" />
              <span className="bg-neutral-950 px-3 text-[11px] text-neutral-400 font-light relative z-10 uppercase tracking-widest">
                or
              </span>
            </div>

            {/* Direct Email / Phone Sign-In Option */}
            <button
              type="button"
              onClick={() => setMode('custom')}
              className="w-full py-3 px-4 border border-white/20 hover:border-[#F25C05] text-white text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue with Name &amp; Phone / Email</span>
            </button>

            {/* OAuth Status Indicator */}
            <div className="pt-2 text-center text-[10px] text-neutral-500 font-mono flex items-center justify-center gap-3">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${authConfig.hasGoogleConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                Google: {authConfig.hasGoogleConfigured ? 'Connected' : 'Setup Required'}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${authConfig.hasFacebookConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                Facebook: {authConfig.hasFacebookConfigured ? 'Connected' : 'Setup Required'}
              </span>
            </div>
          </div>
        )}

        {/* MODE: GOOGLE OAUTH SETUP */}
        {mode === 'setup_google' && (
          <form onSubmit={handleSaveGoogleAndLogin} className="space-y-4">
            <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200">
              <strong className="block font-medium mb-1">Google OAuth Client ID Required</strong>
              To enable actual Google Sign-In for your live domain, enter your Google OAuth 2.0 Client ID from Google Cloud Console.
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                Authorized JavaScript Origin (Add this to Google Cloud Console):
              </label>
              <div className="flex items-center gap-2 bg-black/60 border border-white/20 px-3 py-2 text-xs font-mono text-neutral-300">
                <span className="truncate flex-1">{currentOrigin}</span>
                <button
                  type="button"
                  onClick={copyOrigin}
                  className="text-[#F25C05] hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedOrigin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedOrigin ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                Paste Google Client ID:
              </label>
              <input
                type="text"
                required
                placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com"
                value={googleClientIdInput}
                onChange={(e) => setGoogleClientIdInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/70 border border-white/20 text-white text-xs font-mono tracking-wider focus:border-[#F25C05] focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('social')}
                className="w-1/3 py-2.5 text-xs uppercase tracking-wider border border-white/20 text-neutral-300 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="w-2/3 py-2.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs uppercase tracking-widest font-medium transition-colors"
              >
                {isProcessing ? 'Connecting...' : 'Save & Sign In'}
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setMode('custom')}
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Or enter your actual details directly without Google
              </button>
            </div>
          </form>
        )}

        {/* MODE: FACEBOOK OAUTH SETUP */}
        {mode === 'setup_facebook' && (
          <form onSubmit={handleSaveFacebookAndLogin} className="space-y-4">
            <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 text-xs text-blue-200">
              <strong className="block font-medium mb-1">Meta Facebook App ID Required</strong>
              To enable actual Facebook Login on your live domain, enter your 15-16 digit Meta App ID from developers.facebook.com.
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                App Domain (Add this in Meta App Settings):
              </label>
              <div className="flex items-center gap-2 bg-black/60 border border-white/20 px-3 py-2 text-xs font-mono text-neutral-300">
                <span className="truncate flex-1">{currentOrigin}</span>
                <button
                  type="button"
                  onClick={copyOrigin}
                  className="text-[#F25C05] hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedOrigin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedOrigin ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                Paste Facebook App ID:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1234567890123456"
                value={facebookAppIdInput}
                onChange={(e) => setFacebookAppIdInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/70 border border-white/20 text-white text-xs font-mono tracking-wider focus:border-[#F25C05] focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('social')}
                className="w-1/3 py-2.5 text-xs uppercase tracking-wider border border-white/20 text-neutral-300 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="w-2/3 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs uppercase tracking-widest font-medium transition-colors"
              >
                {isProcessing ? 'Connecting...' : 'Save & Sign In'}
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setMode('custom')}
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Or enter your actual details directly without Facebook
              </button>
            </div>
          </form>
        )}

        {/* MODE: DIRECT CUSTOMER FORM */}
        {mode === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div className="mb-2 p-2.5 bg-white/5 border border-white/10 text-xs text-neutral-300 font-light">
              Enter your name and contact details. Your order tracking and delivery history will be saved to this profile.
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Abir Hasan"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-black/70 border border-white/20 text-white text-xs tracking-wider focus:border-[#F25C05] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="youremail@example.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 bg-black/70 border border-white/20 text-white text-xs tracking-wider focus:border-[#F25C05] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                Phone Number (BD)
              </label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full px-3 py-2 bg-black/70 border border-white/20 text-white text-xs tracking-wider font-mono focus:border-[#F25C05] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                Delivery Address
              </label>
              <input
                type="text"
                placeholder="House, Road, Area, Dhaka"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="w-full px-3 py-2 bg-black/70 border border-white/20 text-white text-xs tracking-wider focus:border-[#F25C05] focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('social')}
                className="w-1/3 py-2.5 text-xs uppercase tracking-wider border border-white/20 text-neutral-300 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="w-2/3 py-2.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer"
              >
                Sign In &amp; Proceed
              </button>
            </div>
          </form>
        )}

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Customer Authentication</span>
          </span>
          <span className="text-neutral-500 font-mono text-[10px]">The Royal Bengal</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuthModal;
