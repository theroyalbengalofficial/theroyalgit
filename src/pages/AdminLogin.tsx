import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import BrandLogo from '../components/Logo';

export const AdminLogin: React.FC = () => {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect straight to /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!adminId.trim() || !password.trim()) {
      setErrorMessage('Please enter both Admin ID and Password to enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(adminId, password);
      if (res.success) {
        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please check ID and Password.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden font-['Montserrat',sans-serif]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#F25C05]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 right-0 w-96 h-96 bg-[#F25C05]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar Return Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-2 border border-white/10 hover:border-[#F25C05]/60"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#F25C05]" />
          <span>Return to Storefront</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-xl sm:text-2xl font-light tracking-[0.25em] uppercase text-white">
            Admin Portal
          </h1>
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#F25C05] font-medium mt-1">
            Executive Command Center
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-950/90 border border-white/15 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-md">
          <div className="mb-5 pb-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#F25C05]" />
              <span className="text-xs uppercase tracking-wider font-medium text-white">
                Clearance Required
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              ID & Password Protected
            </span>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-light tracking-wide flex items-start gap-2">
              <span className="text-red-400 font-bold">✕</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Admin ID / Email */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-medium mb-2">
                Admin ID or Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Enter Admin ID or Email"
                  className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/20 text-white placeholder-neutral-600 text-xs tracking-wider focus:outline-none focus:border-[#F25C05] transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-medium">
                  Admin Password *
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-black/60 border border-white/20 text-white placeholder-neutral-600 text-xs tracking-wider focus:outline-none focus:border-[#F25C05] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#F25C05] hover:bg-[#ff6811] active:bg-[#d85002] text-white text-xs tracking-[0.25em] font-medium uppercase transition-all shadow-[0_0_20px_rgba(242,92,5,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying ID & Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Protected by Royal Bengal Apex Security
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
