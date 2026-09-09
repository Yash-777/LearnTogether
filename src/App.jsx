/**
 * src/App.jsx
 * ------------------------------------------------------------------
 * URL <-> page mapping.
 *
 *   /                                   -> Dashboard
 *   /content/:categoryKey               -> CategoryPage
 *   /content/:categoryKey/:topicSlug    -> TopicPage (some topics gated - see topic.restricted)
 *   /signup, /signin                    -> auth pages
 *   /create-page                        -> NewTopicPage   [admin, editor only]
 *   /drafts                             -> DraftsPage      [admin, editor only]
 *   /admin/users                        -> UsersPage        [admin only]
 *   /preferences                        -> Preferences
 *   anything else                       -> NotFound
 *
 * RequireRole wraps the role-gated routes - see components/RequireRole.jsx
 * for what it does and its important "UI guard, not a security
 * boundary" caveat (the server enforces the real rule).
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CategoryPage from './pages/content/CategoryPage.jsx';
import TopicPage from './pages/content/TopicPage.jsx';
import NewTopicPage from './pages/admin/NewTopicPage.jsx';
import DraftsPage from './pages/admin/DraftsPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import Preferences from './pages/Preferences.jsx';
import SignUpPage from './pages/auth/SignUpPage.jsx';
import SignInPage from './pages/auth/SignInPage.jsx';
import NotFound from './pages/NotFound.jsx';
import RequireRole from './components/RequireRole.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/content/:categoryKey" element={<CategoryPage />} />
          <Route path="/content/:categoryKey/:topicSlug" element={<TopicPage />} />

          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />

          <Route
            path="/create-page"
            element={<RequireRole allow={['admin', 'editor']}><NewTopicPage /></RequireRole>}
          />
          <Route
            path="/drafts"
            element={<RequireRole allow={['admin', 'editor']}><DraftsPage /></RequireRole>}
          />
          <Route
            path="/admin/users"
            element={<RequireRole allow={['admin']}><UsersPage /></RequireRole>}
          />

          <Route path="/preferences" element={<Preferences />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
