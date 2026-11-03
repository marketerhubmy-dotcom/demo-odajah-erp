import { useState } from 'react';
import { NavLink, useParams, Navigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { COURIERS } from '../data/constants.js';
import { PageHeader, OrderDetail, Modal, Empty, StatusBadge, PayBadge, Sim } from '../components/ui.jsx';
import { matchQ } from './Orders.jsx';
import { rm, fmtDate, fmtDateTime, today } from '../utils.js';

const TABS = {
  pos_pada:   { status: 'pos_pada',   label: 'Pos Pada',   hint: 'Order dijadual dihantar pada tarikh tertentu. Release untuk masuk Awaiting.' },
  awaiting:   { status: 'approved',   label: 'Awaiting',   hint: 'Order yang sudah lulus bayaran — sedia untuk diproses (cetak waybill).' },
  processing: { status: 'processing', label: 'Processing', hint: 'Waybill dicetak & sedang dibungkus. Tekan Ship untuk serah kepada courier.' },
  on_hold:    { status: 'on_hold',    label: 'On Hold',    hint: 'Order ditahan (alamat, stok, permintaan pelanggan). Release untuk sambung.' },
  delivering: { status: 'shipped',    label: 'Delivering', hint: 'Dalam perjalanan. Status tracking dikemas kini oleh courier (disimulasi).' },
  delivered:  { status: 'completed',  label: 'Delivered',  hint: 'Diterima pelanggan. COD dikira sebagai kutipan pada tarikh ini.' },
  returned:   { status: 'returned',   label: 'Returned',   hint: 'Parcel dipulangkan.' },
};

function genTracking(courier) {
  const p = { Ninjavan: 'NVDEMO', 'J&T': 'JTDEMO', 'Pos Laju': 'PLDEMO', Shopee: 'SPXDEMO' }[courier] || 'DEMO';
  return p + Math.floor(10000000 + Math.random() * 89999999);
}

export default function LogistikTab() {
  const { tab } = useParams();
  const { db, user, updateOrder, toast } = useStore();
  const [q, setQ] = useState('');
  const [courier, setCourier] = useState('');
  const [view, setView] = useState(null);
  const [hold, setHold] = useState(null);
  const [holdReason, setHoldReason] = useState('');
  const [ship, setShip] = useState(null);
  const [sel, setSel] = useState([]);
  const t = TABS[tab];
  if (!t) return <Navigate to="/logistik/awaiting" replace />;
  const ro = user.role === 'master_admin';

  const list = db.orders.filter((o) => o.status === t.status && matchQ(o, q) && (!courier || o.courier === courier));
  const v = view && db.orders.find((o) => o.id === view);
  const act = (o, fn, msg) => updateOrder(o.id, user.id, fn, msg);

  const bulkProcess = () => {
    sel.forEach((id) => updateOrder(id, user.id, (o) => { o.status = 'processing'; }, null));
    toast(`${sel.length} order dipindah ke Processing (waybill dicetak — simulasi).`);
    setSel([]);
  };

  const actions = (o) => {
    if (ro) return null;
    switch (tab) {
      case 'pos_pada': return <button className="btn btn-sm btn-primary" onClick={() => act(o, (x) => { x.status = 'approved'; x.posPadaDate = ''; }, `Order #${o.id} di-release ke Awaiting.`)}>Release</button>;
      case 'awaiting': return (<>
        <button className="btn btn-sm btn-info me-1" onClick={() => act(o, (x) => { x.status = 'processing'; }, `Waybill #${o.id} dicetak — order ke Processing.`)}><i className="bi bi-printer me-1" />Proses</button>
        <button className="btn btn-sm btn-outline-warning" onClick={() => { setHold(o); setHoldReason(''); }} title="Hold"><i className="bi bi-pause-circle" /></button>
      </>);
      case 'processing': return (<>
        <button className="btn btn-sm btn-success me-1" onClick={() => setShip(o)}><i className="bi bi-truck me-1" />Ship</button>
        <button className="btn btn-sm btn-outline-warning" onClick={() => { setHold(o); setHoldReason(''); }} title="Hold"><i className="bi bi-pause-circle" /></button>
      </>);
      case 'on_hold': return <button className="btn btn-sm btn-primary" onClick={() => act(o, (x) => { x.status = 'approved'; x.onHoldRemark = ''; }, `Order #${o.id} di-release ke Awaiting.`)}>Release</button>;
      case 'delivering': return (<>
        <button className="btn btn-sm btn-success me-1" onClick={() => act(o, (x) => { x.status = 'completed'; x.deliveredAt = new Date().toISOString(); }, `Order #${o.id} ditanda Delivered.`)}>Delivered</button>
        <button className="btn btn-sm btn-outline-danger" onClick={() => act(o, (x) => { x.status = 'returned'; }, `Order #${o.id} ditanda Returned.`)}>Return</button>
      </>);
      default: return null;
    }
  };

  return (
    <>
      <PageHeader title={`Logistik — ${t.label}`} sub={t.hint} />
      <div className="tabs-scroll mb-3">
        {Object.entries(TABS).map(([k, x]) => (
          <NavLink key={k} to={`/logistik/${k}`} className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-danger' : 'btn-light'}`}>
            {x.label} <span className="badge bg-dark bg-opacity-25 ms-1">{db.orders.filter((o) => o.status === x.status).length}</span>
          </NavLink>
        ))}
      </div>
      <div className="card mb-3"><div className="card-body py-2 row g-2 align-items-end">
        <div className="col-md-5"><input className="form-control form-control-sm" placeholder="Cari nama / telefon / #ID / tracking" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="col-md-3"><select className="form-select form-select-sm" value={courier} onChange={(e) => setCourier(e.target.value)}><option value="">Courier: Semua</option>{[...COURIERS, 'Shopee'].map((c) => <option key={c}>{c}</option>)}</select></div>
        {tab === 'awaiting' && !ro && <div className="col-md-4 text-md-end"><button className="btn btn-sm btn-info" disabled={!sel.length} onClick={bulkProcess}><i className="bi bi-printer me-1" />Cetak Waybill Pukal ({sel.length}) <Sim /></button></div>}
      </div></div>
      <div className="card"><div className="table-responsive"><table className="table table-hover mb-0">
        <thead><tr>
          {tab === 'awaiting' && !ro && <th><input type="checkbox" className="form-check-input" checked={sel.length > 0 && sel.length === list.length} onChange={(e) => setSel(e.target.checked ? list.map((o) => o.id) : [])} /></th>}
          <th>#ID</th><th>Tarikh</th><th>Pelanggan</th><th>Negeri</th><th>Produk</th><th>Bayaran</th><th className="text-end">Jumlah</th><th>Courier</th><th>{tab === 'pos_pada' ? 'Tarikh Pos' : tab === 'on_hold' ? 'Sebab Hold' : 'Tracking'}</th><th>Tindakan</th>
        </tr></thead>
        <tbody>{list.slice(0, 80).map((o) => (
          <tr key={o.id}>
            {tab === 'awaiting' && !ro && <td><input type="checkbox" className="form-check-input" checked={sel.includes(o.id)} onChange={(e) => setSel((s) => e.target.checked ? [...s, o.id] : s.filter((x) => x !== o.id))} /></td>}
            <td className="fw-semibold">#{o.id}</td>
            <td className="small text-nowrap">{fmtDate(o.createdAt)}</td>
            <td><div className="fw-semibold">{o.customerName}</div><div className="small text-muted">{o.phone}</div></td>
            <td className="small">{o.state}</td>
            <td className="small">{o.productName} × {o.quantity}{o.giftId ? <div className="text-muted"><i className="bi bi-gift" /> +gift</div> : null}</td>
            <td><PayBadge payment={o.payment} /></td>
            <td className="text-end text-nowrap">{rm(o.price)}</td>
            <td className="small">{o.courier}</td>
            <td className="small">{tab === 'pos_pada' ? o.posPadaDate : tab === 'on_hold' ? o.onHoldRemark : <span className="font-monospace">{o.tracking || '-'}</span>}{tab === 'delivered' && <div className="text-muted">{fmtDateTime(o.deliveredAt)}</div>}</td>
            <td className="text-nowrap"><button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setView(o.id)}><i className="bi bi-eye" /></button>{actions(o)}</td>
          </tr>
        ))}</tbody>
      </table>{!list.length && <Empty />}</div></div>

      {v && <OrderDetail order={v} onClose={() => setView(null)} />}
      {hold && (
        <Modal title={`Hold Order #${hold.id}`} onClose={() => setHold(null)} footer={<>
          <button className="btn btn-light" onClick={() => setHold(null)}>Batal</button>
          <button className="btn btn-warning" disabled={!holdReason.trim()} onClick={() => { act(hold, (x) => { x.status = 'on_hold'; x.onHoldRemark = holdReason.trim(); }, `Order #${hold.id} ditahan.`); setHold(null); }}>Hold</button></>}>
          <label className="form-label small">Sebab Hold *</label>
          <select className="form-select mb-2" value="" onChange={(e) => setHoldReason(e.target.value)}><option value="">-- Pilih cepat --</option><option>Alamat tidak lengkap</option><option>Pelanggan minta tangguh</option><option>Stok belum masuk</option></select>
          <textarea className="form-control" rows={2} value={holdReason} onChange={(e) => setHoldReason(e.target.value)} />
        </Modal>
      )}
      {ship && <ShipModal order={ship} onClose={() => setShip(null)} onShip={(c, trk) => { act(ship, (x) => { x.status = 'shipped'; x.courier = c; x.tracking = trk; x.shippedAt = new Date().toISOString(); }, `Order #${ship.id} dihantar via ${c} (${trk}).`); setShip(null); }} />}
    </>
  );
}

