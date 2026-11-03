import { useState } from 'react';
import { useStore } from '../store.jsx';
import { LEAVE_TYPES, ROLES } from '../data/constants.js';
import { PageHeader, Modal, Empty, StatCard, Sim } from '../components/ui.jsx';
import { rm, today, inRange, MONTHS } from '../utils.js';

// Kehadiran rekaan, deterministik ikut (pengguna, tarikh). Sistem sebenar menerima data dari peranti cap jari.
export function attendanceFor(userId, date) {
  let h = 0; const s = `${userId}|${date}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const day = new Date(date).getDay();
  if (day === 0 || day === 6) return { status: 'Cuti Minggu', in: '', out: '' };
  const r = h % 100;
  if (r < 8) return { status: 'Tidak Hadir', in: '', out: '' };
  const late = r < 22;
  const mi = late ? 5 + (h % 40) : h % 15;
  const inT = late ? `09:${String(mi).padStart(2, '0')}` : `08:${String(45 + (mi % 15)).padStart(2, '0')}`;
  return { status: late ? 'Lewat' : 'Hadir', in: inT, out: `18:${String(h % 30).padStart(2, '0')}` };
}

export function Attendance() {
  const { db } = useStore();
  const [date, setDate] = useState(today());
  const staff = db.users.filter((u) => u.active && u.role !== 'master_admin');
  const rows = staff.map((u) => ({ u, a: attendanceFor(u.id, date) }));
  const c = (s) => rows.filter((r) => r.a.status === s).length;
  const cls = { Hadir: 'bg-success', Lewat: 'bg-warning text-dark', 'Tidak Hadir': 'bg-danger', 'Cuti Minggu': 'bg-secondary' };
  return (
    <>
      <PageHeader title="Rekod Kehadiran" sub={<>Data check-in/check-out daripada peranti cap jari <Sim>DATA SIMULASI</Sim></>}>
        <input type="date" className="form-control form-control-sm" value={date} onChange={(e) => setDate(e.target.value)} max={today()} />
      </PageHeader>
      <div className="row g-3 mb-3">
        <div className="col-4"><StatCard label="Hadir" value={c('Hadir')} color="#198754" /></div>
        <div className="col-4"><StatCard label="Lewat" value={c('Lewat')} color="#ffc107" /></div>
        <div className="col-4"><StatCard label="Tidak Hadir" value={c('Tidak Hadir')} color="#dc3545" /></div>
      </div>
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Nama</th><th>Jawatan</th><th>Shift</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
        <tbody>{rows.map(({ u, a }) => <tr key={u.id}><td>{u.name}</td><td className="small">{ROLES[u.role].label}{u.team === 'AGENT' ? ' (Agent)' : ''}</td><td className="small">09:00 – 18:00</td><td>{a.in || '—'}</td><td>{a.out || '—'}</td><td><span className={`badge ${cls[a.status]}`}>{a.status}</span></td></tr>)}</tbody>
      </table></div></div>
    </>
  );
}

const days = (l) => (l.type === 'halfday' ? 0.5 : Math.round((new Date(l.end) - new Date(l.start)) / 86400000) + 1);
const LBadge = ({ s }) => <span className={`badge ${{ pending: 'bg-warning text-dark', approved: 'bg-success', rejected: 'bg-danger' }[s]}`}>{{ pending: 'Menunggu', approved: 'Lulus', rejected: 'Ditolak' }[s]}</span>;

export function ProcessLeaves() {
  const { db, reviewLeave } = useStore();
  const [filter, setFilter] = useState('pending');
  const [rej, setRej] = useState(null);
  const [remark, setRemark] = useState('');
  const list = db.leaves.filter((l) => !filter || l.status === filter);
  return (
    <>
      <PageHeader title="Process Leaves" sub="Luluskan atau tolak permohonan cuti & ganti shift." />
      <div className="tabs-scroll mb-3">{[['pending', 'Menunggu'], ['approved', 'Lulus'], ['rejected', 'Ditolak'], ['', 'Semua']].map(([k, l]) => <button key={k} className={`btn btn-sm ${filter === k ? 'btn-danger' : 'btn-light'}`} onClick={() => setFilter(k)}>{l}</button>)}</div>
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Pemohon</th><th>Jenis</th><th>Tarikh</th><th className="text-end">Hari</th><th>Tujuan</th><th>Status</th><th>Tindakan</th></tr></thead>
        <tbody>{list.map((l) => (
          <tr key={l.id}>
            <td>{db.users.find((u) => u.id === l.userId)?.name}</td>
            <td className="small">{LEAVE_TYPES[l.type]}</td>
            <td className="small text-nowrap">{l.type === 'shift' ? <>Masuk: {l.shiftDate}<br />Cuti ganti: {l.start}</> : <>{l.start}{l.end !== l.start ? ` → ${l.end}` : ''}</>}</td>
            <td className="text-end">{days(l)}</td>
            <td className="small">{l.reason}{l.hrRemark && <div className="text-muted">HR: {l.hrRemark}</div>}</td>
            <td><LBadge s={l.status} /></td>
            <td className="text-nowrap">{l.status === 'pending' && <>
              <button className="btn btn-sm btn-success me-1" onClick={() => reviewLeave(l.id, 'approved')}>Lulus</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => { setRej(l); setRemark(''); }}>Tolak</button></>}</td>
          </tr>
        ))}</tbody>
      </table>{!list.length && <Empty text="Tiada permohonan." />}</div></div>
      {rej && (
        <Modal title="Tolak Permohonan" onClose={() => setRej(null)} footer={<>
          <button className="btn btn-light" onClick={() => setRej(null)}>Batal</button>
          <button className="btn btn-danger" disabled={!remark.trim()} onClick={() => { reviewLeave(rej.id, 'rejected', remark.trim()); setRej(null); }}>Tolak</button></>}>
          <label className="form-label small">Sebab Penolakan *</label><textarea className="form-control" rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} autoFocus />
        </Modal>
      )}
    </>
  );
}

export function LeaveBalances() {
  const { db } = useStore();
  return (
    <>
      <PageHeader title="Baki Cuti" sub={`Tahun ${new Date().getFullYear()} · peruntukan asas 14 hari`} />
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Staf</th><th className="text-end">Peruntukan</th><th className="text-end">Digunakan</th><th className="text-end">Baki</th><th style={{ width: '30%' }} /></tr></thead>
        <tbody>{db.leaveBalances.map((b) => { const u = db.users.find((x) => x.id === b.userId); const bal = b.allocated - b.used; return (
          <tr key={b.userId}><td>{u?.name}</td><td className="text-end">{b.allocated}</td><td className="text-end">{b.used}</td><td className={`text-end fw-bold ${bal < 3 ? 'text-danger' : ''}`}>{bal}</td>
            <td><div className="progress" style={{ height: 6 }}><div className="progress-bar bg-danger" style={{ width: `${Math.min(100, (b.used / b.allocated) * 100)}%` }} /></div></td></tr>); })}</tbody>
      </table></div></div>
    </>
  );
}

export function Performance() {
  const { db } = useStore();
  const [from, setFrom] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; });
  const [to, setTo] = useState(today());
  const rows = db.users.filter((u) => u.role === 'sales').map((u) => {
    const os = db.orders.filter((o) => o.createdBy === u.id && inRange(o.createdAt, from, to));
    const done = os.filter((o) => o.status === 'completed').length;
    return { u, total: os.length, done, rate: os.length ? Math.round((done / os.length) * 100) : 0, sales: os.filter((o) => o.status !== 'returned').reduce((s, o) => s + o.price, 0) };
  }).sort((a, b) => b.sales - a.sales);
  const preset = (d1) => { setFrom(d1); setTo(today()); };
  const now = new Date();
  return (
    <>
      <PageHeader title="Prestasi Pasukan Sales" sub="Tapis tarikh untuk bandingkan prestasi." />
      <div className="card mb-3"><div className="card-body py-2 d-flex flex-wrap gap-2 align-items-end">
        <div><label className="form-label small mb-0">Dari</label><input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className="form-label small mb-0">Hingga</label><input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <button className="btn btn-sm btn-light" onClick={() => preset(today())}>Hari Ini</button>
        <button className="btn btn-sm btn-light" onClick={() => preset(new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10))}>7 Hari Lepas</button>
        <button className="btn btn-sm btn-light" onClick={() => preset(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)}>Bulan Ini</button>
        <button className="btn btn-sm btn-light" onClick={() => preset(`${now.getFullYear()}-01-01`)}>Tahun Ini</button>
      </div></div>
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Nama</th><th>Username</th><th className="text-end">Total Order</th><th className="text-end">Selesai</th><th className="text-end">Kadar Siap</th><th className="text-end">Sales</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.u.id}><td>{r.u.name}</td><td className="small font-monospace">{r.u.username}</td><td className="text-end">{r.total}</td><td className="text-end">{r.done}</td><td className="text-end">{r.rate}%</td><td className="text-end fw-semibold">{rm(r.sales)}</td></tr>)}</tbody>
      </table></div></div>
    </>
  );
}

export function PayslipList() {
  const { db, user, role } = useStore();
  const [view, setView] = useState(null);
  const staff = ['admin', 'hr', 'accounting'].includes(role) ? db.users.filter((u) => u.role !== 'master_admin') : [user];
  const months = [1, 2, 3].map((i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return { label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, seed: d.getMonth() + 1 }; });
  const slip = (u, m) => {
    const basic = { sales: 1800, accounting: 2600, logistik: 2200, hr: 2600, admin: 3200 }[u.role] || 2000;
    const comm = u.role === 'sales' ? 400 + ((u.id * 137 + m.seed * 53) % 1600) : 0;
    const over = u.role === 'sales' && u.team !== 'AGENT' ? (u.id * 41 + m.seed * 17) % 300 : 0;
    const allow = 150;
    const kwsp = Math.round(basic * 0.11);
    return { basic, comm, over, allow, kwsp, total: basic + comm + over + allow - kwsp };
  };
  return (
    <>
      <PageHeader title="Slip Gaji" sub={<>Angka gaji adalah contoh sahaja <Sim>DATA SIMULASI</Sim></>} />
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Bulan Gaji</th><th>Pekerja</th><th className="text-end">Komisen</th><th className="text-end">Overriding</th><th className="text-end">Elaun</th><th className="text-end">Jumlah Bayar</th><th>Slip</th></tr></thead>
        <tbody>{months.flatMap((m) => staff.map((u) => { const s = slip(u, m); return (
          <tr key={`${m.label}${u.id}`}><td>{m.label}</td><td>{u.name}</td><td className="text-end">{rm(s.comm)}</td><td className="text-end">{rm(s.over)}</td><td className="text-end">{rm(s.allow)}</td><td className="text-end fw-semibold">{rm(s.total)}</td>
            <td><button className="btn btn-sm btn-outline-secondary" onClick={() => setView({ u, m, s })}><i className="bi bi-file-earmark-text" /></button></td></tr>); }))}</tbody>
      </table></div></div>
      {view && (
        <Modal title={`Slip Gaji — ${view.m.label}`} onClose={() => setView(null)} footer={<button className="btn btn-outline-secondary" onClick={() => window.print()}><i className="bi bi-printer me-1" />Cetak</button>}>
          <div className="text-center mb-3"><div className="fw-bold">ODAJAH (DEMO)</div><div className="small text-muted">Slip contoh — bukan dokumen sebenar</div></div>
          <div className="d-flex justify-content-between small mb-2"><span>{view.u.name}</span><span>{ROLES[view.u.role].label}</span></div>
          <table className="table table-sm"><tbody>
            <tr><td>Gaji Asas</td><td className="text-end">{rm(view.s.basic)}</td></tr>
            <tr><td>Komisen</td><td className="text-end">{rm(view.s.comm)}</td></tr>
            <tr><td>Overriding</td><td className="text-end">{rm(view.s.over)}</td></tr>
            <tr><td>Elaun</td><td className="text-end">{rm(view.s.allow)}</td></tr>
            <tr className="text-danger"><td>Potongan KWSP (11%)</td><td className="text-end">- {rm(view.s.kwsp)}</td></tr>
            <tr className="fw-bold"><td>Jumlah Bayar</td><td className="text-end">{rm(view.s.total)}</td></tr>
          </tbody></table>
        </Modal>
      )}
    </>
  );
}

export function Users() {
  const { db, role, patch } = useStore();
  const [q, setQ] = useState('');
  const list = db.users.filter((u) => !q || (u.name + u.username).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Pengguna" sub="Akaun staf, role & team (semua akaun demo).">
        <input className="form-control form-control-sm" style={{ maxWidth: 220 }} placeholder="Cari nama / username" value={q} onChange={(e) => setQ(e.target.value)} />
      </PageHeader>
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Team</th><th>Status</th><th>Tindakan</th></tr></thead>
        <tbody>{list.map((u) => (
          <tr key={u.id}><td>{u.name}</td><td className="font-monospace small">{u.username}</td><td><span className={`badge ${ROLES[u.role].badge}`}>{u.team === 'AGENT' ? 'Agent' : ROLES[u.role].label}</span></td><td className="small">{u.team}</td>
            <td>{u.active ? <span className="badge bg-success">Aktif</span> : <span className="badge bg-warning text-dark">Menunggu Kelulusan</span>}</td>
            <td>{['admin', 'hr'].includes(role) && u.id > 8 && <button className={`btn btn-sm ${u.active ? 'btn-outline-secondary' : 'btn-success'}`} onClick={() => patch('users', u.id, { active: !u.active }, u.active ? 'Akaun dinyahaktifkan.' : 'Agent diluluskan.')}>{u.active ? 'Nyahaktif' : 'Luluskan'}</button>}</td></tr>
        ))}</tbody>
      </table></div></div>
      <div className="small text-muted mt-2"><i className="bi bi-shield-lock me-1" />Demo tidak menyimpan kata laluan. Log masuk dibuat melalui butang Demo Login sahaja.</div>
    </>
  );
}

export function MyLeaves({ shiftOnly }) {
  const { db, user, applyLeave } = useStore();
  const [f, setF] = useState({ type: shiftOnly ? 'shift' : 'single', start: today(), end: today(), shiftDate: today(), reason: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const mine = db.leaves.filter((l) => l.userId === user.id && (shiftOnly ? l.type === 'shift' : l.type !== 'shift'));
  const bal = db.leaveBalances.find((b) => b.userId === user.id);
  const submit = (e) => {
    e.preventDefault();
    if (!f.reason.trim()) return;
    const end = f.type === 'multiple' ? f.end : f.start;
    applyLeave({ type: f.type, start: f.start, end: end < f.start ? f.start : end, shiftDate: f.type === 'shift' ? f.shiftDate : '', reason: f.reason.trim() }, user.id);
    setF((x) => ({ ...x, reason: '' }));
  };
  return (
    <>
      <PageHeader title={shiftOnly ? 'Apply Shift' : 'Cuti Saya'} sub={shiftOnly ? 'Mohon masuk kerja pada hari cuti & pilih tarikh cuti ganti. HR akan dimaklumkan.' : bal ? `Baki cuti tahunan: ${bal.allocated - bal.used} / ${bal.allocated} hari` : ''} />
      <div className="row g-3">
        <div className="col-lg-5"><div className="card"><div className="card-header">Permohonan Baharu</div><form className="card-body" onSubmit={submit}>
          {!shiftOnly && <><label className="form-label small">Jenis Cuti</label><select className="form-select mb-2" value={f.type} onChange={set('type')}>{Object.entries(LEAVE_TYPES).filter(([k]) => k !== 'shift').map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></>}
          {shiftOnly && <><label className="form-label small">Tarikh Masuk Kerja</label><input type="date" className="form-control mb-2" value={f.shiftDate} onChange={set('shiftDate')} /></>}
          <label className="form-label small">{shiftOnly ? 'Tarikh Cuti Ganti' : 'Tarikh Cuti'}</label><input type="date" className="form-control mb-2" value={f.start} onChange={set('start')} />
          {f.type === 'multiple' && <><label className="form-label small">Tarikh Tamat</label><input type="date" className="form-control mb-2" min={f.start} value={f.end} onChange={set('end')} /></>}
          <label className="form-label small">Tujuan / Sebab *</label><textarea className="form-control mb-2" rows={2} value={f.reason} onChange={set('reason')} required />
          <label className="form-label small">Bukti (optional) <Sim /></label><input type="file" className="form-control mb-3" disabled />
          <button className="btn btn-danger w-100" disabled={!f.reason.trim()}>Hantar Permohonan</button>
        </form></div></div>
        <div className="col-lg-7"><div className="card"><div className="card-header">Sejarah Permohonan</div><div className="table-responsive"><table className="table mb-0">
          <thead><tr><th>Jenis</th><th>Tarikh</th><th>Tujuan</th><th>Status</th></tr></thead>
          <tbody>{mine.map((l) => <tr key={l.id}><td className="small">{LEAVE_TYPES[l.type]}</td><td className="small text-nowrap">{l.type === 'shift' && <>Masuk {l.shiftDate}<br /></>}{l.start}{l.end !== l.start ? ` → ${l.end}` : ''}</td><td className="small">{l.reason}{l.hrRemark && <div className="text-muted">HR: {l.hrRemark}</div>}</td><td><LBadge s={l.status} /></td></tr>)}</tbody>
        </table>{!mine.length && <Empty text="Belum ada permohonan." />}</div></div></div>
      </div>
    </>
  );
}

