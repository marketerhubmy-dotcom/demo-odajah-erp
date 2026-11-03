import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { STATUS, PLATFORMS, BANKS } from '../data/constants.js';
import { PageHeader, StatusBadge, PayBadge, OrderDetail, Modal, Empty } from '../components/ui.jsx';
import { rm, fmtDate, inRange, today } from '../utils.js';

const DELETABLE = ['pending', 'approved', 'on_hold', 'pos_pada'];

export function OrderFilters({ q, setQ, status, setStatus, platform, setPlatform, from, setFrom, to, setTo, hideStatus }) {
  return (
    <div className="card mb-3"><div className="card-body py-2">
      <div className="row g-2 align-items-end">
        <div className="col-12 col-md-3"><label className="form-label small mb-0">Cari</label>
          <div className="input-group input-group-sm"><span className="input-group-text"><i className="bi bi-search" /></span>
            <input className="form-control" placeholder="Nama / telefon / #ID / tracking" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
        {!hideStatus && <div className="col-6 col-md-2"><label className="form-label small mb-0">Status</label>
          <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>}
        {setPlatform && <div className="col-6 col-md-2"><label className="form-label small mb-0">Platform</label>
          <select className="form-select form-select-sm" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">Semua</option>{Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>}
        <div className="col-6 col-md-2"><label className="form-label small mb-0">Dari</label><input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="col-6 col-md-2"><label className="form-label small mb-0">Hingga</label><input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
    </div></div>
  );
}

export function matchQ(o, q) {
  if (!q) return true;
  const s = q.toLowerCase().replace('#', '');
  return [o.id, o.customerName, o.phone, o.tracking, o.productName].some((v) => String(v).toLowerCase().includes(s));
}

export function useOrderFilter(initialStatus = '') {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [platform, setPlatform] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const apply = (list) => list.filter((o) => matchQ(o, q) && (!status || o.status === status) && (!platform || o.platform === platform) && ((!from && !to) || inRange(o.createdAt, from, to)));
  return { props: { q, setQ, status, setStatus, platform, setPlatform, from, setFrom, to, setTo }, apply };
}

function AmendModal({ order, onClose }) {
  const { user, updateOrder } = useStore();
  const [bank, setBank] = useState(BANKS[0]);
  const [ref, setRef] = useState('');
  const [date, setDate] = useState(today());
  return (
    <Modal title={`Tukar COD → Transfer (#${order.id})`} onClose={onClose} footer={<>
      <button className="btn btn-light" onClick={onClose}>Batal</button>
      <button className="btn btn-primary" disabled={!ref} onClick={() => {
        updateOrder(order.id, user.id, (o) => { o.payment = { ...o.payment, method: 'transfer', status: 'pending', bank, reference: ref, paymentDate: date }; o.status = 'pending'; }, `Order #${order.id} ditukar ke Transfer — menunggu pengesahan Accounting.`);
        onClose();
      }}>Simpan</button></>}>
      <p className="small text-muted">Order akan kembali ke status <strong>Pending</strong> sehingga Accounting mengesahkan bayaran.</p>
      <div className="row g-2">
        <div className="col-md-4"><label className="form-label small">Bank</label><select className="form-select" value={bank} onChange={(e) => setBank(e.target.value)}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></div>
        <div className="col-md-4"><label className="form-label small">Tarikh Bayaran</label><input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="col-md-4"><label className="form-label small">No. Rujukan</label><input className="form-control" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="cth: DEMO123456" /></div>
        <div className="col-12"><label className="form-label small">Upload Resit <span className="sim-tag">SIMULASI</span></label><input type="file" className="form-control" disabled /><div className="form-text">Dalam demo, fail tidak dimuat naik ke mana-mana.</div></div>
      </div>
    </Modal>
  );
}

export default function Orders() {
  const { db, user, role, deleteOrder } = useStore();
  const [sp] = useSearchParams();
  const f = useOrderFilter(sp.get('status') || '');
  const [view, setView] = useState(null);
  const [amend, setAmend] = useState(null);
  const [del, setDel] = useState(null);
  const isAdmin = role === 'admin';
  const scoped = isAdmin ? db.orders : db.orders.filter((o) => o.createdBy === user.id);
  const list = f.apply(scoped);
  const [limit, setLimit] = useState(30);
  const seller = (id) => db.users.find((u) => u.id === id)?.name || '-';

  const viewOrder = view && db.orders.find((o) => o.id === view);

  return (
    <>
      <PageHeader title={isAdmin ? 'Semua Order' : 'Order Saya'} sub={`${list.length} order dijumpai`}>
        <Link to="/orders/new" className="btn btn-danger btn-sm"><i className="bi bi-plus-circle me-1" />Buat Order</Link>
      </PageHeader>
      <OrderFilters {...f.props} />
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead><tr><th>#ID</th><th>Tarikh</th><th>Pelanggan</th><th>Produk</th><th>Platform</th>{isAdmin && <th>Seller</th>}<th>Bayaran</th><th className="text-end">Jumlah</th><th>Courier</th><th>Tracking</th><th>Status</th><th>Tindakan</th></tr></thead>
            <tbody>
              {list.slice(0, limit).map((o) => (
                <tr key={o.id}>
                  <td className="fw-semibold">#{o.id}</td>
                  <td className="small text-nowrap">{fmtDate(o.createdAt)}</td>
                  <td><div className="fw-semibold">{o.customerName}</div><div className="small text-muted">{o.phone}</div></td>
                  <td className="small">{o.productName} × {o.quantity}{o.product2Id ? <><br />{o.product2Name} × {o.quantity2}</> : null}</td>
                  <td className="small">{PLATFORMS[o.platform]}</td>
                  {isAdmin && <td className="small">{seller(o.createdBy)}</td>}
                  <td><PayBadge payment={o.payment} /></td>
                  <td className="text-end text-nowrap">{rm(o.price)}</td>
                  <td className="small">{o.courier}</td>
                  <td className="small font-monospace">{o.tracking || '-'}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-nowrap">
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setView(o.id)} title="Lihat"><i className="bi bi-eye" /></button>
                    {o.payment.method === 'cod' && ['approved', 'pos_pada'].includes(o.status) && <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setAmend(o)} title="Amend: COD → Transfer"><i className="bi bi-pencil-square" /></button>}
                    {DELETABLE.includes(o.status) && <button className="btn btn-sm btn-outline-danger" onClick={() => setDel(o)} title="Padam"><i className="bi bi-trash" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <Empty text="Tiada order untuk tapisan ini." />}
        </div>
        {list.length > limit && <div className="card-footer text-center bg-transparent"><button className="btn btn-sm btn-light" onClick={() => setLimit(limit + 30)}>Papar lagi ({list.length - limit})</button></div>}
      </div>
      {viewOrder && <OrderDetail order={viewOrder} onClose={() => setView(null)} />}
      {amend && <AmendModal order={amend} onClose={() => setAmend(null)} />}
      {del && (
        <Modal title={`Padam Order #${del.id}?`} onClose={() => setDel(null)} footer={<>
          <button className="btn btn-light" onClick={() => setDel(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => { deleteOrder(del.id); setDel(null); }}>Padam</button></>}>
          Order <strong>{del.customerName}</strong> ({rm(del.price)}) akan dipadam daripada data demo.
        </Modal>
      )}
    </>
  );
}
