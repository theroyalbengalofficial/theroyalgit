import React, { useState, useEffect } from 'react';
import { PaymentGatewayKeys } from '../types';
import { X, Key, Globe, Shield, Copy, Check, ExternalLink, UserCheck } from 'lucide-react';
import { authService } from '../services/authService';

interface GatewaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatewayKeys: PaymentGatewayKeys;
  onSaveKeys: (keys: PaymentGatewayKeys) => void;
}

export const GatewaySettingsModal: React.FC<GatewaySettingsModalProps> = ({
  isOpen,
  onClose,
  gatewayKeys,
  onSaveKeys,
}) => {
  const [activeTab, setActiveTab] = useState<'bkash' | 'nagad' | 'hosting' | 'oauth'>('bkash');
  const [keys, setKeys] = useState<PaymentGatewayKeys>(gatewayKeys);
  const [googleClientId, setGoogleClientId] = useState('');
  const [facebookAppId, setFacebookAppId] = useState('');
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      authService.getAuthConfig().then((conf) => {
        setGoogleClientId(conf.googleClientId || '');
        setFacebookAppId(conf.facebookAppId || '');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleSave = async () => {
    onSaveKeys(keys);
    await authService.saveAuthConfig({ googleClientId, facebookAppId });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const htaccessCode = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`;

  const copyHtaccess = () => {
    navigator.clipboard.writeText(htaccessCode);
    setCopiedHtaccess(true);
    setTimeout(() => setCopiedHtaccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-neutral-950 border-2 border-[#F25C05] shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#F25C05]" />
            <h2 className="text-sm sm:text-base font-light tracking-[0.2em] uppercase text-white">
              Integration & Hosting Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/30">
          <button
            onClick={() => setActiveTab('bkash')}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-light border-b-2 transition-all ${
              activeTab === 'bkash'
                ? 'border-[#E2136E] text-white font-normal bg-[#E2136E]/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            bKash Gateway
          </button>
          <button
            onClick={() => setActiveTab('nagad')}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-light border-b-2 transition-all ${
              activeTab === 'nagad'
                ? 'border-[#F7921E] text-white font-normal bg-[#F7921E]/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Nagad Gateway
          </button>
          <button
            onClick={() => setActiveTab('hosting')}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-light border-b-2 transition-all ${
              activeTab === 'hosting'
                ? 'border-[#F25C05] text-white font-normal bg-[#F25C05]/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Domain & Hosting
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-light border-b-2 transition-all ${
              activeTab === 'oauth'
                ? 'border-[#4285F4] text-white font-normal bg-[#4285F4]/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Google &amp; Facebook Login
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-extralight text-neutral-300">
          {activeTab === 'bkash' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#E2136E]/10 border border-[#E2136E]/30 text-neutral-200 leading-relaxed">
                Plug your official bKash Merchant credentials below. Left blank by default as requested. When ready, paste your production or sandbox keys.
              </div>

              <div className="flex items-center gap-3">
                <label className="text-neutral-300">Environment:</label>
                <button
                  type="button"
                  onClick={() => setKeys({ ...keys, isSandbox: !keys.isSandbox })}
                  className={`px-3 py-1 text-[11px] rounded uppercase font-mono tracking-wider ${
                    keys.isSandbox ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {keys.isSandbox ? 'SANDBOX (TEST)' : 'LIVE PRODUCTION'}
                </button>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                  bKash Merchant ID
                </label>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={keys.bkashMerchantId}
                  onChange={(e) => setKeys({ ...keys, bkashMerchantId: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 text-white font-mono focus:border-[#E2136E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                  bKash App Key
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4f98df89b9a1..."
                  value={keys.bkashAppKey}
                  onChange={(e) => setKeys({ ...keys, bkashAppKey: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 text-white font-mono focus:border-[#E2136E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                  bKash App Secret
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={keys.bkashAppSecret}
                  onChange={(e) => setKeys({ ...keys, bkashAppSecret: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 text-white font-mono focus:border-[#E2136E] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                    API Username
                  </label>
                  <input
                    type="text"
                    placeholder="sandbox_user"
                    value={keys.bkashUsername}
                    onChange={(e) => setKeys({ ...keys, bkashUsername: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/20 text-white font-mono focus:border-[#E2136E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                    API Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={keys.bkashPassword}
                    onChange={(e) => setKeys({ ...keys, bkashPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/20 text-white font-mono focus:border-[#E2136E] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nagad' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F7921E]/10 border border-[#F7921E]/30 text-neutral-200 leading-relaxed">
                Plug your official Nagad Merchant credentials below. Left blank by default as requested.
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                  Nagad Merchant ID
                </label>
                <input
                  type="text"
                  placeholder="68XXXXXXXXXXXX"
                  value={keys.nagadMerchantId}
                  onChange={(e) => setKeys({ ...keys, nagadMerchantId: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 text-white font-mono focus:border-[#F7921E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                  Nagad Public Key
                </label>
                <textarea
                  rows={2}
                  placeholder="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
                  value={keys.nagadPublicKey}
                  onChange={(e) => setKeys({ ...keys, nagadPublicKey: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 text-white font-mono focus:border-[#F7921E] focus:outline-hidden text-[11px]"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                  Nagad Private Key
                </label>
                <textarea
                  rows={2}
                  placeholder="MIIEowIBAAKCAQEA0aYxK..."
                  value={keys.nagadPrivateKey}
                  onChange={(e) => setKeys({ ...keys, nagadPrivateKey: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/20 text-white font-mono focus:border-[#F7921E] focus:outline-hidden text-[11px]"
                />
              </div>
            </div>
          )}

          {activeTab === 'hosting' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F25C05]/10 border border-[#F25C05]/30 text-neutral-200 leading-relaxed">
                <strong className="text-white">Domain & Hosting Guide:</strong> Since you already purchased your domain and hosting (e.g. cPanel, Hostinger, Namecheap, Vercel, Netlify, VPS), deploying this website takes less than 2 minutes!
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-normal text-white uppercase tracking-wider">
                  How to deploy to your purchased hosting:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-neutral-300">
                  <li>
                    Run <code className="bg-black px-2 py-0.5 text-[#F25C05]">npm run build</code> in your terminal. This creates a production folder called <code className="bg-black px-2 py-0.5 text-white">dist/</code>.
                  </li>
                  <li>
                    In your hosting cPanel, open <strong className="text-white">File Manager</strong> &gt; navigate into <strong className="text-white">public_html</strong>.
                  </li>
                  <li>
                    Upload all files from inside <code className="bg-black px-2 py-0.5 text-white">dist/</code> into your <code className="bg-black px-2 py-0.5 text-white">public_html</code> folder.
                  </li>
                  <li>
                    Create a file named <strong className="text-white">.htaccess</strong> in <code className="bg-black px-2 py-0.5 text-white">public_html</code> and paste the rewrite rules below to ensure all URLs refresh cleanly without 404 errors.
                  </li>
                </ol>
              </div>

              {/* Copyable .htaccess */}
              <div className="relative mt-4">
                <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 border-t border-x border-white/20">
                  <span className="text-[11px] font-mono text-neutral-400">.htaccess (for Apache / cPanel)</span>
                  <button
                    onClick={copyHtaccess}
                    className="flex items-center gap-1 text-[11px] text-[#F25C05] hover:text-white"
                  >
                    {copiedHtaccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedHtaccess ? 'Copied!' : 'Copy Snippet'}
                  </button>
                </div>
                <pre className="p-3 bg-black border border-white/20 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                  {htaccessCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'oauth' && (
            <div className="space-y-5">
              <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 text-neutral-200 leading-relaxed">
                Connect your actual Google and Meta applications. Once saved, customers logging into your live website will authenticate directly with their real Google Accounts and Facebook profiles.
              </div>

              {/* Authorized Origin for Google Cloud & Meta */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-300 mb-1">
                  Your Live Website Origin (Authorized JavaScript Origin):
                </label>
                <div className="flex items-center gap-2 bg-black/60 border border-white/20 px-3 py-2 text-xs font-mono text-neutral-300">
                  <span className="truncate flex-1">{currentOrigin}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentOrigin);
                      setCopiedOrigin(true);
                      setTimeout(() => setCopiedOrigin(false), 2000);
                    }}
                    className="text-[#F25C05] hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedOrigin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedOrigin ? 'Copied' : 'Copy Origin'}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Copy and paste this URL into your Google Cloud Console "Authorized JavaScript origins" and Meta "App Domains".
                </p>
              </div>

              {/* Google OAuth Section */}
              <div className="border border-white/10 p-4 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4285F4]" />
                    <span className="text-xs uppercase tracking-wider font-medium text-white">Google OAuth 2.0 (Gmail Login)</span>
                  </div>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#4285F4] hover:underline flex items-center gap-1"
                  >
                    Google Cloud Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">Google OAuth Client ID:</label>
                  <input
                    type="text"
                    placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/20 text-white font-mono text-xs focus:border-[#4285F4] focus:outline-hidden"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Create in Google Cloud &gt; APIs &amp; Services &gt; Credentials &gt; OAuth client ID (Web Application).
                  </p>
                </div>
              </div>

              {/* Facebook App ID Section */}
              <div className="border border-white/10 p-4 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2]" />
                    <span className="text-xs uppercase tracking-wider font-medium text-white">Meta Facebook Login API</span>
                  </div>
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#1877F2] hover:underline flex items-center gap-1"
                  >
                    Meta for Developers <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">Facebook App ID:</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567890123456"
                    value={facebookAppId}
                    onChange={(e) => setFacebookAppId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/20 text-white font-mono text-xs focus:border-[#1877F2] focus:outline-hidden"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Found in Meta for Developers &gt; My Apps &gt; App Settings &gt; Basic.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            {saveSuccess ? '✓ Credentials Saved Locally!' : 'Credentials saved in browser storage'}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-neutral-300 hover:text-white text-xs uppercase tracking-wider"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs uppercase tracking-widest font-light shadow-lg cursor-pointer"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatewaySettingsModal;
