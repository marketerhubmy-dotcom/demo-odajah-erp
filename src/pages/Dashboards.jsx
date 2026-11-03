import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { STATUS } from '../data/constants.js';
import { ChartBox, PageHeader, StatCard, StatusBadge } from '../components/ui.jsx';
import { rm, rm0, inRange, MONTHS, collectionDate, fmtDate, today } from '../utils.js';
import { attendanceFor } from './HR.jsx';

function DateFilter({ from, to, setFrom, setTo, label = 'Filter Sales' }) {
  return (
    <div className="card mb-3"><div className="card-body py-2">
      <div className="row g-2 align-items-end">
        <div className="col-12 col-md-auto small fw-semibold text-muted">{label}</div>
        <div className="col-6 col-md-3"><label className="form-label small mb-0">Dari</label><input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="col-6 col-md-3"><label className="form-label small mb-0">Hingga</label><input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="col-12 col-md-auto"><button className="btn btn-sm btn-light w-100" onClick={() => { setFrom(''); setTo(''); }}>Reset</button></div>
      </div>
    </div></div>
  );
}

function monthly(orders) {
  const now = new Date();
  const labels = []; const rev = []; const qty = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    labels.push(`${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`);
    const m = orders.filter((o) => o.createdAt.startsWith(key) && o.status !== 'returned');
    rev.push(m.reduce((s, o) => s + o.price, 0));
    qty.push(m.reduce((s, o) => s + o.quantity + (o.quantity2 || 0), 0));
  }
  return { labels, rev, qty };
}

function SalesStats({ orders, remittances }) {
  const valid = orders.filter((o) => o.status !== 'returned');
  const total = valid.reduce((s, o) => s + o.price, 0);
  const kutipan = orders.reduce((s, o) => s + (collectionDate(o, remittances) ? o.price : 0), 0);
  const ret = orders.filter((o) => o.status === 'returned');
  const unique = new Set(orders.map((o) => o.phone)).size;
  const posPada = orders.filter((o) => o.status === 'pos_pada').length;
  return (
    <div className="row g-3 mb-3">
      <div className="col-6 col-lg-3"><StatCard label="Jumlah Order" value={orders.length} color="#4361ee" icon="bi-receipt" /></div>
      <div className="col-6 col-lg-3"><StatCard label="Jumlah Sales" value={rm0(total)} color="#198754" icon="bi-currency-dollar" /></div>
      <div className="col-6 col-lg-3"><StatCard label="Kutipan" value={rm0(kutipan)} color="#0dcaf0" icon="bi-wallet2" sub={`${total ? Math.round((kutipan / total) * 100) : 0}% daripada sales`} /></div>
      <div className="col-6 col-lg-3"><StatCard label="Purata Nilai Order" value={rm(valid.length ? total / valid.length : 0)} color="#6f42c1" icon="bi-calculator" /></div>
      <div className="col-6 col-lg-4"><StatCard label="Pelanggan Unik" value={unique} color="#fd7e14" icon="bi-people" /></div>
      <div className="col-6 col-lg-4"><StatCard label="Order Return" value={`${ret.length}`} sub={rm(ret.reduce((s, o) => s + o.price, 0))} color="#dc3545" icon="bi-arrow-return-left" /></div>
      <div className="col-12 col-lg-4"><StatCard label="Pos Pada" value={posPada} color="#6f42c1" icon="bi-calendar-event" sub="Order dijadual hantar kemudian" /></div>
    </div>
  );
}

function StatusChart({ orders }) {
  const data = useMemo(() => {
    const keys = Object.keys(STATUS);
    return {
      labels: keys.map((k) => STATUS[k].label),
      datasets: [{ data: keys.map((k) => orders.filter((o) => o.status === k).length), backgroundColor: keys.map((k) => STATUS[k].color), borderWidth: 2 }],
    };
  }, [orders]);
  return <ChartBox type="doughnut" data={data} options={{ cutout: '62%' }} />;
}

function RevenueChart({ orders }) {
  const data = useMemo(() => {
    const m = monthly(orders);
    return { labels: m.labels, datasets: [{ label: 'Revenue (RM)', data: m.rev, backgroundColor: '#e94560', borderRadius: 6 }] };
  }, [orders]);
  return <ChartBox type="bar" data={data} options={{ plugins: { legend: { display: false } } }} />;
}

