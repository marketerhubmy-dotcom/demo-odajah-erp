import { useState } from 'react';
import { useStore } from '../store.jsx';
import { PageHeader, OrderDetail, Modal, Empty, StatusBadge } from '../components/ui.jsx';
import { OrderFilters, useOrderFilter } from './Orders.jsx';
import { rm, fmtDate, fmtDateTime } from '../utils.js';

function PaymentTable({ list, actions }) {
  const { db } = useStore();
  const [view, setView] = useState(null);
  const v = view && db.orders.find((o) => o.id === view);
  return (
    <div className="card">
      <div className="table-responsive"><table className="table table-hover mb-0">
        <thead><tr><th>#ID</th><th>Tarikh</th><th>Pelanggan</th><th>Produk</th><th>Dibuat Oleh</th><th>Bayaran</th><th className="text-end">Total</th><th>Status</th><th>Tindakan</th></tr></thead>
        <tbody>{list.map((o) => (
          <tr key={o.id}>
            <td className="fw-semibold">#{o.id}</td>
            <td className="small text-nowrap">{fmtDate(o.createdAt)}</td>
            <td>{o.customerName}</td>
            <td className="small">{o.productName} × {o.quantity}</td>
            <td className="small">{db.users.find((u) => u.id === o.createdBy)?.name}</td>
            <td className="small">{o.payment.bank}<br /><span className="font-monospace">{o.payment.reference}</span><br /><span className="text-muted">{o.payment.paymentDate}</span></td>
            <td className="text-end text-nowrap fw-semibold">{rm(o.price)}</td>
            <td><StatusBadge status={o.status} /></td>
            <td className="text-nowrap">
              <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setView(o.id)}><i className="bi bi-eye" /></button>
              {actions && actions(o)}
            </td>
          </tr>
        ))}</tbody>
      </table>{!list.length && <Empty />}</div>
      {v && <OrderDetail order={v} onClose={() => setView(null)} />}
    </div>
  );
}

export function VerifyPayment() {
  const { db, user, verifyPayment, rejectPayment } = useStore();
  const f = useOrderFilter();
  const [rej, setRej] = useState(null);
  const [reason, setReason] = useState('');
  const pending = f.apply(db.orders.filter((o) => o.payment.method === 'transfer' && o.payment.status === 'pending'));
  const rejected = db.orders.filter((o) => o.payment.method === 'transfer' && o.payment.status === 'rejected');
  return (
    <>
      <PageHeader title="Verify Payment" sub="Semak resit transfer, kemudian Sahkan (order ke Logistik) atau Tolak dengan sebab." />
      <OrderFilters {...f.props} hideStatus />
      <PaymentTable list={pending} actions={(o) => user.role === 'master_admin' ? null : (<>
        <button className="btn btn-sm btn-success me-1" onClick={() => verifyPayment(o.id, user.id)}><i className="bi bi-check-lg me-1" />Sahkan</button>
        <button className="btn btn-sm btn-outline-danger" onClick={() => { setRej(o); setReason(''); }}><i className="bi bi-x-lg" /></button>
      </>)} />
      {rejected.length > 0 && (<><h6 className="fw-bold mt-4">Ditolak ({rejected.length})</h6><PaymentTable list={rejected} actions={(o) => <span className="small text-danger">{o.payment.rejectReason}</span>} /></>)}
      {rej && (
        <Modal title={`Tolak Order #${rej.id}`} onClose={() => setRej(null)} footer={<>
          <button className="btn btn-light" onClick={() => setRej(null)}>Batal</button>
          <button className="btn btn-danger" disabled={!reason.trim()} onClick={() => { rejectPayment(rej.id, user.id, reason.trim()); setRej(null); }}>Tolak</button></>}>
          <label className="form-label small">Sebab Penolakan *</label>
          <textarea className="form-control" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="cth: Resit tidak jelas / jumlah tidak sepadan" autoFocus />
        </Modal>
      )}
    </>
  );
}

