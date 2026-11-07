import { createClient } from '@supabase/supabase-js';
import { ENV, validateEnv } from '../config/env';

let supabaseClient = null;

/**
 * Initializes and returns the Supabase client instance.
 * Gracefully handles missing/placeholder credentials so the UI can prompt the user.
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { isConfigured } = validateEnv();

  if (!isConfigured) {
    // Return a dummy/safe client proxy to avoid crashing if env is not configured yet
    return null;
  }

  try {
    supabaseClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
    return supabaseClient;
  } catch (error) {
    console.error('[supabaseService] Failed to initialize Supabase client:', error);
    return null;
  }
}

export const supabaseService = {
  getClient: getSupabaseClient,

  async getSession() {
    const client = getSupabaseClient();
    if (!client) return { session: null, error: new Error('Supabase not configured in .env') };

    try {
      const { data, error } = await client.auth.getSession();
      return { session: data?.session || null, error };
    } catch (error) {
      return { session: null, error };
    }
  },

  onAuthStateChange(callback) {
    const client = getSupabaseClient();
    if (!client) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return client.auth.onAuthStateChange(callback);
  },

  async signOut() {
    const client = getSupabaseClient();
    if (!client) return { error: null };
    try {
      const { error } = await client.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  }
};