function ShipModal({ order, onClose, onShip }) {
  const [c, setC] = useState(order.courier === 'Shopee' ? 'Shopee' : order.courier || COURIERS[0]);
  const [trk, setTrk] = useState('');
  return (
    <Modal title={`Ship Order #${order.id}`} onClose={onClose} footer={<>
      <button className="btn btn-light" onClick={onClose}>Batal</button>
      <button className="btn btn-success" onClick={() => onShip(c, trk || genTracking(c))}><i className="bi bi-truck me-1" />Sahkan Ship</button></>}>
      <div className="mb-2 small">{order.customerName} · {order.address}, {order.postcode} {order.city}, {order.state}</div>
      <label className="form-label small">Courier</label>
      <select className="form-select mb-2" value={c} onChange={(e) => setC(e.target.value)}>{[...COURIERS, 'Shopee'].map((x) => <option key={x}>{x}</option>)}</select>
      <label className="form-label small">Nombor Tracking</label>
      <div className="input-group"><input className="form-control font-monospace" value={trk} onChange={(e) => setTrk(e.target.value)} placeholder="Kosongkan untuk jana automatik" />
        <button className="btn btn-outline-secondary" onClick={() => setTrk(genTracking(c))}>Jana <Sim /></button></div>
      <div className="form-text">Sistem sebenar memanggil API courier (Ninjavan / J&amp;T / Pos Laju) untuk tempah pickup &amp; dapatkan waybill. Dalam demo, nombor tracking adalah rekaan.</div>
    </Modal>
  );
}

