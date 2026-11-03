import { useState } from 'react';
import { useStore } from '../store.jsx';
import { PageHeader, Modal, Empty } from '../components/ui.jsx';
import { rm, today } from '../utils.js';

function useForm(init) {
  const [f, setF] = useState(init);
  const set = (k, num) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : num ? Number(e.target.value) : e.target.value }));
  return [f, set, setF];
}

const canEdit = (role) => ['admin', 'logistik'].includes(role);

function ProductForm({ item, onClose }) {
  const { upsert } = useStore();
  const [f, set] = useForm(item || { name: '', sku: '', stock: 0, cost: 0, price: 0, weight: 0.2, active: true });
  return (
    <Modal title={item ? 'Edit Produk' : 'Tambah Produk'} onClose={onClose} footer={<>
      <button className="btn btn-light" onClick={onClose}>Batal</button>
      <button className="btn btn-danger" disabled={!f.name || !f.sku} onClick={() => { upsert('products', f, 'product'); onClose(); }}>Simpan</button></>}>
      <div className="row g-2">
        <div className="col-12"><label className="form-label small">Nama Produk *</label><input className="form-control" value={f.name} onChange={set('name')} /></div>
        <div className="col-6"><label className="form-label small">SKU *</label><input className="form-control" value={f.sku} onChange={set('sku')} /></div>
        <div className="col-6"><label className="form-label small">Stok</label><input type="number" className="form-control" value={f.stock} onChange={set('stock', 1)} /></div>
        <div className="col-4"><label className="form-label small">Harga Jual (RM)</label><input type="number" className="form-control" value={f.price} onChange={set('price', 1)} /></div>
        <div className="col-4"><label className="form-label small">Kos (RM)</label><input type="number" className="form-control" value={f.cost} onChange={set('cost', 1)} /></div>
        <div className="col-4"><label className="form-label small">Berat (kg)</label><input type="number" step="0.01" className="form-control" value={f.weight} onChange={set('weight', 1)} /></div>
        <div className="col-12"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="pa" checked={f.active} onChange={set('active')} /><label className="form-check-label" htmlFor="pa">Aktif</label></div></div>
      </div>
    </Modal>
  );
}

export function Products() {
  const { db, role } = useStore();
  const [edit, setEdit] = useState(null);
  return (
    <>
      <PageHeader title="Produk" sub="Senarai produk, SKU & stok semasa.">
        {canEdit(role) && <button className="btn btn-danger btn-sm" onClick={() => setEdit({})}><i className="bi bi-plus-circle me-1" />Tambah Produk</button>}
      </PageHeader>
      <div className="card"><div className="table-responsive"><table className="table table-hover mb-0">
        <thead><tr><th>Nama Produk</th><th>SKU</th><th className="text-end">Harga</th><th className="text-end">Stok Semasa</th><th>Status</th><th>Tindakan</th></tr></thead>
        <tbody>{db.products.map((p) => (
          <tr key={p.id}><td className="fw-semibold">{p.name}</td><td className="font-monospace small">{p.sku}</td><td className="text-end">{rm(p.price)}</td>
            <td className={`text-end fw-semibold ${p.stock === 0 ? 'text-danger' : p.stock < 50 ? 'text-warning' : ''}`}>{p.stock}</td>
            <td>{p.active ? <span className="badge bg-success">Aktif</span> : <span className="badge bg-secondary">Tidak Aktif</span>}</td>
            <td>{canEdit(role) && <button className="btn btn-sm btn-outline-primary" onClick={() => setEdit(p)}><i className="bi bi-pencil" /></button>}</td></tr>
        ))}</tbody>
      </table></div></div>
      {edit && <ProductForm item={edit.id ? edit : null} onClose={() => setEdit(null)} />}
    </>
  );
}

function GiftForm({ item, onClose }) {
  const { upsert } = useStore();
  const [f, set] = useForm(item || { name: '', stock: 0, cost: 0, active: true });
  return (
    <Modal title={item ? 'Edit Free Gift' : 'Tambah Free Gift'} onClose={onClose} footer={<>
      <button className="btn btn-light" onClick={onClose}>Batal</button>
      <button className="btn btn-danger" disabled={!f.name} onClick={() => { upsert('freeGifts', f, 'gift'); onClose(); }}>Simpan</button></>}>
      <div className="row g-2">
        <div className="col-12"><label className="form-label small">Nama *</label><input className="form-control" value={f.name} onChange={set('name')} /></div>
        <div className="col-6"><label className="form-label small">Stok</label><input type="number" className="form-control" value={f.stock} onChange={set('stock', 1)} /></div>
        <div className="col-6"><label className="form-label small">Kos (RM)</label><input type="number" className="form-control" value={f.cost} onChange={set('cost', 1)} /></div>
        <div className="col-12"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="ga" checked={f.active} onChange={set('active')} /><label className="form-check-label" htmlFor="ga">Aktif</label></div></div>
      </div>
    </Modal>
  );
}

