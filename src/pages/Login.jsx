import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { ROLES } from '../data/constants.js';

export default function Login() {
  const { login } = useStore();
  const nav = useNavigate();
  const go = (r) => { login(r); nav(r === 'master_admin' ? '/master/summary' : '/dashboard'); };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="text-center mb-4">
          <span className="badge bg-danger mb-2 px-3 py-2">VERSI DEMO</span>
          <h2 className="fw-bold mb-1">ODAJAH <span style={{ color: '#e94560' }}>ERP</span></h2>
          <p className="text-muted mb-0 small">Sistem pengurusan order &amp; operasi — Sales, Payment, Logistik, HR</p>
        </div>

        <div className="alert alert-warning small d-flex gap-2 align-items-start">
          <i className="bi bi-info-circle-fill mt-1" />
          <div>Ini <strong>demo interaktif</strong>, bukan sistem production. Tiada sambungan ke server, database atau API sebenar. Semua nama, telefon, alamat &amp; angka adalah <strong>rekaan</strong>.</div>
        </div>

        <div className="fw-semibold mb-2">Demo Login — pilih role (satu klik):</div>
        <div className="row g-2">
          {Object.entries(ROLES).map(([k, v]) => (
            <div className="col-12 col-sm-6 col-md-4" key={k}>
              <button className="role-tile" onClick={() => go(k)} data-role={k}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className={`bi ${v.icon}`} />
                  <span className="fw-bold">{v.label}</span>
                </div>
                <div className="small text-muted">{v.desc}</div>
              </button>
            </div>
          ))}
        </div>

        <div className="text-center small text-muted mt-4">
          Demo portfolio oleh <strong>MHM Web Studio</strong> · Data disimpan dalam browser anda sahaja
        </div>
      </div>
    </div>
  );
}
