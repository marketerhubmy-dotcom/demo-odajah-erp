import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { SC, PLATFORMS, CUSTOMER_TYPES, PAYMENT_METHODS, COURIERS, STATES, BANKS } from '../data/constants.js';
import { PageHeader } from '../components/ui.jsx';
import { rm, today } from '../utils.js';

const EMPTY = {
  customerName: '', phone: '', address: '', postcode: '', city: '', state: '',
  platform: '', objective: '', channel: '', customerType: 'new', orderType: 'biasa', promoPackageId: '',
  productId: '', quantity: 1, product2Id: '', quantity2: 1, giftId: '', giftQty: 1,
  method: '', bank: '', reference: '', paymentDate: today(), courier: '', posPada: false, posPadaDate: '', notes: '', priceOverride: '',
};

export default function CreateOrder() {
  const { db, user, createOrder } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const products = db.products.filter((p) => p.active);
  const promos = db.promoPackages.filter((p) => p.active && (!p.end || p.end >= today()));
  const pkg = f.orderType === 'promo' ? promos.find((p) => p.id === Number(f.promoPackageId)) : null;
  const objectives = f.platform ? Object.keys(SC[f.platform]) : [];
  const channels = f.platform && f.objective ? SC[f.platform][f.objective] || [] : [];

  const methods = useMemo(() => {
    if (f.platform === 'shopee') return ['shopee_paid', 'shopee_cod'];
    if (f.platform === 'tiktok' && f.objective === 'PRODUCT SALE') return ['tiktok_paid', 'tiktok_cod'];
    return ['cod', 'transfer'];
  }, [f.platform, f.objective]);

  const p1 = pkg ? db.products.find((p) => p.id === pkg.productId) : products.find((p) => p.id === Number(f.productId));
  const p2 = products.find((p) => p.id === Number(f.product2Id));
  const auto = pkg ? pkg.price : (p1 ? p1.price * Number(f.quantity || 0) : 0) + (p2 ? p2.price * Number(f.quantity2 || 0) : 0);
  const price = f.priceOverride !== '' ? Number(f.priceOverride) : auto;

  const fillSample = () => {
    const n = Math.floor(Math.random() * 900) + 100;
    setF({ ...EMPTY, customerName: `Pelanggan Contoh ${n}`, phone: `011-000 0${n}`, address: `No. ${n % 50}, Jalan Contoh 3, Taman Demo`, postcode: '40000', city: 'Shah Alam', state: 'Selangor', platform: 'facebook', objective: 'CONVERSION', channel: 'WHATSAPP MANUAL', productId: String(products[0].id), quantity: 2, method: 'transfer', bank: 'Maybank', reference: `DEMO${n}${n}`, courier: 'Ninjavan', notes: 'Order contoh (auto-isi demo)' });
  };

  const submit = (e) => {
    e.preventDefault();
    const method = methods.includes(f.method) ? f.method : '';
    if (!f.customerName || !f.phone || !f.state) return setErr('Sila isi nama, telefon dan negeri pelanggan.');
    if (!f.platform || !f.objective) return setErr('Sila pilih Platform dan Objective.');
    if (channels.length && !f.channel) return setErr('Channel wajib untuk kombinasi Platform/Objective ini.');
    if (!p1) return setErr('Sila pilih produk atau pakej promo.');
    if (!method) return setErr('Sila pilih kaedah bayaran.');
    if (method === 'transfer' && (!f.bank || !f.reference)) return setErr('Transfer memerlukan bank dan no. rujukan.');
    if (f.platform !== 'shopee' && !f.courier) return setErr('Sila pilih courier.');
    if (f.posPada && !f.posPadaDate) return setErr('Sila pilih tarikh Pos Pada.');
    const id = createOrder({
      customerName: f.customerName, phone: f.phone, address: f.address, postcode: f.postcode, city: f.city, state: f.state,
      productId: p1.id, productName: p1.name, quantity: pkg ? pkg.quantity : Number(f.quantity),
      product2Id: !pkg && p2 ? p2.id : null, product2Name: !pkg && p2 ? p2.name : '', quantity2: !pkg && p2 ? Number(f.quantity2) : 0,
      promoPackageId: pkg ? pkg.id : null,
      giftId: pkg ? pkg.giftId : (f.giftId ? Number(f.giftId) : null), giftQty: pkg ? pkg.giftQty : (f.giftId ? Number(f.giftQty) : 0),
      price, platform: f.platform, objective: f.objective, channel: f.channel, customerType: f.customerType, orderType: f.orderType,
      payment: { method, bank: f.bank, reference: f.reference, paymentDate: method === 'transfer' ? f.paymentDate : '' },
      courier: f.platform === 'shopee' ? 'Shopee' : f.courier, posPadaDate: f.posPada ? f.posPadaDate : '', notes: f.notes,
    }, user.id);
    nav('/orders', { state: { created: id } });
  };

  return (
    <>
      <PageHeader title="Buat Order" sub="Order transfer akan menunggu pengesahan Accounting; COD & marketplace terus ke Logistik.">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={fillSample}><i className="bi bi-magic me-1" />Isi Contoh</button>
      </PageHeader>
      <form onSubmit={submit} noValidate>
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card mb-3"><div className="card-header"><i className="bi bi-person me-1" />Maklumat Pelanggan</div><div className="card-body row g-2">
              <div className="col-md-6"><label className="form-label small">Nama Penuh *</label><input className="form-control" value={f.customerName} onChange={set('customerName')} /></div>
              <div className="col-md-6"><label className="form-label small">No. Telefon *</label><input className="form-control" value={f.phone} onChange={set('phone')} placeholder="01X-XXX XXXX" /></div>
              <div className="col-12"><label className="form-label small">Alamat Penuh</label><textarea className="form-control" rows={2} value={f.address} onChange={set('address')} /></div>
              <div className="col-4"><label className="form-label small">Poskod</label><input className="form-control" value={f.postcode} onChange={set('postcode')} inputMode="numeric" /></div>
              <div className="col-8 col-md-4"><label className="form-label small">Daerah / Bandar</label><input className="form-control" value={f.city} onChange={set('city')} /></div>
              <div className="col-12 col-md-4"><label className="form-label small">Negeri *</label><select className="form-select" value={f.state} onChange={set('state')}><option value="">-- Pilih Negeri --</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
            </div></div>

            <div className="card mb-3"><div className="card-header"><i className="bi bi-diagram-3 me-1" />Sumber Order</div><div className="card-body row g-2">
              <div className="col-md-4"><label className="form-label small">Platform *</label><select className="form-select" value={f.platform} onChange={(e) => setF((x) => ({ ...x, platform: e.target.value, objective: '', channel: '', method: '' }))}><option value="">-- Pilih --</option>{Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div className="col-md-4"><label className="form-label small">Objective *</label><select className="form-select" value={f.objective} disabled={!f.platform} onChange={(e) => setF((x) => ({ ...x, objective: e.target.value, channel: '', method: '' }))}><option value="">{f.platform ? '-- Pilih Objective --' : '-- Pilih Platform Dulu --'}</option>{objectives.map((o) => <option key={o}>{o}</option>)}</select></div>
              <div className="col-md-4"><label className="form-label small">Channel {channels.length ? '*' : ''}</label><select className="form-select" value={f.channel} disabled={!channels.length} onChange={set('channel')}><option value="">{f.objective && !channels.length ? 'Tiada channel spesifik' : '-- Pilih Channel --'}</option>{channels.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="col-md-6"><label className="form-label small">Jenis Prospek</label><select className="form-select" value={f.customerType} onChange={set('customerType')}>{Object.entries(CUSTOMER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div className="col-md-6"><label className="form-label small">Jenis Order</label><select className="form-select" value={f.orderType} onChange={set('orderType')}><option value="biasa">Order Biasa</option><option value="promo">Promo</option></select></div>
            </div></div>

            <div className="card mb-3"><div className="card-header"><i className="bi bi-box-seam me-1" />Produk</div><div className="card-body row g-2">
              {f.orderType === 'promo' ? (
                <div className="col-12"><label className="form-label small">Pakej Promo</label>
                  <select className="form-select" value={f.promoPackageId} onChange={set('promoPackageId')}><option value="">-- Pilih Pakej --</option>{promos.map((p) => <option key={p.id} value={p.id}>{p.name} — {rm(p.price)}</option>)}</select>
                  {pkg && <div className="form-text">{db.products.find((p) => p.id === pkg.productId)?.name} × {pkg.quantity}{pkg.giftId ? ` + ${db.freeGifts.find((g) => g.id === pkg.giftId)?.name} × ${pkg.giftQty}` : ''} · Tamat {pkg.end || '—'}</div>}
                </div>
              ) : (<>
                <div className="col-8"><label className="form-label small">Produk 1 *</label><select className="form-select" value={f.productId} onChange={set('productId')}><option value="">-- Pilih Produk --</option>{products.map((p) => <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.name} — {rm(p.price)} (stok {p.stock})</option>)}</select></div>
                <div className="col-4"><label className="form-label small">Kuantiti</label><input type="number" min={1} className="form-control" value={f.quantity} onChange={set('quantity')} /></div>
                <div className="col-8"><label className="form-label small">Produk 2</label><select className="form-select" value={f.product2Id} onChange={set('product2Id')}><option value="">-- Pilih Produk 2 --</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="col-4"><label className="form-label small">Kuantiti</label><input type="number" min={1} className="form-control" value={f.quantity2} onChange={set('quantity2')} disabled={!f.product2Id} /></div>
                <div className="col-8"><label className="form-label small">Free Gift</label><select className="form-select" value={f.giftId} onChange={set('giftId')}><option value="">Tiada</option>{db.freeGifts.filter((g) => g.active).map((g) => <option key={g.id} value={g.id}>{g.name} (stok {g.stock})</option>)}</select></div>
                <div className="col-4"><label className="form-label small">Qty Gift</label><input type="number" min={1} className="form-control" value={f.giftQty} onChange={set('giftQty')} disabled={!f.giftId} /></div>
              </>)}
            </div></div>
          </div>

          <div className="col-lg-4">
            <div className="card mb-3"><div className="card-header"><i className="bi bi-credit-card me-1" />Bayaran</div><div className="card-body">
              {!f.platform && <div className="small text-muted mb-2">Pilih platform dahulu.</div>}
              {f.platform && methods.map((m) => (
                <div className="form-check" key={m}><input className="form-check-input" type="radio" id={`m_${m}`} name="method" value={m} checked={f.method === m} onChange={set('method')} /><label className="form-check-label fw-semibold" htmlFor={`m_${m}`}>{PAYMENT_METHODS[m]}</label></div>
              ))}
              {f.method === 'transfer' && (
                <div className="row g-2 mt-1">
                  <div className="col-6"><label className="form-label small">Bank *</label><select className="form-select form-select-sm" value={f.bank} onChange={set('bank')}><option value="">-- Pilih Bank --</option>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></div>
                  <div className="col-6"><label className="form-label small">Tarikh Bayaran</label><input type="date" className="form-control form-control-sm" value={f.paymentDate} onChange={set('paymentDate')} /></div>
                  <div className="col-12"><label className="form-label small">No. Rujukan *</label><input className="form-control form-control-sm" value={f.reference} onChange={set('reference')} /></div>
                  <div className="col-12"><label className="form-label small">Upload Resit <span className="sim-tag">SIMULASI</span></label><input type="file" className="form-control form-control-sm" disabled /></div>
                </div>
              )}
              <hr />
              <label className="form-label small">Harga Combo (RM) — kosongkan untuk auto</label>
              <input type="number" className="form-control" placeholder={auto.toFixed(2)} value={f.priceOverride} onChange={set('priceOverride')} />
              <div className="d-flex justify-content-between mt-2"><span className="text-muted">Jumlah</span><span className="fs-5 fw-bold">{rm(price)}</span></div>
            </div></div>

            <div className="card mb-3"><div className="card-header"><i className="bi bi-truck me-1" />Penghantaran</div><div className="card-body">
              {f.platform === 'shopee' ? <div className="small text-muted">Penghantaran diurus oleh Shopee.</div> : (
                <><label className="form-label small">Pilih Courier *</label><select className="form-select" value={f.courier} onChange={set('courier')}><option value="">-- Pilih Courier --</option>{COURIERS.map((c) => <option key={c}>{c}</option>)}</select></>
              )}
              <div className="form-check form-switch mt-3"><input className="form-check-input" type="checkbox" id="pp" checked={f.posPada} onChange={set('posPada')} /><label className="form-check-label small" htmlFor="pp">Pos Pada (jadual tarikh hantar)</label></div>
              {f.posPada && <input type="date" className="form-control mt-2" min={today()} value={f.posPadaDate} onChange={set('posPadaDate')} />}
              <label className="form-label small mt-3">Nota (Optional)</label>
              <textarea className="form-control" rows={2} value={f.notes} onChange={set('notes')} />
            </div></div>

            {err && <div className="alert alert-danger small py-2">{err}</div>}
            <button type="submit" className="btn btn-danger w-100 fw-bold py-2"><i className="bi bi-check2-circle me-1" />Hantar Order</button>
          </div>
        </div>
      </form>
    </>
  );
}