export function FreeGifts() {
  const { db, role } = useStore();
  const [edit, setEdit] = useState(null);
  return (
    <>
      <PageHeader title="Free Gift" sub="Hadiah percuma yang boleh dilampirkan pada order atau pakej promo.">
        {canEdit(role) && <button className="btn btn-danger btn-sm" onClick={() => setEdit({})}><i className="bi bi-plus-circle me-1" />Tambah</button>}
      </PageHeader>
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Nama</th><th className="text-end">Stok</th><th className="text-end">Kos</th><th>Status</th><th>Tindakan</th></tr></thead>
        <tbody>{db.freeGifts.map((g) => (
          <tr key={g.id}><td>{g.name}</td><td className={`text-end ${g.stock < 50 ? 'text-warning fw-semibold' : ''}`}>{g.stock}</td><td className="text-end">{rm(g.cost)}</td>
            <td>{g.active ? <span className="badge bg-success">Aktif</span> : <span className="badge bg-secondary">Tidak Aktif</span>}</td>
            <td>{canEdit(role) && <button className="btn btn-sm btn-outline-primary" onClick={() => setEdit(g)}><i className="bi bi-pencil" /></button>}</td></tr>
        ))}</tbody>
      </table></div></div>
      {edit && <GiftForm item={edit.id ? edit : null} onClose={() => setEdit(null)} />}
    </>
  );
}

function PromoForm({ item, onClose }) {
  const { db, upsert } = useStore();
  const [f, set] = useForm(item || { name: '', productId: db.products[0].id, quantity: 2, price: 0, giftId: null, giftQty: 1, start: today(), end: '', active: true });
  return (
    <Modal title={item ? 'Edit Pakej Promo' : 'Tambah Pakej Promo'} onClose={onClose} footer={<>
      <button className="btn btn-light" onClick={onClose}>Batal</button>
      <button className="btn btn-danger" disabled={!f.name || !f.price} onClick={() => { upsert('promoPackages', { ...f, giftId: f.giftId ? Number(f.giftId) : null }, 'promo'); onClose(); }}>Simpan</button></>}>
      <div className="row g-2">
        <div className="col-12"><label className="form-label small">Nama Pakej *</label><input className="form-control" value={f.name} onChange={set('name')} /></div>
        <div className="col-8"><label className="form-label small">Produk</label><select className="form-select" value={f.productId} onChange={set('productId', 1)}>{db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="col-4"><label className="form-label small">Kuantiti</label><input type="number" min={1} className="form-control" value={f.quantity} onChange={set('quantity', 1)} /></div>
        <div className="col-6"><label className="form-label small">Harga Pakej (RM) *</label><input type="number" className="form-control" value={f.price} onChange={set('price', 1)} /></div>
        <div className="col-6"><label className="form-label small">Gift</label><select className="form-select" value={f.giftId || ''} onChange={set('giftId')}><option value="">Tiada</option>{db.freeGifts.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
        <div className="col-6"><label className="form-label small">Mula</label><input type="date" className="form-control" value={f.start} onChange={set('start')} /></div>
        <div className="col-6"><label className="form-label small">Tamat</label><input type="date" className="form-control" value={f.end} onChange={set('end')} /></div>
        <div className="col-12"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="pra" checked={f.active} onChange={set('active')} /><label className="form-check-label" htmlFor="pra">Aktif</label></div></div>
      </div>
    </Modal>
  );
}

export function Promos() {
  const { db, role } = useStore();
  const [edit, setEdit] = useState(null);
  const t = today();
  return (
    <>
      <PageHeader title="Pakej Promo" sub="Pakej harga khas dengan tempoh sah — dipilih semasa Buat Order (Jenis Order: Promo).">
        {role === 'admin' && <button className="btn btn-danger btn-sm" onClick={() => setEdit({})}><i className="bi bi-plus-circle me-1" />Tambah Pakej</button>}
      </PageHeader>
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Nama Pakej</th><th>Produk</th><th className="text-end">Harga</th><th>Gift</th><th>Tempoh</th><th>Status</th><th>Tindakan</th></tr></thead>
        <tbody>{db.promoPackages.map((p) => {
          const expired = p.end && p.end < t;
          return (<tr key={p.id}>
            <td className="fw-semibold">{p.name}</td><td className="small">{db.products.find((x) => x.id === p.productId)?.name} × {p.quantity}</td><td className="text-end">{rm(p.price)}</td>
            <td className="small">{p.giftId ? `${db.freeGifts.find((g) => g.id === p.giftId)?.name} × ${p.giftQty}` : '-'}</td>
            <td className="small text-nowrap">{p.start || '—'} → {p.end || '—'}</td>
            <td>{expired ? <span className="badge bg-secondary">Tamat</span> : p.active ? <span className="badge bg-success">Aktif</span> : <span className="badge bg-secondary">Tidak Aktif</span>}</td>
            <td>{role === 'admin' && <button className="btn btn-sm btn-outline-primary" onClick={() => setEdit(p)}><i className="bi bi-pencil" /></button>}</td>
          </tr>);
        })}</tbody>
      </table>{!db.promoPackages.length && <Empty />}</div></div>
      {edit && <PromoForm item={edit.id ? edit : null} onClose={() => setEdit(null)} />}
    </>
  );
}
