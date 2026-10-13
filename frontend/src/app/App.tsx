import { TripPlanner } from '../features/planner/components/TripPlanner';
import { useState } from 'react';
import { Icon } from '../components/Icon';
import { RiskCalculator } from '../features/risk/components/RiskCalculator';
import { ProjectOverview } from '../features/project/ProjectOverview';

const pages = [
  { id: 'planner', label: 'Trip planner', icon: 'route' },
  { id: 'workspace', label: 'Risk workspace', icon: 'grid' },
  { id: 'methodology', label: 'Risk methodology', icon: 'book' },
  { id: 'roadmap', label: 'Build roadmap', icon: 'route' },
] as const;
export type Page = (typeof pages)[number]['id'];

export function App() {
  const [page, setPage] = useState<Page>('planner');
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Spotter home">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>
          spotter<span>.</span>
        </a>
        <div className="workspace-label">DISPATCH INTELLIGENCE</div>
        <nav aria-label="Main navigation">
          {pages.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
              {page === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">THE BIGGER PICTURE</span>
          <Icon name="route" size={28} />
          <h3>
            Every mile.
            <br />
            Better informed.
          </h3>
          <p>Weather, cargo, and travel time. One clearer route decision.</p>
          <button onClick={() => setPage('roadmap')}>
            Explore the roadmap <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">S</span>
          <div>
            <strong>Spotter assessment</strong>
            <span>Development workspace</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{' '}
            <strong>{pages.find((item) => item.id === page)?.label}</strong>
          </div>
          <span className="environment">
            <span />
            {page === 'planner'
              ? 'Live route forecasts'
              : 'Risk analysis workspace'}
          </span>
        </header>
        <main id="main" tabIndex={-1}>
          {page === 'planner' ? (
            <TripPlanner />
          ) : page === 'workspace' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">SAFER DECISIONS START HERE</p>
                  <h1>
                    Confidence at every checkpoint<span>.</span>
                  </h1>
                  <p>Understand how weather and cargo shape the road ahead.</p>
                </div>
                <span className="version-tag">RISK ENGINE / V0.1</span>
              </div>
              <div className="overview-strip">
                <div>
                  <span className="overview-icon">
                    <Icon name="shield" />
                  </span>
                  <p>
                    <strong>Weather-aware assessment</strong>
                    <span>Wind, rain, and snow evaluated together</span>
                  </p>
                </div>
                <div>
                  <span className="overview-icon">
                    <Icon name="load" />
                  </span>
                  <p>
                    <strong>Load-sensitive decisions</strong>
                    <span>Cargo weight adjusts wind exposure</span>
                  </p>
                </div>
                <div>
                  <span className="overview-icon">
                    <Icon name="route" />
                  </span>
                  <p>
                    <strong>Clear risk priorities</strong>
                    <span>The highest condition sets the level</span>
                  </p>
                </div>
              </div>
              <RiskCalculator />
              <div className="workspace-bottom">
                <div>
                  <Icon name="info" size={18} />
                  <p>
                    <strong>A focused first milestone.</strong> This workspace
                    evaluates manual scenarios. Open Trip planner for live
                    routes and forecasts. The map and heatmap are the next
                    milestone.
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setPage('roadmap')}
                >
                  View build roadmap <Icon name="arrow" size={16} />
                </button>
              </div>
            </>
          ) : (
            <ProjectOverview page={page} />
          )}
          <footer>
            <span>
              SPOTTER <span className="footer-divider">/</span> Weather-aware
              truck routing
            </span>
            <span>Built for clarity. Designed for the road.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