export function SearchOrder() {
  const { db } = useStore();
  const [q, setQ] = useState('');
  const [view, setView] = useState(null);
  const list = q.length >= 2 ? db.orders.filter((o) => matchQ(o, q)).slice(0, 30) : [];
  const v = view && db.orders.find((o) => o.id === view);
  return (
    <>
      <PageHeader title="Search Order" sub="Cari merentasi semua status." />
      <div className="card mb-3"><div className="card-body"><div className="input-group"><span className="input-group-text"><i className="bi bi-search" /></span><input className="form-control form-control-lg" autoFocus placeholder="Nama / telefon / #ID / tracking (min 2 aksara)" value={q} onChange={(e) => setQ(e.target.value)} /></div></div></div>
      {q.length >= 2 && <div className="card"><div className="list-group list-group-flush">
        {list.map((o) => <button key={o.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center flex-wrap gap-2" onClick={() => setView(o.id)}>
          <span><strong>#{o.id}</strong> · {o.customerName} <span className="text-muted small">{o.phone}</span></span>
          <span className="d-flex gap-2 align-items-center"><span className="small font-monospace text-muted">{o.tracking}</span><StatusBadge status={o.status} /></span></button>)}
        {!list.length && <Empty text="Tiada padanan." />}
      </div></div>}
      {v && <OrderDetail order={v} onClose={() => setView(null)} />}
    </>
  );
}

export function StockTake() {
  const { db, user, patch } = useStore();
  const [counts, setCounts] = useState({});
  const ro = user.role === 'master_admin';
  return (
    <>
      <PageHeader title="Stock Take" sub={`Kiraan fizikal stok — ${today()}`} />
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Produk</th><th>SKU</th><th className="text-end">Stok Sistem</th><th style={{ width: 140 }}>Kiraan Fizikal</th><th className="text-end">Beza</th><th /></tr></thead>
        <tbody>{db.products.map((p) => {
          const c = counts[p.id]; const diff = c === undefined || c === '' ? null : Number(c) - p.stock;
          return (<tr key={p.id}>
            <td>{p.name}{!p.active && <span className="badge bg-secondary ms-1">Tidak aktif</span>}</td><td className="font-monospace small">{p.sku}</td>
            <td className={`text-end fw-semibold ${p.stock < 50 ? 'text-danger' : ''}`}>{p.stock}</td>
            <td><input type="number" className="form-control form-control-sm" value={c ?? ''} onChange={(e) => setCounts({ ...counts, [p.id]: e.target.value })} disabled={ro} /></td>
            <td className={`text-end ${diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : ''}`}>{diff === null ? '-' : diff > 0 ? `+${diff}` : diff}</td>
            <td>{diff !== null && diff !== 0 && <button className="btn btn-sm btn-primary" onClick={() => { patch('products', p.id, { stock: Number(c) }, `Stok ${p.sku} dikemas kini ke ${c}.`); setCounts({ ...counts, [p.id]: '' }); }}>Kemas kini</button>}</td>
          </tr>);
        })}</tbody>
      </table></div></div>
    </>
  );
}
