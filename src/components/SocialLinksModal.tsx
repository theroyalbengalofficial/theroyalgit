import React, { useState, useEffect } from 'react';
import { X, Check, Share2, ExternalLink, RotateCcw, Copy, Info } from 'lucide-react';
import {
  getActiveSocialLinks,
  saveSocialLinks,
  DEFAULT_SOCIAL_LINKS,
  SocialLinksConfig,
} from '../data/socialLinks';
import { SOCIAL_PLATFORMS } from './Footer';

interface SocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const SocialLinksModal: React.FC<SocialLinksModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [formValues, setFormValues] = useState<SocialLinksConfig>(DEFAULT_SOCIAL_LINKS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormValues(getActiveSocialLinks());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSocialLinks(formValues);
    setSavedSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('Reset all social links to default templates?')) {
      setFormValues(DEFAULT_SOCIAL_LINKS);
      saveSocialLinks(DEFAULT_SOCIAL_LINKS);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 1500);
    }
  };

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-sm shadow-2xl p-6 sm:p-8 my-8 text-neutral-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F25C05]/10 border border-[#F25C05]/30 flex items-center justify-center text-[#F25C05]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-light tracking-wide text-white">Social Media Links Configuration</h2>
              <p className="text-xs text-neutral-400 font-extralight">
                Set individual URLs for each platform. They are separate and customizable.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-sm hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info box explaining how they are placed in code */}
        <div className="mb-6 p-4 rounded-sm bg-white/5 border border-white/10 text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#F25C05] font-medium">
            <Info className="w-4 h-4" />
            <span>Where to edit in code & place separately:</span>
          </div>
          <p className="text-neutral-300 font-extralight leading-relaxed">
            All URLs are separated in <code className="px-1.5 py-0.5 bg-black/60 rounded text-amber-300 border border-white/10">src/data/socialLinks.ts</code>. You can edit that file directly, or use this dashboard.
          </p>
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-neutral-400 text-[11px]">Place any specific icon in JSX:</span>
            <code className="text-[11px] bg-black/60 px-2 py-0.5 rounded text-neutral-300 font-mono">
              {'<SocialIconButton platform="whatsapp" />'}
            </code>
            <button
              type="button"
              onClick={() => copySnippet('<SocialIconButton platform="whatsapp" />', 'whatsapp-jsx')}
              className="text-[10px] text-[#F25C05] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedCode === 'whatsapp-jsx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode === 'whatsapp-jsx' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
            {SOCIAL_PLATFORMS.map((platform) => {
              const currentValue = formValues[platform.id] || '';
              return (
                <div
                  key={platform.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-[140px]">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                      {platform.icon}
                    </div>
                    <span className="text-xs font-medium text-white">{platform.name}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="url"
                      value={currentValue}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [platform.id]: e.target.value }))
                      }
                      placeholder={
                        platform.id === 'whatsapp'
                          ? 'https://wa.me/8801321814355'
                          : `https://${platform.id}.com/yourhandle`
                      }
                      className="w-full bg-black/60 border border-white/15 px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-hidden focus:border-[#F25C05]"
                      required
                    />
                    {currentValue && (
                      <a
                        href={currentValue}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                        title="Test link in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-xs uppercase tracking-wider font-semibold text-white bg-[#F25C05] hover:bg-[#d95204] transition-colors cursor-pointer shadow-lg"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Links</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
