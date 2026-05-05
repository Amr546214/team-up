import { supabase } from '../../../lib/supabase';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  provider: string | null;
}

/**
 * Fetch all available profiles from Supabase (excluding the current user).
 * Dev-only utility to verify profiles table access.
 */
export async function getAvailableProfiles(currentUserId?: string): Promise<{
  data: Profile[] | null;
  error: string | null;
}> {
  try {
    console.log('[Profiles Debug] excluding current user id', currentUserId);

    // First fetch ALL profiles without any filter to see raw data
    const { data: rawData, error: rawError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, provider')
      .order('full_name', { ascending: true });

    console.log('[Profiles Debug] raw profiles count', rawData?.length);
    console.log('[Profiles Debug] raw profiles', rawData);

    if (rawError) {
      console.error('[Profiles Debug] profiles fetch error', rawError);
      return { data: null, error: rawError.message };
    }

    // Now filter out the current user client-side for debug clarity
    let filteredProfiles = rawData as Profile[];
    if (currentUserId && filteredProfiles) {
      filteredProfiles = filteredProfiles.filter(p => p.id !== currentUserId);
    }

    console.log('[Profiles Debug] filtered profiles count', filteredProfiles?.length);
    console.log('[Profiles Debug] filtered profiles', filteredProfiles);

    return { data: filteredProfiles, error: null };
  } catch (err: any) {
    console.error('[ProfileService] Unexpected error:', err);
    return { data: null, error: err?.message || 'Unexpected error' };
  }
}