export function SalesDashboard() {
  const { db, user, role } = useStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const isAdmin = role === 'admin';
  const scoped = isAdmin ? db.orders : db.orders.filter((o) => o.createdBy === user.id);
  const filtered = scoped.filter((o) => (!from && !to) || inRange(o.createdAt, from, to));
  const todayCount = scoped.filter((o) => o.createdAt.startsWith(today())).length;

  return (
    <>
      <PageHeader title={isAdmin ? 'Dashboard Syarikat' : `Dashboard — ${user.name}`} sub={isAdmin ? 'Ringkasan semua order, semua seller.' : 'Prestasi order anda sendiri.'}>
        <Link to="/orders/new" className="btn btn-danger btn-sm"><i className="bi bi-plus-circle me-1" />Buat Order</Link>
      </PageHeader>
      <DateFilter from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="row g-3 mb-3">
        <div className="col-4"><StatCard top label="Order Hari Ini" value={todayCount} color="#e94560" /></div>
        <div className="col-4"><StatCard top label="Order Aktif" value={scoped.filter((o) => ['pending', 'approved', 'processing', 'shipped', 'pos_pada', 'on_hold'].includes(o.status)).length} color="#4361ee" /></div>
        <div className="col-4"><StatCard top label="Menunggu Bayaran" value={scoped.filter((o) => o.status === 'pending').length} color="#ffc107" /></div>
      </div>
      <SalesStats orders={filtered} remittances={db.remittances} />
      <div className="row g-3 mb-3">
        <div className="col-lg-8"><div className="card h-100"><div className="card-header">Revenue per Month (12 bulan)</div><div className="card-body"><RevenueChart orders={scoped} /></div></div></div>
        <div className="col-lg-4"><div className="card h-100"><div className="card-header">Status Breakdown</div><div className="card-body"><StatusChart orders={filtered} /></div></div></div>
      </div>
      {isAdmin && <AdminExtras orders={filtered} />}
      <RecentOrders orders={filtered.slice(0, 8)} />
    </>
  );
}

function AdminExtras({ orders }) {
  const { db } = useStore();
  const byProduct = db.products.map((p) => {
    const os = orders.filter((o) => o.productId === p.id && o.status !== 'returned');
    return { p, n: os.length, rev: os.reduce((s, o) => s + o.price, 0) };
  }).filter((x) => x.n);
  const sellers = db.users.filter((u) => u.role === 'sales').map((u) => {
    const os = orders.filter((o) => o.createdBy === u.id && o.status !== 'returned');
    return { u, n: os.length, rev: os.reduce((s, o) => s + o.price, 0) };
  }).filter((x) => x.n).sort((a, b) => b.rev - a.rev);
  const low = db.products.filter((p) => p.active && p.stock < 50);
  const pdata = useMemo(() => ({
    labels: byProduct.map((x) => x.p.name.split(' (')[0]),
    datasets: [{ label: 'Sales (RM)', data: byProduct.map((x) => x.rev), backgroundColor: '#4361ee', borderRadius: 6 }],
  }), [orders]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="row g-3 mb-3">
      {low.length > 0 && (
        <div className="col-12"><div className="alert alert-danger mb-0 small"><i className="bi bi-exclamation-octagon me-1" /><strong>Stok Rendah!</strong> {low.map((p) => `${p.name} (${p.stock})`).join(', ')}</div></div>
      )}
      <div className="col-lg-7"><div className="card h-100"><div className="card-header">Sales Mengikut Produk</div><div className="card-body"><ChartBox type="bar" data={pdata} options={{ indexAxis: 'y', plugins: { legend: { display: false } } }} /></div></div></div>
      <div className="col-lg-5"><div className="card h-100"><div className="card-header">Seller Aktif</div>
        <div className="table-responsive"><table className="table mb-0"><thead><tr><th>Seller</th><th className="text-end">Order</th><th className="text-end">Sales</th></tr></thead>
          <tbody>{sellers.map((x) => <tr key={x.u.id}><td>{x.u.name}{x.u.team === 'AGENT' && <span className="badge bg-success ms-1">Agent</span>}</td><td className="text-end">{x.n}</td><td className="text-end">{rm0(x.rev)}</td></tr>)}</tbody>
        </table></div>
      </div></div>
    </div>
  );
}

