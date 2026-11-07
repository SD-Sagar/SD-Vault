/**
 * Safe Environment Configuration Reader
 */

const rawEnv = import.meta.env;

export const ENV = {
  SUPABASE_URL: rawEnv.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: rawEnv.VITE_SUPABASE_ANON_KEY || '',
  GOOGLE_CLIENT_ID: rawEnv.VITE_GOOGLE_CLIENT_ID || '',
  APP_URL: rawEnv.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
};

/**
 * Validates whether real Supabase credentials have been configured
 * @returns {{ isConfigured: boolean, missingKeys: string[] }}
 */
export function validateEnv() {
  const missing = [];

  const isPlaceholderUrl = !ENV.SUPABASE_URL || 
    ENV.SUPABASE_URL.includes('your-project.supabase.co') ||
    !ENV.SUPABASE_URL.startsWith('http');

  const isPlaceholderKey = !ENV.SUPABASE_ANON_KEY || 
    ENV.SUPABASE_ANON_KEY.includes('your-supabase-anon-key');

  if (isPlaceholderUrl) missing.push('VITE_SUPABASE_URL');
  if (isPlaceholderKey) missing.push('VITE_SUPABASE_ANON_KEY');

  return {
    isConfigured: missing.length === 0,
    missingKeys: missing
  };
}

