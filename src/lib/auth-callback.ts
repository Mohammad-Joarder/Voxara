/**
 * After Supabase email links / OAuth, the browser must return to this path on the same
 * origin the user is using (e.g. https://voxara.netlify.app/auth/confirm). Supabase
 * must allow it under Authentication → URL configuration → Redirect URLs.
 */
export function getAuthCallbackUrl() {
  if (typeof window === 'undefined') {
    return null
  }
  return `${window.location.origin}/auth/confirm`
}
