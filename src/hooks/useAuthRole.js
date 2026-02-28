import { useUserProfile } from './useUserProfile';

/**
 * useAuthRole — DEPRECATED: now uses tier from useUserProfile
 *
 * Returns role based on user's tier field.
 * This hook is a wrapper around useUserProfile for backwards compatibility.
 *
 * @returns {{ role: 'user' | 'assessor' | 'admin', isLoading: boolean, error: Error | null }}
 */
export function useAuthRole() {
  const { profile, isLoadingProfile } = useUserProfile();

  const role = profile?.tier === 'admin' ? 'admin'
             : profile?.tier === 'assessor' ? 'assessor'
             : 'user';

  return { role, isLoading: isLoadingProfile, error: null };
}
