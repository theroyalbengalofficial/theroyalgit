import { CustomerUser } from '../types';

export interface AuthConfig {
  googleClientId: string;
  facebookAppId: string;
  hasGoogleConfigured: boolean;
  hasFacebookConfigured: boolean;
}

export const DEFAULT_GOOGLE_CLIENT_ID = '670897616734-vh4meatk3ndiqff4anupfoi17qfd10ou.apps.googleusercontent.com';
export const DEFAULT_FACEBOOK_APP_ID = '1076141502060574';

const LOCAL_STORAGE_GOOGLE_KEY = 'trb_google_client_id';
const LOCAL_STORAGE_FB_KEY = 'trb_facebook_app_id';

let googleSdkPromise: Promise<void> | null = null;
let fbSdkPromise: Promise<void> | null = null;

export const authService = {
  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------
  async getAuthConfig(): Promise<AuthConfig> {
    let googleClientId =
      localStorage.getItem(LOCAL_STORAGE_GOOGLE_KEY) ||
      localStorage.getItem('trb_sandbox_google_client_id') ||
      localStorage.getItem('google_client_id') ||
      localStorage.getItem('googleClientId') ||
      DEFAULT_GOOGLE_CLIENT_ID;
    let facebookAppId =
      localStorage.getItem(LOCAL_STORAGE_FB_KEY) ||
      localStorage.getItem('trb_sandbox_fb_app_id') ||
      localStorage.getItem('fb_app_id') ||
      localStorage.getItem('facebookAppId') ||
      DEFAULT_FACEBOOK_APP_ID;

    // Check environment variables as fallback
    const envGoogle = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const envFb = import.meta.env.VITE_FACEBOOK_APP_ID;

    if ((!googleClientId || googleClientId.includes('your-google-client-id')) && envGoogle && !envGoogle.includes('your-google-client-id')) {
      googleClientId = envGoogle;
    }
    if ((!facebookAppId || facebookAppId === '1234567890123456') && envFb && envFb !== '1234567890123456') {
      facebookAppId = envFb;
    }

    if (!googleClientId || googleClientId.includes('your-google-client-id')) {
      googleClientId = DEFAULT_GOOGLE_CLIENT_ID;
    }
    if (!facebookAppId || facebookAppId === '1234567890123456') {
      facebookAppId = DEFAULT_FACEBOOK_APP_ID;
    }

    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const data = await res.json();
        if (data.googleClientId) {
          googleClientId = data.googleClientId;
        } else if (googleClientId) {
          // Sync client-cached ID back to server storage
          fetch('/api/auth/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ googleClientId }),
          }).catch(() => {});
        }

        if (data.facebookAppId) {
          facebookAppId = data.facebookAppId;
        } else if (facebookAppId) {
          // Sync client-cached App ID back to server storage
          fetch('/api/auth/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ facebookAppId }),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[authService] Could not reach /api/auth/config, using local config:', err);
    }

    return {
      googleClientId: googleClientId.trim(),
      facebookAppId: facebookAppId.trim(),
      hasGoogleConfigured: !!googleClientId.trim(),
      hasFacebookConfigured: !!facebookAppId.trim(),
    };
  },

  async saveAuthConfig(config: { googleClientId?: string; facebookAppId?: string }): Promise<AuthConfig> {
    if (config.googleClientId !== undefined) {
      localStorage.setItem(LOCAL_STORAGE_GOOGLE_KEY, config.googleClientId.trim());
    }
    if (config.facebookAppId !== undefined) {
      localStorage.setItem(LOCAL_STORAGE_FB_KEY, config.facebookAppId.trim());
    }

    try {
      await fetch('/api/auth/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch (err) {
      console.warn('[authService] Could not save to /api/auth/config:', err);
    }

    return this.getAuthConfig();
  },

  // --------------------------------------------------------------------------
  // Google Identity Services SDK Loader
  // --------------------------------------------------------------------------
  loadGoogleSdk(): Promise<void> {
    if ((window as any).google?.accounts?.oauth2) {
      return Promise.resolve();
    }
    if (googleSdkPromise) return googleSdkPromise;

    googleSdkPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById('google-gsi-script');
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        googleSdkPromise = null;
        reject(new Error('Failed to load Google Identity Services SDK'));
      };
      document.head.appendChild(script);
    });

    return googleSdkPromise;
  },

  // --------------------------------------------------------------------------
  // Facebook JavaScript SDK Loader
  // --------------------------------------------------------------------------
  loadFacebookSdk(appId: string): Promise<void> {
    if ((window as any).FB) {
      return Promise.resolve();
    }
    if (fbSdkPromise) return fbSdkPromise;

    fbSdkPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById('facebook-jssdk');
      if (existing) {
        resolve();
        return;
      }

      (window as any).fbAsyncInit = function () {
        (window as any).FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        });
        resolve();
      };

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        fbSdkPromise = null;
        reject(new Error('Failed to load Facebook SDK'));
      };
      document.head.appendChild(script);
    });

    return fbSdkPromise;
  },

  // --------------------------------------------------------------------------
  // REAL GOOGLE SIGN-IN
  // --------------------------------------------------------------------------
  async signInWithGoogle(): Promise<{ user?: CustomerUser; error?: string; requiresSetup?: boolean }> {
    const config = await this.getAuthConfig();
    if (!config.hasGoogleConfigured) {
      return {
        requiresSetup: true,
        error: 'Google OAuth Client ID is not configured yet.',
      };
    }

    try {
      await this.loadGoogleSdk();

      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        throw new Error('Google Identity Services client is not available.');
      }

      return new Promise((resolve) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: config.googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                // Fetch real profile from Google userinfo API
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!res.ok) {
                  throw new Error(`Google UserInfo returned ${res.status}`);
                }
                const info = await res.json();
                const realUser: CustomerUser = {
                  id: `google_${info.sub}`,
                  name: info.name || info.given_name || 'Google User',
                  email: info.email,
                  avatar: info.picture,
                  provider: 'google',
                  joinedAt: new Date().toISOString(),
                };
                resolve({ user: realUser });
              } catch (err: any) {
                resolve({ error: err.message || 'Failed to fetch Google profile' });
              }
            } else if (tokenResponse && tokenResponse.error) {
              resolve({ error: `Google Sign-In: ${tokenResponse.error}` });
            } else {
              resolve({ error: 'Google sign-in was cancelled or closed' });
            }
          },
          error_callback: (err: any) => {
            console.error('[authService] Google token client error:', err);
            resolve({ error: err?.message || 'Google popup was closed or origin not authorized' });
          },
        });

        // Request real Google account access via official popup
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      });
    } catch (err: any) {
      return { error: err.message || 'Failed to initialize Google Sign-In' };
    }
  },

  // --------------------------------------------------------------------------
  // REAL FACEBOOK SIGN-IN
  // --------------------------------------------------------------------------
  async signInWithFacebook(): Promise<{ user?: CustomerUser; error?: string; requiresSetup?: boolean }> {
    const config = await this.getAuthConfig();
    if (!config.hasFacebookConfigured) {
      return {
        requiresSetup: true,
        error: 'Facebook App ID is not configured yet.',
      };
    }

    try {
      await this.loadFacebookSdk(config.facebookAppId);
      const FB = (window as any).FB;
      if (!FB) {
        throw new Error('Facebook SDK is not available.');
      }

      return new Promise((resolve) => {
        FB.login(
          (response: any) => {
            if (response.authResponse) {
              FB.api(
                '/me',
                { fields: 'id,name,email,picture.width(200)' },
                (userInfo: any) => {
                  if (userInfo && userInfo.name) {
                    const realUser: CustomerUser = {
                      id: `fb_${userInfo.id}`,
                      name: userInfo.name,
                      email: userInfo.email || `${userInfo.id}@facebook.user`,
                      avatar: userInfo.picture?.data?.url,
                      provider: 'facebook',
                      joinedAt: new Date().toISOString(),
                    };
                    resolve({ user: realUser });
                  } else {
                    resolve({ error: 'Failed to retrieve Facebook user details' });
                  }
                }
              );
            } else {
              resolve({ error: 'Facebook login was cancelled or not authorized' });
            }
          },
          { scope: 'public_profile,email' }
        );
      });
    } catch (err: any) {
      return { error: err.message || 'Failed to initialize Facebook Login' };
    }
  },
};
