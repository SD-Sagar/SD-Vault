/**
 * Supabase Metadata Service
 * Manages lightweight application metadata (favorites, tags, activity log).
 * Google Drive remains the sole source of truth for files and folders.
 */

import { supabaseService } from './supabaseService';

export const metadataService = {
  /**
   * Retrieves user's favorite file IDs
   * @param {string} userId 
   * @returns {Promise<Set<string>>}
   */
  async getFavorites(userId) {
    const client = supabaseService.getClient();
    if (!client || !userId) return new Set();

    try {
      const { data, error } = await client
        .from('vault_favorites')
        .select('file_id')
        .eq('user_id', userId);

      if (error) {
        console.warn('[metadataService] Could not fetch favorites:', error.message);
        return new Set();
      }

      return new Set((data || []).map(row => row.file_id));
    } catch {
      return new Set();
    }
  },

  /**
   * Toggles favorite status for a file
   */
  async toggleFavorite(userId, fileId) {
    const client = supabaseService.getClient();
    if (!client || !userId || !fileId) return false;

    try {
      // Check if already favorite
      const { data } = await client
        .from('vault_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('file_id', fileId)
        .maybeSingle();

      if (data) {
        // Remove from favorites
        await client
          .from('vault_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('file_id', fileId);
        return false;
      } else {
        // Add to favorites
        await client
          .from('vault_favorites')
          .insert({ user_id: userId, file_id: fileId, created_at: new Date().toISOString() });
        return true;
      }
    } catch (e) {
      console.warn('[metadataService] Failed to toggle favorite:', e);
      return false;
    }
  },

  /**
   * Logs a user vault action (upload, rename, delete)
   */
  async logActivity(userId, action, itemName) {
    const client = supabaseService.getClient();
    if (!client || !userId) return;

    try {
      await client.from('vault_activity').insert({
        user_id: userId,
        action,
        item_name: itemName,
        created_at: new Date().toISOString()
      });
    } catch {
      // Non-blocking telemetry
    }
  },

  /**
   * Retrieves recent vault activity
   */
  async getRecentActivity(userId, limit = 20) {
    const client = supabaseService.getClient();
    if (!client || !userId) return [];

    try {
      const { data, error } = await client
        .from('vault_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
};

