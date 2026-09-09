/**
 * src/pages/Dashboard.jsx
 * ------------------------------------------------------------------
 * The landing page ("/") - styled after the "big colorful grid of
 * language cards" pattern from sites like awesome-cheatsheets: a
 * short hero, then one card per category, each tinted with that
 * category's color (see CATEGORIES in data/topics/index.js).
 *
 * Clicking a card goes to that category's listing page
 * (/content/:categoryKey). The quick-jump dropdowns from the first
 * version are kept as a smaller secondary control for people who'd
 * rather type/select than scan cards.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, getCategory } from '../data/topics/index.js';
import { paths } from '../routes/routes.config.js';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(CATEGORIES[0]?.key ?? '');
  const topicsInCategory = getCategory(selectedCategoryKey)?.topics ?? [];

  function handleTopicChange(event) {
    const topicSlug = event.target.value;
    if (topicSlug) navigate(paths.topic(selectedCategoryKey, topicSlug));
  }

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        <h1>DevHub</h1>
        <p className="dashboard__lede">
          Explanations, real code samples, and inline tools for Java, JavaScript,
          Node.js, JSON, JWT, and Git - one place, so you stop bookmarking six
          different sites.
        </p>

        <div className="dashboard__jump">
          <label className="dashboard__field">
            <span>Jump to</span>
            <select value={selectedCategoryKey} onChange={(e) => setSelectedCategoryKey(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="dashboard__field">
            <span>Topic</span>
            <select defaultValue="" onChange={handleTopicChange}>
              <option value="" disabled>Choose a topic…</option>
              {topicsInCategory.map((t) => (
                <option key={t.slug} value={t.slug}>{t.title}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="dashboard__grid">
        {CATEGORIES.map((category) => (
          <button
            key={category.key}
            type="button"
            className="lang-card"
            style={{ '--card-color': category.color }}
            onClick={() => navigate(paths.category(category.key))}
          >
            <span className="lang-card__badge">{category.label.charAt(0)}</span>
            <span className="lang-card__title">{category.label}</span>
            <span className="lang-card__meta">
              {category.topics.length} topics · {category.tools.length} tools
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
