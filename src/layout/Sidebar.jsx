/**
 * src/layout/Sidebar.jsx
 * ------------------------------------------------------------------
 * Modeled on claude.ai's sidebar pattern:
 *   - a search box at the top that filters as you type
 *   - a "+ New topic" button (claude.ai's "New chat")
 *   - a "Languages" section of collapsible groups (claude.ai's
 *     "Projects") - each group auto-expands when it contains a
 *     search match or is the currently open category, and collapses
 *     otherwise
 *   - a "Recent" section below it (claude.ai's ungrouped chat list),
 *     backed by localStorage via src/utils/recentTopics.js
 *
 * `open` (boolean prop) controls collapsed/expanded rail mode, set by
 * the toggle button in Header.jsx via AppLayout's shared state.
 */

import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES } from '../data/topics/index.js';
import { getRecentTopics } from '../utils/recentTopics.js';
import { paths } from '../routes/routes.config.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Sidebar.css';

export default function Sidebar({ open }) {
  const navigate = useNavigate();
  const { categoryKey: activeCategoryKey } = useParams();
  const { role } = useAuth();
  const canAuthorContent = role === 'admin' || role === 'editor';
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState([]);

  // Re-read "recent" from localStorage whenever the sidebar mounts AND
  // whenever the active category/topic changes (i.e. after navigating
  // to a new topic, which is what updates the stored list in the
  // first place - see TopicPage.jsx).
  useEffect(() => {
    setRecent(getRecentTopics());
  }, [activeCategoryKey]);

  const trimmedSearch = search.trim().toLowerCase();

  /**
   * expandedKeys: which category groups should render open right now.
   * Rule (this is the "auto close and open" behavior):
   *   - while searching: expand every category that has at least one
   *     matching topic, collapse the rest
   *   - not searching: expand only the category matching the current
   *     URL (if any), collapse the rest
   */
  const expandedKeys = useMemo(() => {
    if (trimmedSearch) {
      return new Set(
        CATEGORIES.filter((c) =>
          c.topics.some((t) => t.title.toLowerCase().includes(trimmedSearch))
        ).map((c) => c.key)
      );
    }
    return new Set(activeCategoryKey ? [activeCategoryKey] : []);
  }, [trimmedSearch, activeCategoryKey]);

  // Manual overrides: clicking a group header toggles it regardless of
  // the automatic rule above. Stored separately so typing in search
  // doesn't fight with a manual click.
  const [manualOverrides, setManualOverrides] = useState({});

  function isExpanded(categoryKey) {
    if (categoryKey in manualOverrides) return manualOverrides[categoryKey];
    return expandedKeys.has(categoryKey);
  }

  function toggleGroup(categoryKey) {
    setManualOverrides((prev) => ({ ...prev, [categoryKey]: !isExpanded(categoryKey) }));
  }

  if (!open) {
    // Collapsed "rail" mode: just color dots per category, click to
    // jump straight to that category page (and implicitly re-expand
    // full sidebar isn't required - the rail is enough to navigate).
    return (
      <nav className="sidebar sidebar--collapsed" aria-label="Topic categories (collapsed)">
        {CATEGORIES.map((category) => (
          <button
            key={category.key}
            className="sidebar__rail-dot"
            style={{ background: category.color }}
            title={category.label}
            onClick={() => navigate(paths.category(category.key))}
          >
            {category.label.charAt(0)}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="sidebar" aria-label="Topic categories">
      <input
        type="search"
        className="sidebar__search"
        placeholder="Search topics…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search topics"
      />

      {canAuthorContent && (
        <button type="button" className="sidebar__new-btn" onClick={() => navigate(paths.createPage())}>
          + New topic
        </button>
      )}

      <p className="sidebar__section-label">Languages</p>

      {CATEGORIES.map((category) => {
        const matchingTopics = trimmedSearch
          ? category.topics.filter((t) => t.title.toLowerCase().includes(trimmedSearch))
          : category.topics;

        if (trimmedSearch && matchingTopics.length === 0) return null;

        const expanded = isExpanded(category.key);

        return (
          <div key={category.key} className="sidebar__group">
            <button
              type="button"
              className="sidebar__group-header"
              onClick={() => toggleGroup(category.key)}
              aria-expanded={expanded}
            >
              <span className="sidebar__dot" style={{ background: category.color }} />
              <span className="sidebar__group-title">{category.label}</span>
              <span className={`sidebar__chevron ${expanded ? 'sidebar__chevron--open' : ''}`}>›</span>
            </button>

            {expanded && (
              <ul className="sidebar__list">
                {matchingTopics.map((topic) => (
                  <li key={topic.slug}>
                    <NavLink
                      to={paths.topic(category.key, topic.slug)}
                      className={({ isActive }) =>
                        isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                      }
                    >
                      {topic.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {recent.length > 0 && !trimmedSearch && (
        <>
          <p className="sidebar__section-label">Recent</p>
          <ul className="sidebar__list">
            {recent.map((item) => (
              <li key={`${item.categoryKey}-${item.slug}`}>
                <NavLink to={paths.topic(item.categoryKey, item.slug)} className="sidebar__link">
                  {item.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </>
      )}

      {role === 'admin' && (
        <NavLink to={paths.adminUsers()} className="sidebar__link" style={{ marginTop: 'auto' }}>
          Manage users
        </NavLink>
      )}
    </nav>
  );
}
