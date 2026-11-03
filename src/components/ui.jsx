import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { STATUS, FLOW, PAYMENT_METHODS, PLATFORMS } from '../data/constants.js';
import { useStore } from '../store.jsx';
import { rm, fmtDateTime } from '../utils.js';

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: 'bg-light text-dark' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function PayBadge({ payment }) {
  const map = { pending: 'bg-warning text-dark', approved: 'bg-success', rejected: 'bg-danger' };
  const lbl = { pending: 'Belum Disahkan', approved: 'Disahkan', rejected: 'Ditolak' };
  return (
    <span className="d-inline-flex flex-column gap-1">
      <span className="small fw-semibold">{PAYMENT_METHODS[payment.method]}</span>
      {payment.method === 'transfer' && <span className={`badge ${map[payment.status]}`}>{lbl[payment.status]}</span>}
    </span>
  );
}

export function PageHeader({ title, sub, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
      <div>
        <h4 className="page-title">{title}</h4>
        {sub && <div className="page-sub mb-0">{sub}</div>}
      </div>
      {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, color = '#4361ee', icon, top, onClick }) {
  return (
    <div className={`stat-card ${top ? 'stat-top' : ''} ${onClick ? 'stat-top clickable' : ''}`} style={top ? { borderTopColor: color } : { borderLeftColor: color }} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="d-flex justify-content-between align-items-start">
        <div className="label">{label}</div>
        {icon && <i className={`bi ${icon}`} style={{ color, fontSize: '1.2rem' }} />}
      </div>
      <div className="number" style={{ color }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function ChartBox({ type, data, options, height }) {
  const ref = useRef(null);
  useEffect(() => {
    const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    Chart.defaults.color = dark ? '#9ca3af' : '#6c757d';
    Chart.defaults.borderColor = dark ? '#2d3144' : '#e9ecef';
    const c = new Chart(ref.current, {
      type, data,
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }, ...options },
    });
    return () => c.destroy();
  }, [type, data, options]);
  return <div className="chart-box" style={height ? { height } : undefined}><canvas ref={ref} /></div>;
}

export function Modal({ title, onClose, children, footer, size }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-backdrop-demo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-demo ${size || ''}`} role="dialog" aria-modal="true">
        <div className="mh"><h6 className="mb-0 fw-bold">{title}</h6><button className="btn-close" onClick={onClose} aria-label="Tutup" /></div>
        <div className="mb">{children}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  );
}

export function Sim({ children = 'SIMULASI' }) {
  return <span className="sim-tag" title="Dalam sistem sebenar, langkah ini memanggil API luar. Dalam demo ia hanya disimulasikan.">{children}</span>;
}

export function Empty({ text = 'Tiada rekod.' }) {
  return <div className="text-center text-muted py-5"><i className="bi bi-inbox fs-2 d-block mb-2" />{text}</div>;
}

export function StatusFlow({ status }) {
  const idx = FLOW.indexOf(status);
  return (
    <div className="status-flow">
      {FLOW.map((s, i) => (
        <span key={s} className="d-inline-flex align-items-center gap-1">
          <span className={`flow-step ${STATUS[s].cls} ${i <= idx ? 'active' : ''}`}>{STATUS[s].label}</span>
          {i < FLOW.length - 1 && <i className="bi bi-chevron-right flow-arrow" />}
        </span>
      ))}
      {!FLOW.includes(status) && <span className="ms-2"><StatusBadge status={status} /></span>}
    </div>
  );
}

export function OrderDetail({ order, onClose, footer }) {
  const { db } = useStore();
  const uname = (id) => (id === 0 ? 'Sistem (seed)' : db.users.find((u) => u.id === id)?.name || '-');
  const gift = order.giftId ? db.freeGifts.find((g) => g.id === order.giftId) : null;
  const pkg = order.promoPackageId ? db.promoPackages.find((p) => p.id === order.promoPackageId) : null;
  return (
    <Modal title={`Order #${order.id}`} onClose={onClose} size="lg" footer={footer}>
      <div className="mb-3"><StatusFlow status={order.status} /></div>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="small text-muted fw-semibold text-uppercase mb-1">Pelanggan</div>
          <div className="fw-semibold">{order.customerName}</div>
          <div className="small">{order.phone}</div>
          <div className="small">{order.address}, {order.postcode} {order.city}, {order.state}</div>
          <div className="small text-muted mt-1">Prospek: {order.customerType === 'new' ? 'New Customer' : order.customerType === 'existing' ? 'Existing Customer' : 'Existing Prospect'}</div>
        </div>
        <div className="col-md-6">
          <div className="small text-muted fw-semibold text-uppercase mb-1">Produk</div>
          <div>{order.productName} × {order.quantity}</div>
          {order.product2Id && <div>{order.product2Name} × {order.quantity2}</div>}
          {pkg && <div className="small text-muted">Pakej: {pkg.name}</div>}
          {gift && <div className="small"><i className="bi bi-gift me-1" />{gift.name} × {order.giftQty}</div>}
          <div className="fw-bold mt-1">{rm(order.price)}</div>
        </div>
        <div className="col-md-6">
          <div className="small text-muted fw-semibold text-uppercase mb-1">Sumber</div>
          <div className="small">{PLATFORMS[order.platform]} · {order.objective}{order.channel ? ` · ${order.channel}` : ''}</div>
          <div className="small">Seller: {uname(order.createdBy)}</div>
        </div>
        <div className="col-md-6">
          <div className="small text-muted fw-semibold text-uppercase mb-1">Bayaran & Penghantaran</div>
          <PayBadge payment={order.payment} />
          {order.payment.method === 'transfer' && <div className="small mt-1">{order.payment.bank} · Ruj: {order.payment.reference} · {order.payment.paymentDate}</div>}
          {order.payment.rejectReason && <div className="small text-danger">Sebab tolak: {order.payment.rejectReason}</div>}
          <div className="small mt-1">Courier: {order.courier || '-'} · Tracking: <span className="font-monospace">{order.tracking || '-'}</span></div>
          {order.posPadaDate && <div className="small">Tarikh Pos Pada: {order.posPadaDate}</div>}
          {order.onHoldRemark && <div className="small text-warning-emphasis">Sebab Hold: {order.onHoldRemark}</div>}
        </div>
        {order.notes && <div className="col-12"><div className="small text-muted fw-semibold text-uppercase mb-1">Nota</div><div className="small">{order.notes}</div></div>}
        <div className="col-12">
          <div className="small text-muted fw-semibold text-uppercase mb-1">Audit Log</div>
          <ul className="list-unstyled small mb-0">
            {order.history.slice().reverse().map((h, i) => (
              <li key={i} className="border-start border-2 ps-2 mb-1"><span className="text-muted">{fmtDateTime(h.at)}</span> — {h.action} <span className="text-muted">({uname(h.by)})</span></li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