function RecentOrders({ orders }) {
  return (
    <div className="card"><div className="card-header d-flex justify-content-between"><span>Order Terkini</span><Link to="/orders" className="small">Lihat semua →</Link></div>
      <div className="table-responsive"><table className="table table-hover mb-0">
        <thead><tr><th>#ID</th><th>Tarikh</th><th>Pelanggan</th><th>Produk</th><th className="text-end">Jumlah</th><th>Status</th></tr></thead>
        <tbody>{orders.map((o) => (
          <tr key={o.id}><td className="fw-semibold">#{o.id}</td><td className="small">{fmtDate(o.createdAt)}</td><td>{o.customerName}</td><td className="small">{o.productName} × {o.quantity}</td><td className="text-end">{rm(o.price)}</td><td><StatusBadge status={o.status} /></td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

export function AccountingDashboard() {
  const { db } = useStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const tr = db.orders.filter((o) => o.payment.method === 'transfer' && ((!from && !to) || inRange(o.createdAt, from, to)));
  const ok = tr.filter((o) => o.payment.status === 'approved');
  const pend = tr.filter((o) => o.payment.status === 'pending');
  const rem = db.remittances;
  return (
    <>
      <PageHeader title="Dashboard Accounting" sub="Pengesahan bayaran transfer & remittance marketplace." />
      <DateFilter from={from} to={to} setFrom={setFrom} setTo={setTo} label="Tarikh Order" />
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><StatCard label="Dah Disahkan" value={ok.length} color="#198754" icon="bi-check-circle" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Belum Disahkan" value={pend.length} color="#ffc107" icon="bi-hourglass-split" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Duit Disahkan" value={rm0(ok.reduce((s, o) => s + o.price, 0))} color="#198754" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Duit Belum Disahkan" value={rm0(pend.reduce((s, o) => s + o.price, 0))} color="#dc3545" /></div>
        <div className="col-6 col-lg-4"><StatCard label="% Disahkan" value={`${tr.length ? Math.round((ok.length / tr.length) * 100) : 0}%`} color="#4361ee" /></div>
        <div className="col-6 col-lg-4"><StatCard label="Duit Masuk (Transfer)" value={rm0(tr.filter((o) => o.payment.status !== 'rejected').reduce((s, o) => s + o.price, 0))} color="#0dcaf0" /></div>
        <div className="col-12 col-lg-4"><StatCard label="Jumlah Remittance" value={rm0(rem.reduce((s, r) => s + r.total, 0))} sub={`${rem.length} batch TikTok/Shopee`} color="#6f42c1" /></div>
      </div>
      <div className="card"><div className="card-header d-flex justify-content-between"><span>Menunggu Pengesahan</span><Link to="/accounting/verify" className="small">Pergi ke Verify Payment →</Link></div>
        <div className="table-responsive"><table className="table mb-0"><thead><tr><th>#ID</th><th>Tarikh</th><th>Nama Sales</th><th>Bank</th><th className="text-end">Jumlah (RM)</th></tr></thead>
          <tbody>{pend.slice(0, 8).map((o) => <tr key={o.id}><td>#{o.id}</td><td className="small">{fmtDate(o.createdAt)}</td><td>{db.users.find((u) => u.id === o.createdBy)?.name}</td><td>{o.payment.bank}</td><td className="text-end">{rm(o.price)}</td></tr>)}
            {!pend.length && <tr><td colSpan={5} className="text-center text-muted py-4">Semua bayaran sudah disahkan 🎉</td></tr>}</tbody>
        </table></div>
      </div>
    </>
  );
}

const LINE_OPTS = { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } };

export function LogistikDashboard() {
  const { db } = useStore();
  const nav = useNavigate();
  const cnt = (s) => db.orders.filter((o) => o.status === s).length;
  const cards = [
    ['pos_pada', 'Pos Pada', '#9d4edd'], ['approved', 'Awaiting', '#4361ee', 'awaiting'], ['processing', 'Processing', '#0dcaf0'],
    ['on_hold', 'On Hold', '#fd7e14'], ['shipped', 'Delivering', '#6c757d', 'delivering'], ['completed', 'Delivered', '#198754', 'delivered'], ['returned', 'Returned', '#dc3545'],
  ];
  const active = db.orders.filter((o) => ['approved', 'processing'].includes(o.status));
  const couriers = ['Ninjavan', 'J&T', 'Pos Laju', 'Shopee'];
  const cdata = useMemo(() => ({
    labels: couriers,
    datasets: [{ data: couriers.map((c) => active.filter((o) => o.courier === c).length), backgroundColor: ['#e94560', '#4361ee', '#fd7e14', '#198754'], borderWidth: 2 }],
  }), [db.orders]); // eslint-disable-line react-hooks/exhaustive-deps
  const weekly = useMemo(() => {
    const labels = []; const vals = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000); const k = d.toISOString().slice(0, 10);
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      vals.push(db.orders.filter((o) => o.shippedAt && o.shippedAt.startsWith(k)).length);
    }
    return { labels, datasets: [{ label: 'Order dihantar', data: vals, borderColor: '#e94560', backgroundColor: 'rgba(233,69,96,.15)', fill: true, tension: 0.25 }] };
  }, [db.orders]);
  return (
    <>
      <PageHeader title="Dashboard Logistik" sub="Klik kad untuk terus ke tab berkaitan." />
      <div className="row g-3 mb-3">
        {cards.map(([s, l, c, tab]) => (
          <div className="col-6 col-md-4 col-xl" key={s}><StatCard top label={l} value={cnt(s)} color={c} onClick={() => nav(`/logistik/${tab || s}`)} /></div>
        ))}
      </div>
      <div className="row g-3">
        <div className="col-lg-8"><div className="card h-100"><div className="card-header">Order Dihantar per Hari (14 hari)</div><div className="card-body"><ChartBox type="line" data={weekly} options={LINE_OPTS} /></div></div></div>
        <div className="col-lg-4"><div className="card h-100"><div className="card-header">Courier (Awaiting + Processing)</div><div className="card-body"><ChartBox type="doughnut" data={cdata} options={{ cutout: '60%' }} /></div></div></div>
      </div>
    </>
  );
}

export function HRDashboard() {
  const { db } = useStore();
  const staff = db.users.filter((u) => u.active && u.role !== 'master_admin');
  const att = staff.map((u) => attendanceFor(u.id, today()));
  const hadir = att.filter((a) => a.status === 'Hadir').length;
  const lewat = att.filter((a) => a.status === 'Lewat').length;
  const tidak = att.filter((a) => a.status === 'Tidak Hadir').length;
  const pending = db.leaves.filter((l) => l.status === 'pending');
  const adata = useMemo(() => ({ labels: ['Hadir', 'Lewat', 'Tidak Hadir'], datasets: [{ data: [hadir, lewat, tidak], backgroundColor: ['#198754', '#ffc107', '#dc3545'], borderWidth: 2 }] }), [hadir, lewat, tidak]);
  const ldata = useMemo(() => {
    const st = ['pending', 'approved', 'rejected'];
    return { labels: ['Pending', 'Lulus', 'Ditolak'], datasets: [{ data: st.map((s) => db.leaves.filter((l) => l.status === s).length), backgroundColor: ['#ffc107', '#198754', '#dc3545'], borderRadius: 4 }] };
  }, [db.leaves]);
  return (
    <>
      <PageHeader title="Dashboard HR" sub="Kehadiran hari ini & permohonan cuti/shift." />
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><StatCard label="Jumlah Staf Aktif" value={staff.length} color="#4361ee" icon="bi-people" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Hadir Hari Ini" value={hadir} color="#198754" icon="bi-person-check" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Lewat Hari Ini" value={lewat} color="#ffc107" icon="bi-alarm" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Cuti Perlu Tindakan" value={pending.length} color="#dc3545" icon="bi-clipboard-check" /></div>
      </div>
      <div className="row g-3 mb-3">
        <div className="col-md-6"><div className="card h-100"><div className="card-header">Kehadiran Hari Ini <span className="sim-tag">DATA SIMULASI</span></div><div className="card-body"><ChartBox type="doughnut" data={adata} options={{ cutout: '65%' }} /></div></div></div>
        <div className="col-md-6"><div className="card h-100"><div className="card-header">Status Cuti — Breakdown</div><div className="card-body"><ChartBox type="bar" data={ldata} options={{ indexAxis: 'y', plugins: { legend: { display: false } } }} /></div></div></div>
      </div>
      <div className="card"><div className="card-header d-flex justify-content-between"><span>Permohonan Cuti / Shift — Perlu Tindakan</span><Link to="/hr/leaves" className="small">Proses →</Link></div>
        <div className="table-responsive"><table className="table mb-0"><thead><tr><th>Pemohon</th><th>Jenis</th><th>Tarikh</th><th>Tujuan</th></tr></thead>
          <tbody>{pending.map((l) => <tr key={l.id}><td>{db.users.find((u) => u.id === l.userId)?.name}</td><td className="small">{l.type === 'shift' ? 'Ganti Shift' : l.type}</td><td className="small">{l.start}{l.end !== l.start ? ` → ${l.end}` : ''}</td><td className="small">{l.reason}</td></tr>)}
            {!pending.length && <tr><td colSpan={4} className="text-center text-muted py-4">Tiada permohonan menunggu kelulusan.</td></tr>}</tbody>
        </table></div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { role } = useStore();
  if (role === 'accounting') return <AccountingDashboard />;
  if (role === 'logistik') return <LogistikDashboard />;
  if (role === 'hr') return <HRDashboard />;
  return <SalesDashboard />;
}

