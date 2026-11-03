import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { NAV, EXTRA } from '../nav.js';
import { ROLES } from '../data/constants.js';
import { Modal } from './ui.jsx';

function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('odajah_demo_theme') || 'light'; } catch { return 'light'; } });
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem('odajah_demo_theme', theme); } catch { /* */ }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

export function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      <i className="bi bi-exclamation-triangle-fill me-1" />
      DEMO — bukan sistem production. Semua data adalah rekaan &amp; disimpan dalam browser anda sahaja.
    </div>
  );
}

export function useThemeToggle() { return useTheme(); }

export default function Layout({ children }) {
  const { db, user, role, login, logout, resetDemo } = useStore();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => setOpen(false), [loc.pathname, loc.search]);

  const counts = {
    pendingPay: db.orders.filter((o) => o.payment.method === 'transfer' && o.payment.status === 'pending').length,
    pendingRem: db.remittances.filter((r) => r.status === 'pending').length,
    awaiting: db.orders.filter((o) => o.status === 'approved').length,
    pendingLeave: db.leaves.filter((l) => l.status === 'pending').length,
  };

  const items = NAV[role] || [];
  const full = loc.pathname + loc.search;
  const isActive = (to) => {
    if (to.includes('?')) return full === to;
    if (to === '/orders') return loc.pathname === '/orders' && !loc.search;
    if (to === '/logistik') return loc.pathname.startsWith('/logistik');
    if (to === '/hr') return loc.pathname === '/hr';
    return loc.pathname === to;
  };
  const current = [...items, ...EXTRA].find((i) => i.to && isActive(i.to));
  const r = ROLES[role];

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'mobile-open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'mobile-open' : ''}`} aria-label="Navigasi utama">
        <div className="brand">ODAJAH <span>ERP</span><small>VERSI DEMO</small></div>
        <span className={`role-badge ${r.badge}`}>{role === 'sales' && user.team === 'AGENT' ? 'Agent' : r.label}</span>
        <nav className="nav flex-column mt-1">
          {items.map((it, i) => it.section ? (
            <div key={i} className="nav-section">{it.section}</div>
          ) : (
            <NavLink key={it.to} to={it.to} className={() => `nav-link ${isActive(it.to) ? 'active' : ''}`} end>
              <i className={`bi ${it.icon}`} />{it.label}
              {it.badge && counts[it.badge] > 0 && <span className="badge bg-danger nav-badge">{counts[it.badge]}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-3 pb-2" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
          {EXTRA.map((it) => (
            <NavLink key={it.to} to={it.to} className={() => `nav-link py-2 ${isActive(it.to) ? 'active' : ''}`}><i className={`bi ${it.icon}`} />{it.label}</NavLink>
          ))}
          <button className="nav-link py-2 border-0 bg-transparent text-start" onClick={() => setConfirmReset(true)}><i className="bi bi-arrow-counterclockwise" />Reset Demo</button>
          <button className="nav-link py-2 border-0 bg-transparent text-start text-danger" onClick={() => { logout(); nav('/login'); }}><i className="bi bi-box-arrow-left" />Log Keluar</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <button className="hamburger-btn" onClick={() => setOpen(true)} aria-label="Buka menu"><i className="bi bi-list" /></button>
            <h6 className="mb-0 fw-bold text-truncate">{current?.label || 'ODAJAH ERP'}</h6>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small d-none d-lg-inline"><i className="bi bi-person-circle me-1" />{user.name}</span>
            <select
              className="form-select form-select-sm" style={{ width: 'auto' }} value={role} aria-label="Tukar role demo"
              onChange={(e) => { login(e.target.value); nav(e.target.value === 'master_admin' ? '/master/summary' : '/dashboard'); }}
            >
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button className="btn btn-sm btn-outline-danger d-none d-sm-inline-flex align-items-center gap-1" onClick={() => setConfirmReset(true)} title="Reset Demo">
              <i className="bi bi-arrow-counterclockwise" /><span className="d-none d-md-inline">Reset</span>
            </button>
            <button className="btn btn-sm btn-link text-reset" onClick={toggleTheme} title="Tukar tema" aria-label="Tukar tema">
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'}`} />
            </button>
          </div>
        </div>
        {children}
      </main>
      <div className="demo-watermark">DEMO</div>

      {confirmReset && (
        <Modal title="Reset Demo?" onClose={() => setConfirmReset(false)} footer={<>
          <button className="btn btn-light" onClick={() => setConfirmReset(false)}>Batal</button>
          <button className="btn btn-danger" onClick={() => { resetDemo(); setConfirmReset(false); }}><i className="bi bi-arrow-counterclockwise me-1" />Reset</button>
        </>}>
          Semua perubahan yang anda buat (order baharu, pengesahan, cuti, produk) akan dipadam dan data contoh asal dipulihkan. Ini hanya memberi kesan pada browser anda.
        </Modal>
      )}
    </>
  );
}
