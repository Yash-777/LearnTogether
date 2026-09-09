/**
 * src/routes/routes.config.js
 * ------------------------------------------------------------------
 * Centralized URL path builders - see App.jsx for the actual
 * <Route> definitions.
 */

export const paths = {
  home: () => '/',
  category: (categoryKey) => `/content/${categoryKey}`,
  topic: (categoryKey, slug) => `/content/${categoryKey}/${slug}`,
  createPage: () => '/create-page',
  drafts: () => '/drafts',
  preferences: () => '/preferences',
  signUp: () => '/signup',
  signIn: () => '/signin',
  adminUsers: () => '/admin/users',
};