export function VerifiedPayments() {
  const { db } = useStore();
  const f = useOrderFilter();
  const list = f.apply(db.orders.filter((o) => o.payment.method === 'transfer' && o.payment.status === 'approved'));
  return (
    <>
      <PageHeader title="Sudah Disahkan" sub={`${list.length} bayaran transfer · ${rm(list.reduce((s, o) => s + o.price, 0))}`} />
      <OrderFilters {...f.props} hideStatus />
      <PaymentTable list={list.slice(0, 60)} actions={(o) => <span className="small text-muted">{fmtDateTime(o.payment.verifiedAt)}</span>} />
    </>
  );
}

export function Remittances() {
  const { db, user, verifyRemittance } = useStore();
  const [view, setView] = useState(null);
  return (
    <>
      <PageHeader title="TikTok / Shopee — Remittance" sub="Platform marketplace membayar secara pukal; Accounting mengesahkan setiap batch remittance." />
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>#</th><th>Platform</th><th>Tarikh Transfer</th><th>Rujukan</th><th>Order</th><th className="text-end">Jumlah</th><th>Status</th><th>Tindakan</th></tr></thead>
        <tbody>{db.remittances.map((r) => (
          <tr key={r.id}>
            <td>#{r.id}</td><td><i className={`bi ${r.platform === 'TikTok' ? 'bi-tiktok' : 'bi-bag'} me-1`} />{r.platform}</td><td>{fmtDate(r.transferDate)}</td>
            <td className="font-monospace small">{r.reference}</td><td><button className="btn btn-link btn-sm p-0" onClick={() => setView(r)}>{r.orderIds.length} order</button></td>
            <td className="text-end fw-semibold">{rm(r.total)}</td>
            <td>{r.status === 'approved' ? <span className="badge bg-success">Disahkan</span> : <span className="badge bg-warning text-dark">Belum Disahkan</span>}</td>
            <td>{r.status === 'pending' && user.role !== 'master_admin' && <button className="btn btn-sm btn-success" onClick={() => verifyRemittance(r.id, user.id)}>Sahkan</button>}</td>
          </tr>
        ))}</tbody>
      </table>{!db.remittances.length && <Empty />}</div></div>
      {view && (
        <Modal title={`Remittance #${view.id}`} onClose={() => setView(null)}>
          <ul className="list-group">{view.orderIds.map((id) => { const o = db.orders.find((x) => x.id === id); return o && <li key={id} className="list-group-item d-flex justify-content-between"><span>#{o.id} · {o.customerName}</span><span>{rm(o.price)}</span></li>; })}</ul>
          <div className="small text-muted mt-2">Jumlah remittance selepas potongan fi platform (anggaran demo 8%).</div>
        </Modal>
      )}
    </>
  );
}

export function Cogs() {
  const { db } = useStore();
  return (
    <>
      <PageHeader title="Kos Produk (COGS)" sub="Kos seunit digunakan dalam pengiraan P&L." />
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Produk</th><th>SKU</th><th className="text-end">Harga Jual</th><th className="text-end">Kos (COGS)</th><th className="text-end">Margin</th></tr></thead>
        <tbody>
          {db.products.map((p) => <tr key={p.id}><td>{p.name}</td><td className="font-monospace small">{p.sku}</td><td className="text-end">{rm(p.price)}</td><td className="text-end">{rm(p.cost)}</td><td className="text-end">{Math.round(((p.price - p.cost) / p.price) * 100)}%</td></tr>)}
          {db.freeGifts.map((g) => <tr key={`g${g.id}`} className="text-muted"><td><i className="bi bi-gift me-1" />{g.name}</td><td>-</td><td className="text-end">-</td><td className="text-end">{rm(g.cost)}</td><td className="text-end">-</td></tr>)}
        </tbody>
      </table></div></div>
    </>
  );
}
