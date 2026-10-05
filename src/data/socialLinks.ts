/**
 * ============================================================================
 * SOCIAL MEDIA LINKS CONFIGURATION
 * ============================================================================
 * 
 * Edit your brand's social media URLs directly below.
 * Each link is separate and simple to update:
 * 
 * Instructions:
 * - Facebook:  Replace with your page/profile link (e.g., 'https://facebook.com/yourbrand')
 * - Twitter/X: Replace with your handle link (e.g., 'https://twitter.com/yourbrand' or 'https://x.com/yourbrand')
 * - Instagram: Replace with your Instagram profile (e.g., 'https://instagram.com/yourbrand')
 * - LinkedIn:  Replace with your LinkedIn company or profile URL
 * - TikTok:    Replace with your TikTok profile link (e.g., 'https://tiktok.com/@yourbrand')
 * - WhatsApp:  Use the standard wa.me format with your country code: 'https://wa.me/8801321814355'
 * - YouTube:   Replace with your YouTube channel link (e.g., 'https://youtube.com/@yourbrand')
 */

export interface SocialLinksConfig {
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  tiktok: string;
  whatsapp: string;
  youtube: string;
}

/**
 * Default Social Media Links
 * You can edit the URLs inside this object directly:
 */
export const DEFAULT_SOCIAL_LINKS: SocialLinksConfig = {
  // 1. Facebook
  facebook: 'https://facebook.com',

  // 2. Twitter / X
  twitter: 'https://twitter.com',

  // 3. Instagram
  instagram: 'https://instagram.com',

  // 4. LinkedIn
  linkedin: 'https://linkedin.com',

  // 5. TikTok
  tiktok: 'https://tiktok.com',

  // 6. WhatsApp (Direct message link with country code, no + or spaces in wa.me number)
  whatsapp: 'https://wa.me/8801321814355',

  // 7. YouTube
  youtube: 'https://youtube.com',
};

// Aliased export for quick access:
export const SOCIAL_LINKS = DEFAULT_SOCIAL_LINKS;

// Individual exports if you need to import a specific link separately:
export const FACEBOOK_URL = SOCIAL_LINKS.facebook;
export const TWITTER_URL = SOCIAL_LINKS.twitter;
export const INSTAGRAM_URL = SOCIAL_LINKS.instagram;
export const LINKEDIN_URL = SOCIAL_LINKS.linkedin;
export const TIKTOK_URL = SOCIAL_LINKS.tiktok;
export const WHATSAPP_URL = SOCIAL_LINKS.whatsapp;
export const YOUTUBE_URL = SOCIAL_LINKS.youtube;

const STORAGE_KEY = 'trb_social_links_v1';

/**
 * Retrieve current active social links (from localStorage if customized, or defaults).
 */
export const getActiveSocialLinks = (): SocialLinksConfig => {
  if (typeof window === 'undefined') return DEFAULT_SOCIAL_LINKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SOCIAL_LINKS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error reading social links from storage:', err);
  }
  return DEFAULT_SOCIAL_LINKS;
};

/**
 * Update and persist social links.
 */
export const saveSocialLinks = (updatedLinks: Partial<SocialLinksConfig>): SocialLinksConfig => {
  const current = getActiveSocialLinks();
  const merged: SocialLinksConfig = { ...current, ...updatedLinks };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event('trb_social_links_updated'));
  } catch (err) {
    console.error('Error saving social links to storage:', err);
  }
  return merged;
};
