import React, { useState, useMemo } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  BookOpen,
  Key,
  Globe,
  Shield,
  Terminal,
  Download,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Code,
  MessageSquare,
  Share2,
  Smartphone,
  Layers,
  Store,
  ArrowRight,
  Info,
  CheckCheck
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { authService } from '../services/authService';

interface ApiIntegrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'gmail' | 'facebook' | 'fcommerce' | 'sandbox' | 'faq';
}

export const ApiIntegrationGuideModal: React.FC<ApiIntegrationGuideModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'gmail',
}) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'facebook' | 'fcommerce' | 'sandbox' | 'faq'>(defaultTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sandbox inputs
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [fbAppId, setFbAppId] = useState<string>('');
  const [fbPageUsername, setFbPageUsername] = useState<string>(() => {
    return localStorage.getItem('trb_sandbox_fb_page') || 'theroyalbengal.bd';
  });
  const [sandboxSavedNotice, setSandboxSavedNotice] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      authService.getAuthConfig().then((conf) => {
        setGoogleClientId(conf.googleClientId || '');
        setFbAppId(conf.facebookAppId || '');
      });
    }
  }, [isOpen]);

  // Messenger link preview helper
  const [selectedProductSku, setSelectedProductSku] = useState<string>('TRB-009');
  const [selectedSize, setSelectedSize] = useState<string>('L');

  const { loginWithGoogle, loginWithFacebook } = useCustomerAuth();

  // Detect current origin safely
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // Live products from storeService for F-Commerce catalog feed
  const products = useMemo(() => storeService.getProducts(), []);

  // Generate Meta Catalog CSV dynamically
  const metaCatalogCsv = useMemo(() => {
    const headers = 'id,title,description,availability,condition,price,link,image_link,brand';
    const rows = products.map((p) => {
      const priceStr = `${p.price} BDT`;
      const cleanDesc = (p.description || '').replace(/"/g, '""').slice(0, 150);
      const prodLink = `${currentOrigin}/?hunt=${p.category}&product=${p.id}`;
      const imgLink = p.image || `${currentOrigin}/assets/images/shirt_model.jpg`;
      return `"${p.styleCode || p.id}","${p.name}","${cleanDesc}","in stock","new","${priceStr}","${prodLink}","${imgLink}","The Royal Bengal"`;
    });
    return [headers, ...rows].join('\n');
  }, [products, currentOrigin]);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, keyName: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.warn('Clipboard write prevented:', err);
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDownloadCsv = () => {
    try {
      const blob = new Blob([metaCatalogCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `royal_bengal_meta_catalog_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const handleSaveSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('trb_sandbox_fb_page', fbPageUsername.trim());
    await authService.saveAuthConfig({
      googleClientId: googleClientId.trim(),
      facebookAppId: fbAppId.trim(),
    });
    setSandboxSavedNotice(true);
    setTimeout(() => setSandboxSavedNotice(false), 3000);
  };

  const handleTestGoogle = async () => {
    setTestResult('Connecting to Google Identity Services...');
    try {
      const res = await loginWithGoogle();
      if (res.success && res.user) {
        setTestResult(`Success! Authenticated real Google account: ${res.user.name} (${res.user.email})`);
      } else if (res.requiresSetup) {
        setTestResult(`Setup Required: Please paste your Google OAuth Client ID first and save.`);
      } else if (res.error) {
        setTestResult(`Google Sign-In Error: ${res.error}`);
      }
    } catch (err: any) {
      setTestResult(`Error: ${err?.message || 'Google login cancelled'}`);
    }
  };

  const handleTestFacebook = async () => {
    setTestResult('Connecting to Meta Facebook Login SDK...');
    try {
      const res = await loginWithFacebook();
      if (res.success && res.user) {
        setTestResult(`Success! Authenticated real Facebook account: ${res.user.name} (${res.user.email})`);
      } else if (res.requiresSetup) {
        setTestResult(`Setup Required: Please paste your Facebook App ID first and save.`);
      } else if (res.error) {
        setTestResult(`Facebook Sign-In Error: ${res.error}`);
      }
    } catch (err: any) {
      setTestResult(`Error: ${err?.message || 'Facebook login cancelled'}`);
    }
  };

  // Messenger link calculation
  const currentProduct = products.find((p) => p.styleCode === selectedProductSku || p.id === selectedProductSku) || products[0];
  const messengerCleanPage = (fbPageUsername || 'theroyalbengal.bd').replace('@', '').trim();
  const messengerInquiryText = encodeURIComponent(
    `Hello The Royal Bengal! I would like to order: ${currentProduct?.name || 'Executive Shirt'} (Style: ${currentProduct?.styleCode || selectedProductSku}, Size: ${selectedSize}) for Delivery in Dhaka.`
  );
  const messengerUrl = `https://m.me/${messengerCleanPage}?text=${messengerInquiryText}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto font-['Montserrat',sans-serif]">
      <div className="relative w-full max-w-5xl bg-neutral-950 border border-[#F25C05] shadow-[0_25px_70px_rgba(242,92,5,0.3)] flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-white/10 bg-neutral-900/90 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-[#F25C05]/20 border border-[#F25C05] flex items-center justify-center text-[#F25C05] shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-light tracking-[0.15em] text-white uppercase">
                  API Setup Guide
                </h3>
                <span className="bg-[#F25C05] text-white text-[9px] px-2 py-0.5 font-mono tracking-wider font-bold">
                  BEGINNER / NOOB EDITION
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                Step-by-step instructions for Google OAuth 2.0, Meta Facebook Login API &amp; F-Commerce
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close API Guide"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Origin Detection Banner for Noobs */}
        <div className="bg-[#F25C05]/10 border-b border-[#F25C05]/30 px-5 sm:px-7 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Globe className="w-4 h-4 text-[#F25C05] flex-shrink-0" />
            <span>
              Your detected app origin is:{' '}
              <strong className="text-white font-mono bg-black/60 px-2 py-0.5 border border-white/15">
                {currentOrigin}
              </strong>
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(currentOrigin, 'detected_origin')}
            className="flex items-center gap-1.5 px-3 py-1 bg-black/80 hover:bg-neutral-900 text-[#F25C05] hover:text-white border border-[#F25C05]/50 transition-all font-mono text-[11px] cursor-pointer"
          >
            {copiedKey === 'detected_origin' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Origin
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy For Whitelist
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/80 px-4 sm:px-6 pt-2.5 gap-1 sm:gap-2 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('gmail')}
            className={`px-3.5 py-2.5 text-xs tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'gmail'
                ? 'border-[#EA4335] text-white font-medium bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" />
            1. Google OAuth 2.0 (Gmail)
          </button>
          <button
            onClick={() => setActiveTab('facebook')}
            className={`px-3.5 py-2.5 text-xs tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'facebook'
                ? 'border-[#1877F2] text-white font-medium bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2]" />
            2. Facebook Login API
          </button>
          <button
            onClick={() => setActiveTab('fcommerce')}
            className={`px-3.5 py-2.5 text-xs tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'fcommerce'
                ? 'border-[#F25C05] text-white font-medium bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#F25C05]" />
            3. F-Commerce (Catalog &amp; Messenger)
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3.5 py-2.5 text-xs tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'border-emerald-500 text-white font-medium bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            4. Key Sandbox &amp; Live Tester
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2.5 text-xs tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-amber-500 text-white font-medium bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            5. Noob Glossary &amp; FAQ
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-sm text-neutral-300 font-light flex-1">
          {/* ========================================================================= */}
          {/* TAB 1: GOOGLE OAUTH 2.0 (GMAIL LOGIN) */}
          {/* ========================================================================= */}
          {activeTab === 'gmail' && (
            <div className="space-y-6">
              {/* Beginner Explain Box */}
              <div className="bg-[#EA4335]/10 border border-[#EA4335]/30 p-4 sm:p-5">
                <h4 className="text-white text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#EA4335]" />
                  What is Google OAuth 2.0 for Gmail Login? (Plain English)
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Instead of forcing customers to type a new password (which they will forget), Google OAuth lets them click{' '}
                  <strong className="text-white">&ldquo;Continue with Gmail&rdquo;</strong>. Google verifies their identity in a secure popup, then sends your store their verified Name, Email, and Avatar picture. It costs <strong>$0</strong> and eliminates 90% of checkout bounce rates.
                </p>
              </div>

              {/* Step by Step Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-[#EA4335] flex items-center gap-2">
                    <span>Step-by-Step Setup Guide (Takes ~4 Minutes)</span>
                  </h5>
                  <span className="text-[11px] text-neutral-400 font-mono">100% Free Google Cloud Account</span>
                </div>

                {/* Step 1 */}
                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#EA4335] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    1
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1">
                      Create Project in Google Cloud Console
                    </strong>
                    <p className="text-xs text-neutral-400 mb-2.5 leading-relaxed">
                      Visit the Google Cloud Console. Sign in with your Gmail or Google Workspace business account:
                    </p>
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <a
                        href="https://console.cloud.google.com/projectcreate"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EA4335] hover:bg-[#d83729] text-white text-xs font-medium uppercase tracking-wider transition-colors"
                      >
                        Open Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                      <li>Click the project dropdown at the very top bar &gt; Click <strong>New Project</strong>.</li>
                      <li>Project Name: Type <code className="text-neutral-200">The Royal Bengal</code>.</li>
                      <li>Click <strong>Create</strong> and wait 10 seconds for Google to initialize your project.</li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#EA4335] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    2
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1">
                      Configure OAuth Consent Screen
                    </strong>
                    <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                      From the left navigation menu, go to <strong>APIs &amp; Services</strong> &gt; <strong>OAuth consent screen</strong>:
                    </p>
                    <div className="p-3 bg-neutral-900 border border-white/10 text-xs space-y-2 mb-2">
                      <div>
                        <strong className="text-white">User Type:</strong> Select <span className="text-[#EA4335] font-semibold">External</span>.
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          (&ldquo;Internal&rdquo; only allows your own company employees. &ldquo;External&rdquo; lets all Bangladeshi customers sign in!)
                        </div>
                      </div>
                      <div>
                        <strong className="text-white">App Information:</strong>
                        <ul className="list-disc list-inside text-neutral-400 text-[11px] mt-1 space-y-0.5">
                          <li>App Name: <span className="text-neutral-200">The Royal Bengal</span></li>
                          <li>User Support Email: Select your email address.</li>
                          <li>Developer Contact Email: Enter your personal or company email.</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-white">Scopes:</strong> Click <em>Add or Remove Scopes</em>. Check <code className="text-emerald-400">.../auth/userinfo.email</code>, <code className="text-emerald-400">.../auth/userinfo.profile</code>, and <code className="text-emerald-400">openid</code>.
                      </div>
                      <div>
                        <strong className="text-white">Publishing Status:</strong> Under &ldquo;Publishing status&rdquo;, you can click <span className="text-[#F25C05] font-medium">Publish App</span> to make it live for everyone, or add your email under &ldquo;Test Users&rdquo; while testing.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#EA4335] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    3
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1">
                      Create OAuth 2.0 Client ID Credentials
                    </strong>
                    <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                      Go to <strong>APIs &amp; Services</strong> &gt; <strong>Credentials</strong>. Click <strong className="text-white">+ CREATE CREDENTIALS</strong> &gt; Select <strong className="text-white">OAuth client ID</strong>.
                    </p>
                    <div className="p-3 bg-neutral-900 border border-white/10 text-xs space-y-1.5 mb-2">
                      <div>
                        <strong className="text-white">Application type:</strong> Select <span className="text-[#EA4335] font-semibold">Web application</span>.
                      </div>
                      <div>
                        <strong className="text-white">Name:</strong> <span className="text-neutral-200">The Royal Bengal Web Client</span>.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Authorized Origins */}
                <div className="p-4 sm:p-5 bg-black/60 border border-[#EA4335]/40 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#EA4335] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    4
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1 flex items-center gap-2">
                      <span>Add Authorized JavaScript Origins (Crucial!)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#EA4335] text-white font-mono font-bold uppercase">Important</span>
                    </strong>
                    <p className="text-xs text-neutral-300 mb-2 leading-relaxed">
                      Google blocks logins if your website domain is not explicitly whitelisted here. Notice: An origin has <strong className="text-white">NO trailing slash (/)</strong> and <strong className="text-white">NO subpath</strong>.
                    </p>

                    <div className="space-y-2 mb-3">
                      <div className="bg-black/80 border border-white/15 p-2.5 flex items-center justify-between text-xs font-mono text-neutral-200">
                        <div>
                          <div className="text-[10px] text-neutral-400 font-sans uppercase">Origin 1 (Current Live/Dev Origin):</div>
                          <code>{currentOrigin}</code>
                        </div>
                        <button
                          onClick={() => copyToClipboard(currentOrigin, 'origin_google')}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[#EA4335] hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === 'origin_google' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy
                        </button>
                      </div>

                      <div className="bg-black/80 border border-white/15 p-2.5 flex items-center justify-between text-xs font-mono text-neutral-200">
                        <div>
                          <div className="text-[10px] text-neutral-400 font-sans uppercase">Origin 2 (Local Development):</div>
                          <code>http://localhost:3000</code>
                        </div>
                        <button
                          onClick={() => copyToClipboard('http://localhost:3000', 'origin_localhost')}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[#EA4335] hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === 'origin_localhost' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-400">
                      Under <strong>Authorized redirect URIs</strong>, also add:
                      <code className="text-neutral-200 bg-black px-1.5 py-0.5 mx-1">{currentOrigin}</code> and
                      <code className="text-neutral-200 bg-black px-1.5 py-0.5 mx-1">http://localhost:3000</code>.
                    </div>
                  </div>
                </div>

                {/* Step 5: SDK Integration */}
                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#EA4335] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    5
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1">
                      SDK Integration Code &amp; Environment Variable
                    </strong>
                    <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                      Click <strong>Create</strong> in Google Cloud. Google gives you your <strong className="text-white">Client ID</strong> (format: <code className="text-[#EA4335]">xxxx-yyyy.apps.googleusercontent.com</code>).
                    </p>

                    {/* Code Snippet */}
                    <div className="bg-neutral-900 border border-white/15 p-3 rounded-xs font-mono text-xs text-neutral-300 space-y-2 mb-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1 border-b border-white/10">
                        <span>Google Identity Services (GIS) SDK</span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `<script src="https://accounts.google.com/gsi/client" async defer></script>\n\nwindow.google.accounts.id.initialize({\n  client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",\n  callback: handleCredentialResponse,\n});`,
                              'sdk_google'
                            )
                          }
                          className="text-[#EA4335] hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === 'sdk_google' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Code
                        </button>
                      </div>
                      <pre className="overflow-x-auto text-[11px] leading-relaxed text-neutral-300">
{`<!-- 1. Include GIS Script -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<!-- 2. Initialize in JavaScript -->
google.accounts.id.initialize({
  client_id: "your-id.apps.googleusercontent.com",
  callback: (response) => {
    // response.credential contains the decoded JWT with user's:
    // { name, email, picture, sub }
    console.log("Customer authenticated:", response);
  }
});`}
                      </pre>
                    </div>

                    <div className="bg-black/90 border border-white/20 p-3 font-mono text-xs flex items-center justify-between text-neutral-200">
                      <div>
                        <span className="text-neutral-500 mr-2">.env.example:</span>
                        <code>VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</code>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            'VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com',
                            'env_google'
                          )
                        }
                        className="text-[#EA4335] hover:text-white p-1"
                      >
                        {copiedKey === 'env_google' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FACEBOOK LOGIN API (META OAUTH) */}
          {/* ========================================================================= */}
          {activeTab === 'facebook' && (
            <div className="space-y-6">
              {/* Beginner Explain Box */}
              <div className="bg-[#1877F2]/10 border border-[#1877F2]/30 p-4 sm:p-5">
                <h4 className="text-white text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#1877F2]" />
                  What is Facebook Login API? (Why it wins in Bangladesh)
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Over 85% of Bangladesh&apos;s online shoppers in Dhaka, Chittagong, Sylhet, and beyond discover clothing on Facebook. Meta OAuth lets customers sign into your store with their Facebook account in 1 tap. You get their verified profile name, primary email, and picture without any manual typing.
                </p>
              </div>

              {/* Step by Step Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-[#1877F2] flex items-center gap-2">
                    <span>Meta Developer Portal Walkthrough</span>
                  </h5>
                  <span className="text-[11px] text-neutral-400 font-mono">Official Meta for Developers</span>
                </div>

                {/* Step 1 */}
                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    1
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1">
                      Open Meta for Developers
                    </strong>
                    <p className="text-xs text-neutral-400 mb-2.5 leading-relaxed">
                      Go to the official Meta Developers portal and sign in with your regular Facebook profile:
                    </p>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-medium uppercase tracking-wider transition-colors mb-2"
                    >
                      Open developers.facebook.com <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                      <li>In the top-right corner, click <strong>My Apps</strong> &gt; Click the green <strong>Create App</strong> button.</li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    2
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1">
                      Select App Use Case &amp; Name
                    </strong>
                    <div className="p-3 bg-neutral-900 border border-white/10 text-xs space-y-2">
                      <div>
                        <strong className="text-white">Select what you want your app to do:</strong>
                        <div className="text-neutral-300 mt-1">
                          Choose <span className="text-[#1877F2] font-semibold">&ldquo;Authenticate and request data from users with Facebook Login&rdquo;</span> (or select <span className="text-neutral-200 font-semibold">&ldquo;Consumer&rdquo;</span>).
                        </div>
                      </div>
                      <div>
                        <strong className="text-white">App Details:</strong>
                        <ul className="list-disc list-inside text-neutral-400 text-[11px] mt-1 space-y-0.5">
                          <li>App Name: <span className="text-neutral-200">The Royal Bengal Store</span></li>
                          <li>App Contact Email: Enter your business email.</li>
                        </ul>
                      </div>
                      <div>
                        Click <strong>Create App</strong>. Enter your Facebook password if prompted.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    3
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1">
                      Add &ldquo;Facebook Login&rdquo; Product &amp; Set Platform to &ldquo;Web&rdquo;
                    </strong>
                    <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                      On the App Dashboard, scroll to <strong>Facebook Login</strong> and click <strong>Set Up</strong>:
                    </p>
                    <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                      <li>Choose platform: Select <strong>Web</strong> (www).</li>
                      <li>
                        Site URL: Enter <code className="text-neutral-200">{currentOrigin}/</code> (or your custom domain) and click <strong>Save</strong>.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 sm:p-5 bg-black/60 border border-[#1877F2]/40 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    4
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1 flex items-center gap-2">
                      <span>Configure Redirect URIs &amp; JavaScript SDK Domains</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#1877F2] text-white font-mono font-bold uppercase">Crucial</span>
                    </strong>
                    <p className="text-xs text-neutral-300 mb-2 leading-relaxed">
                      In the left sidebar, click <strong>Facebook Login</strong> &gt; <strong>Settings</strong>:
                    </p>
                    <div className="p-3 bg-neutral-900 border border-white/10 text-xs space-y-2 mb-2">
                      <div>
                        <span className="text-white font-medium">Valid OAuth Redirect URIs:</span>
                        <div className="text-[11px] text-neutral-400">
                          Add: <code className="text-white">{currentOrigin}/</code> and <code className="text-white">http://localhost:3000/</code>
                        </div>
                      </div>
                      <div>
                        <span className="text-white font-medium">Allowed Domains for the JavaScript SDK:</span>
                        <div className="text-[11px] text-neutral-400">
                          Add: <code className="text-white">{currentOrigin.replace(/https?:\/\//, '')}</code>
                        </div>
                      </div>
                      <div>
                        <span className="text-white font-medium">Switch to Live Mode:</span>
                        <div className="text-[11px] text-neutral-400">
                          At the top navigation bar, toggle <strong>App Mode</strong> from <em>In Development</em> to <em>Live</em>. (Note: Meta requires you to add a Privacy Policy URL, e.g. <code className="text-neutral-200">{currentOrigin}/#privacy</code> under App settings &gt; Basic).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5: JavaScript SDK */}
                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    5
                  </span>
                  <div className="flex-1">
                    <strong className="text-white text-sm block mb-1">
                      Meta JavaScript SDK Setup &amp; App ID
                    </strong>
                    <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                      Under <strong>App settings &gt; Basic</strong>, find your numeric <strong>App ID</strong> (e.g. <code className="text-[#1877F2]">1234567890123456</code>).
                    </p>

                    <div className="bg-neutral-900 border border-white/15 p-3 rounded-xs font-mono text-xs text-neutral-300 space-y-2 mb-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1 border-b border-white/10">
                        <span>Meta JavaScript SDK Integration</span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>\n\nwindow.fbAsyncInit = function() {\n  FB.init({\n    appId: "YOUR_FACEBOOK_APP_ID",\n    cookie: true,\n    xfbml: true,\n    version: "v19.0"\n  });\n};`,
                              'sdk_fb'
                            )
                          }
                          className="text-[#1877F2] hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === 'sdk_fb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Code
                        </button>
                      </div>
                      <pre className="overflow-x-auto text-[11px] leading-relaxed text-neutral-300">
{`<!-- 1. Meta JS SDK -->
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>

<!-- 2. Init & Trigger Login -->
FB.init({ appId: '1234567890123456', cookie: true, xfbml: true, version: 'v19.0' });

FB.login((res) => {
  if (res.authResponse) {
    FB.api('/me', { fields: 'id,name,email,picture' }, (profile) => {
      console.log('Customer signed in with Facebook:', profile);
    });
  }
}, { scope: 'public_profile,email' });`}
                      </pre>
                    </div>

                    <div className="bg-black/90 border border-white/20 p-3 font-mono text-xs flex items-center justify-between text-neutral-200">
                      <div>
                        <span className="text-neutral-500 mr-2">.env.example:</span>
                        <code>VITE_FACEBOOK_APP_ID=1234567890123456</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard('VITE_FACEBOOK_APP_ID=1234567890123456', 'env_fb')}
                        className="text-[#1877F2] hover:text-white p-1"
                      >
                        {copiedKey === 'env_fb' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: F-COMMERCE (FACEBOOK SHOP & MESSENGER) */}
          {/* ========================================================================= */}
          {activeTab === 'fcommerce' && (
            <div className="space-y-6">
              {/* Beginner Explain Box */}
              <div className="bg-[#F25C05]/10 border border-[#F25C05]/30 p-4 sm:p-5">
                <h4 className="text-white text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#F25C05]" />
                  What is F-Commerce in Bangladesh? (Plain English)
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  F-Commerce refers to sales originating on Facebook Pages, Instagram Shops, Facebook Live events, and Messenger chats. Instead of manually answering &ldquo;Price please?&rdquo; hundreds of times, F-Commerce links your <strong className="text-white">Meta Catalog Feed</strong> and <strong className="text-white">Messenger Chat-to-Buy</strong> so customers can see prices in BDT and check out immediately with 1 click.
                </p>
              </div>

              {/* PART A: CATALOG FEEDS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-[#F25C05] flex items-center gap-2">
                    <span>Part A: Meta Commerce Manager &amp; Live Catalog Feed</span>
                  </h5>
                  <span className="text-[11px] text-neutral-400 font-mono">Automated Inventory Sync</span>
                </div>

                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F25C05] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-white text-sm block mb-1">
                        Go to Meta Commerce Manager
                      </strong>
                      <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                        Open <a href="https://business.facebook.com/commerce" target="_blank" rel="noreferrer" className="text-[#F25C05] underline inline-flex items-center gap-1">business.facebook.com/commerce <ExternalLink className="w-3 h-3" /></a> and sign in.
                      </p>
                      <ul className="text-xs text-neutral-400 list-disc list-inside space-y-1">
                        <li>Click <strong>Add Catalog</strong> &gt; Select <strong>E-commerce</strong> &gt; Select <strong>Online Products</strong>.</li>
                        <li>Assign catalog owner to your Facebook Business Page (e.g. &ldquo;The Royal Bengal&rdquo;).</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t border-white/10">
                    <span className="w-6 h-6 rounded-full bg-[#F25C05] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </span>
                    <div className="flex-1">
                      <strong className="text-white text-sm block mb-1">
                        Upload Product Data Feed (Dynamic Live Generator)
                      </strong>
                      <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                        Meta asks for a Data Feed (CSV or scheduled URL) containing standard columns: <code className="text-white">id, title, description, availability, condition, price, link, image_link, brand</code>. We have generated the real feed for all current store inventory below:
                      </p>

                      {/* Download & Copy Buttons */}
                      <div className="flex flex-wrap gap-2.5 mb-3">
                        <button
                          onClick={handleDownloadCsv}
                          className="px-3.5 py-2 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Meta Catalog CSV
                        </button>
                        <button
                          onClick={() => copyToClipboard(metaCatalogCsv, 'catalog_csv')}
                          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white border border-white/15 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {copiedKey === 'catalog_csv' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied CSV To Clipboard
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Raw CSV Feed
                            </>
                          )}
                        </button>
                      </div>

                      {/* Live Preview Box */}
                      <div className="bg-neutral-900 border border-white/15 p-3 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-40">
                        <div className="text-[10px] text-[#F25C05] uppercase tracking-wider mb-1 font-sans font-medium">
                          Live Generated Feed Content ({products.length} Products):
                        </div>
                        <pre className="whitespace-pre">{metaCatalogCsv}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PART B: MESSENGER COMMERCE */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold uppercase tracking-widest text-[#F25C05] flex items-center gap-2">
                    <span>Part B: Messenger Commerce &amp; Chat-to-Buy Integration</span>
                  </h5>
                  <span className="text-[11px] text-neutral-400 font-mono">1-Click Order Link</span>
                </div>

                <div className="p-4 sm:p-5 bg-black/60 border border-white/10 space-y-4">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Turn social post comments and ads into immediate sales by sharing direct <strong className="text-white">m.me</strong> deep links. Clicking the link opens Messenger on the customer&apos;s phone with the exact shirt and size pre-filled!
                  </p>

                  {/* Interactive Builder */}
                  <div className="p-4 bg-neutral-900 border border-white/15 space-y-3">
                    <div className="text-xs font-medium text-white uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#F25C05]" />
                      Interactive Messenger Deep Link Generator:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                          Facebook Page Username
                        </label>
                        <input
                          type="text"
                          value={fbPageUsername}
                          onChange={(e) => setFbPageUsername(e.target.value)}
                          placeholder="theroyalbengal.bd"
                          className="w-full px-3 py-1.5 bg-black border border-white/20 text-white text-xs font-mono focus:border-[#F25C05] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                          Select Product
                        </label>
                        <select
                          value={selectedProductSku}
                          onChange={(e) => setSelectedProductSku(e.target.value)}
                          className="w-full px-3 py-1.5 bg-black border border-white/20 text-white text-xs focus:border-[#F25C05] focus:outline-hidden"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.styleCode || p.id}>
                              {p.name} ({p.currency} {p.price})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                          Customer Size
                        </label>
                        <select
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="w-full px-3 py-1.5 bg-black border border-white/20 text-white text-xs font-mono focus:border-[#F25C05] focus:outline-hidden"
                        >
                          {['S', 'M', 'L', 'XL', '2XL', '3XL'].map((s) => (
                            <option key={s} value={s}>
                              Size {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Output link */}
                    <div className="pt-2">
                      <div className="text-[11px] text-neutral-400 mb-1">Generated Click-to-Chat Link:</div>
                      <div className="p-2.5 bg-black border border-white/20 flex items-center justify-between gap-2 text-xs font-mono text-neutral-200">
                        <span className="truncate">{messengerUrl}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => copyToClipboard(messengerUrl, 'msg_link')}
                            className="px-2.5 py-1 bg-[#F25C05] text-white hover:bg-[#ff6811] text-[11px] uppercase tracking-wider flex items-center gap-1"
                          >
                            {copiedKey === 'msg_link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy Link
                          </button>
                          <a
                            href={messengerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center gap-1"
                            title="Test link in Messenger"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Automated Messenger Flow */}
                  <div className="border border-white/10 p-3.5 bg-black/40 space-y-2 text-xs">
                    <strong className="text-white block font-medium">
                      Automating Orders via Meta Business Suite Inbox:
                    </strong>
                    <ol className="list-decimal list-inside text-neutral-400 space-y-1 pl-1">
                      <li>In Meta Business Suite, go to <strong>Inbox</strong> &gt; <strong>Automations</strong>.</li>
                      <li>Create an <strong>Instant Reply</strong>: &ldquo;Welcome to The Royal Bengal! We deliver inside Dhaka in 2 hours or standard COD across Bangladesh. Please reply with your delivery address &amp; phone number to confirm your order.&rdquo;</li>
                      <li>Orders captured can be typed directly into your <strong>Admin Dashboard &gt; Orders</strong> or submitted via customer checkout.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: KEY SANDBOX & LIVE TESTER */}
          {/* ========================================================================= */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 sm:p-5">
                <h4 className="text-white text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Live Credential Sandbox &amp; Validator
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Test your real credentials directly inside the app. Paste your Google Client ID or Meta App ID below: the sandbox automatically validates their syntax, saves them to browser storage, and allows you to test the customer login pipeline immediately.
                </p>
              </div>

              <form onSubmit={handleSaveSandbox} className="space-y-4">
                <div className="p-4 bg-black/60 border border-white/10 space-y-4">
                  {/* Google Client ID Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs uppercase tracking-wider text-white font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
                        Google OAuth 2.0 Client ID (VITE_GOOGLE_CLIENT_ID)
                      </label>
                      {googleClientId && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                            googleClientId.endsWith('.apps.googleusercontent.com')
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                              : 'bg-amber-950 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          {googleClientId.endsWith('.apps.googleusercontent.com')
                            ? 'Valid Format (.apps.googleusercontent.com)'
                            : 'Warning: Should end in .apps.googleusercontent.com'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 1234567890-abcdef12345.apps.googleusercontent.com"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/20 text-white text-xs font-mono focus:border-[#F25C05] focus:outline-hidden"
                    />
                  </div>

                  {/* Facebook App ID Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs uppercase tracking-wider text-white font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1877F2]" />
                        Meta Facebook App ID (VITE_FACEBOOK_APP_ID)
                      </label>
                      {fbAppId && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                            /^\d{14,17}$/.test(fbAppId.trim())
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                              : 'bg-amber-950 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          {/^\d{14,17}$/.test(fbAppId.trim())
                            ? 'Valid Format (14-17 digits)'
                            : 'Note: Usually a 15-16 digit number'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 1234567890123456"
                      value={fbAppId}
                      onChange={(e) => setFbAppId(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/20 text-white text-xs font-mono focus:border-[#F25C05] focus:outline-hidden"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Save Sandbox Credentials
                    </button>
                    {sandboxSavedNotice && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Saved to browser storage!
                      </span>
                    )}
                  </div>
                </div>
              </form>

              {/* Instant Test Simulator */}
              <div className="p-4 sm:p-5 bg-neutral-900 border border-white/10 space-y-3">
                <div className="text-xs uppercase tracking-wider text-white font-medium flex items-center gap-2">
                  <PlayCircleIcon className="w-4 h-4 text-emerald-400" />
                  Instant Authentication Pipeline Test
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Click either test button below to trigger the authentic customer session pipeline and verify how user avatars, shipping zones, and orders link to the new account:
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTestGoogle}
                    className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-neutral-900 text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" />
                    Test Google Login Flow
                  </button>

                  <button
                    type="button"
                    onClick={handleTestFacebook}
                    className="px-4 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    Test Facebook Login Flow
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 bg-black border border-emerald-500/40 text-xs text-emerald-300 font-mono mt-3">
                    {testResult}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: NOOB GLOSSARY & FAQ */}
          {/* ========================================================================= */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <div className="bg-amber-950/30 border border-amber-500/40 p-4 sm:p-5">
                <h4 className="text-white text-sm font-medium mb-1.5 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  The Absolute Beginner&apos;s Glossary
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Technical jargon simplified for clothing brand founders and store operators.
                </p>
              </div>

              {/* Glossary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-black/60 border border-white/10">
                  <div className="text-xs font-semibold text-[#F25C05] uppercase tracking-wider mb-1">
                    API (Application Programming Interface)
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Think of an API like a waiter at a Dhaka restaurant: You (your store) place an order (ask Google who this customer is), the waiter talks to the kitchen (Google servers), and brings back the food (the customer&apos;s verified email and profile picture).
                  </p>
                </div>

                <div className="p-3.5 bg-black/60 border border-white/10">
                  <div className="text-xs font-semibold text-[#EA4335] uppercase tracking-wider mb-1">
                    OAuth 2.0
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    A digital passport system. Customers show their Google or Facebook &ldquo;badge&rdquo; to enter your store without ever giving you their private Google password.
                  </p>
                </div>

                <div className="p-3.5 bg-black/60 border border-white/10">
                  <div className="text-xs font-semibold text-[#1877F2] uppercase tracking-wider mb-1">
                    Client ID vs Client Secret
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>Client ID:</strong> Your public username on Google/Meta. It is completely safe to display in web browsers.
                    <br />
                    <strong>Client Secret:</strong> Your private password. Never put this inside frontend browser code!
                  </p>
                </div>

                <div className="p-3.5 bg-black/60 border border-white/10">
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    JavaScript Origin
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    The root web address of your store (e.g. <code>https://royalbengal.bd</code>). It must NEVER have a trailing slash (/) or extra page path.
                  </p>
                </div>
              </div>

              {/* Top Troubleshooting Questions */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-semibold uppercase tracking-widest text-white">
                  Frequently Encountered &ldquo;Noob&rdquo; Questions:
                </h5>

                <div className="p-4 bg-black/60 border border-white/10 space-y-1.5">
                  <div className="text-xs font-medium text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Error 400: &ldquo;redirect_uri_mismatch&rdquo; or &ldquo;Origin not allowed&rdquo;
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>The Fix:</strong> Google requires an exact character-by-character match. Use the &ldquo;Copy My Current App Origin&rdquo; button at the top of this guide and paste it into Google Cloud Console under <em>Authorized JavaScript origins</em>. Wait 1 minute and refresh.
                  </p>
                </div>

                <div className="p-4 bg-black/60 border border-white/10 space-y-1.5">
                  <div className="text-xs font-medium text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Facebook Login says: &ldquo;App Not Active: This app is in development mode&rdquo;
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>The Fix:</strong> Go to Meta for Developers &gt; Top Bar toggle &gt; Switch from <em>In Development</em> to <em>Live</em>. If Meta refuses, go to App Settings &gt; Basic, enter your website URL in the Privacy Policy field, and click Save.
                  </p>
                </div>

                <div className="p-4 bg-black/60 border border-white/10 space-y-1.5">
                  <div className="text-xs font-medium text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-400" />
                    Do I need to pay Google or Meta any monthly fees?
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>No:</strong> Google OAuth 2.0 and Facebook Login API are 100% free with unlimited customer sign-ins for web applications. Meta Commerce Manager catalog hosting is also free.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-white/10 bg-neutral-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>1-Click simulated authentications are pre-configured and active in development mode.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer"
          >
            Done / Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick helper icon for play circle
function PlayCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}
export default ApiIntegrationGuideModal;
