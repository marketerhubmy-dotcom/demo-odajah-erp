import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { PROSPECT_STAGES } from '../data/constants.js';
import { PageHeader, Modal, Empty, StatCard, Sim } from '../components/ui.jsx';
import { rm, rm0, fmtDate, fmtDateTime, collectionDate, MONTHS } from '../utils.js';

/* ── Summary Prestasi Admin (master_admin, baca-sahaja) ── */
export function MasterSummary() {
  const { db } = useStore();
  const now = new Date();
  const opts = [{ k: 'all', l: 'Semua Tempoh' }, ...[0, 1, 2, 3, 4, 5].map((i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return { k: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, l: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }; })];
  const [m, setM] = useState(opts[1].k);
  const orders = db.orders.filter((o) => m === 'all' || o.createdAt.startsWith(m));
  const rows = db.users.filter((u) => u.role === 'sales').map((u) => {
    const os = orders.filter((o) => o.createdBy === u.id);
    const sales = os.reduce((s, o) => s + o.price, 0);
    const kut = os.reduce((s, o) => s + (collectionDate(o, db.remittances) ? o.price : 0), 0);
    const ret = os.filter((o) => o.status === 'returned');
    const retRm = ret.reduce((s, o) => s + o.price, 0);
    const rep = os.filter((o) => o.customerType === 'existing').length;
    return { u, n: os.length, sales, kut, ret: ret.length, retRm, rep, self: os.length - rep, baki: sales - kut - retRm };
  }).filter((r) => r.n);
  const tot = rows.reduce((a, r) => ({ n: a.n + r.n, sales: a.sales + r.sales, kut: a.kut + r.kut, ret: a.ret + r.ret, baki: a.baki + r.baki }), { n: 0, sales: 0, kut: 0, ret: 0, baki: 0 });
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '-');
  return (
    <>
      <PageHeader title="Summary Prestasi Admin" sub={<><i className="bi bi-eye me-1" />Paparan baca-sahaja untuk Master Admin.</>}>
        <select className="form-select form-select-sm" value={m} onChange={(e) => setM(e.target.value)}>{opts.map((o) => <option key={o.k} value={o.k}>{o.l}</option>)}</select>
      </PageHeader>
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><StatCard label="Order" value={tot.n} color="#4361ee" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Sales" value={rm0(tot.sales)} color="#198754" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Kutipan" value={rm0(tot.kut)} sub={pct(tot.kut, tot.sales)} color="#0dcaf0" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Baki Belum Dikutip" value={rm0(tot.baki)} color="#fd7e14" /></div>
      </div>
      <div className="card"><div className="table-responsive"><table className="table table-hover mb-0">
        <thead><tr><th>Admin</th><th className="text-end">Order</th><th className="text-end">Sales</th><th className="text-end">Kutipan</th><th className="text-end">% Kutipan</th><th className="text-end">Return</th><th className="text-end">% Return</th><th className="text-end">Self / Repeat</th><th className="text-end">% Repeat</th><th className="text-end">Baki</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.u.id}><td>{r.u.name}</td><td className="text-end">{r.n}</td><td className="text-end">{rm0(r.sales)}</td><td className="text-end">{rm0(r.kut)}</td><td className="text-end">{pct(r.kut, r.sales)}</td>
            <td className="text-end">{r.ret}</td><td className="text-end">{pct(r.ret, r.n)}</td><td className="text-end">{r.self} / {r.rep}</td><td className="text-end">{pct(r.rep, r.n)}</td><td className="text-end">{rm0(r.baki)}</td></tr>
        ))}</tbody>
      </table>{!rows.length && <Empty text="Tiada data untuk tempoh ini." />}</div></div>
    </>
  );
}

/* ── P&L Saya (anggaran ringkas) ── */
export function PnlSaya() {
  const { db, user } = useStore();
  const now = new Date();
  const months = [0, 1, 2].map((i) => new Date(now.getFullYear(), now.getMonth() - i, 1));
  return (
    <>
      <PageHeader title="P&L Saya" sub={<>Ringkasan anggaran bulanan. Sistem sebenar menggunakan formula kutipan merentas bulan yang lebih terperinci <Sim>DIPERMUDAH</Sim></>} />
      <div className="row g-3">{months.map((d) => {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const os = db.orders.filter((o) => o.createdBy === user.id && o.createdAt.startsWith(key));
        const sales = os.filter((o) => o.status !== 'returned').reduce((s, o) => s + o.price, 0);
        const kut = os.reduce((s, o) => s + (collectionDate(o, db.remittances) ? o.price : 0), 0);
        const cogs = os.filter((o) => o.status !== 'returned').reduce((s, o) => s + (db.products.find((p) => p.id === o.productId)?.cost || 0) * o.quantity, 0);
        const ads = Math.round(sales * 0.22);
        const net = kut - cogs - ads;
        const comm = Math.max(0, net * 0.15);
        return (
          <div className="col-md-4" key={key}><div className="card h-100"><div className="card-header d-flex justify-content-between"><span>{MONTHS[d.getMonth()]} {d.getFullYear()}</span>{key === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` ? <span className="badge bg-warning text-dark">Anggaran</span> : <span className="badge bg-success">Final</span>}</div>
            <div className="card-body"><table className="table table-sm mb-0"><tbody>
              <tr><td>Sales ({os.length} order)</td><td className="text-end">{rm(sales)}</td></tr>
              <tr><td>Kutipan</td><td className="text-end">{rm(kut)}</td></tr>
              <tr className="text-danger"><td>COGS</td><td className="text-end">- {rm(cogs)}</td></tr>
              <tr className="text-danger"><td>Kos Iklan <span className="sim-tag">CONTOH</span></td><td className="text-end">- {rm(ads)}</td></tr>
              <tr className="fw-semibold"><td>Untung Bersih</td><td className="text-end">{rm(net)}</td></tr>
              <tr className="fw-bold text-success"><td>Jangkaan Income</td><td className="text-end">{rm(comm)}</td></tr>
            </tbody></table></div></div></div>
        );
      })}</div>
    </>
  );
}

/* ── Prospect ── */
export function Prospects() {
  const { db, user, role, patch } = useStore();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [assign, setAssign] = useState(null);
  const sales = db.users.filter((u) => u.role === 'sales' && u.active);
  const scoped = role === 'sales' ? db.prospects.filter((p) => p.assignedTo === user.id) : db.prospects;
  const list = scoped.filter((p) => (!st || p.status === st) && (!q || (p.name + p.phone).toLowerCase().includes(q.toLowerCase())));
  const cnt = (s) => scoped.filter((p) => p.status === s).length;
  const label = { baru: 'Belum Diproses', diproses: 'Sudah Diproses, Belum Jadi', customer: 'Jadi Customer' };
  const cls = { baru: 'bg-warning text-dark', diproses: 'bg-info text-dark', customer: 'bg-success' };
  return (
    <>
      <PageHeader title={role === 'sales' ? 'Prospect Saya' : 'Prospect'} sub="Lead daripada website / iklan yang belum checkout." />
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><StatCard label="Total Prospek" value={scoped.length} color="#4361ee" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Belum Diproses" value={cnt('baru')} color="#ffc107" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Sudah Diproses" value={cnt('diproses')} color="#0dcaf0" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Jumlah Jadi Customer" value={cnt('customer')} color="#198754" /></div>
      </div>
      <div className="card mb-3"><div className="card-body py-2 row g-2">
        <div className="col-md-6"><input className="form-control form-control-sm" placeholder="Cari nama / telefon" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="col-md-6"><select className="form-select form-select-sm" value={st} onChange={(e) => setSt(e.target.value)}><option value="">Status: Semua</option>{Object.entries(label).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </div></div>
      <div className="card"><div className="table-responsive"><table className="table table-hover mb-0">
        <thead><tr><th>Tarikh</th><th>Nama</th><th>Telefon</th><th>Negeri</th><th>Produk</th><th>Sumber</th><th>Follow-up Stage</th><th>Ditugaskan Kepada</th><th>Status</th><th>Tindakan</th></tr></thead>
        <tbody>{list.map((p) => (
          <tr key={p.id}>
            <td className="small text-nowrap">{fmtDate(p.createdAt)}</td><td>{p.name}</td><td className="small">{p.phone}</td><td className="small">{p.state}</td>
            <td className="small">{db.products.find((x) => x.id === p.productId)?.name.split(' (')[0]}</td><td className="small">{p.source}</td>
            <td><select className="form-select form-select-sm" style={{ minWidth: 100 }} value={p.stage} disabled={role === 'master_admin'} onChange={(e) => patch('prospects', p.id, { stage: e.target.value, status: p.status === 'baru' ? 'diproses' : p.status }, 'Stage dikemas kini.')}>{PROSPECT_STAGES.map((s) => <option key={s}>{s}</option>)}</select></td>
            <td className="small">{db.users.find((u) => u.id === p.assignedTo)?.name || <span className="text-muted">—</span>}</td>
            <td><span className={`badge ${cls[p.status]}`}>{label[p.status]}</span></td>
            <td className="text-nowrap">
              {role === 'admin' && <button className="btn btn-sm btn-outline-secondary me-1" title="Tugaskan" onClick={() => setAssign(p)}><i className="bi bi-person-plus" /></button>}
              {p.status !== 'customer' && role !== 'master_admin' && <button className="btn btn-sm btn-outline-success" title="Tanda jadi customer" onClick={() => patch('prospects', p.id, { status: 'customer', stage: 'Closing' }, `${p.name} ditanda sebagai customer.`)}><i className="bi bi-check2" /></button>}
            </td>
          </tr>
        ))}</tbody>
      </table>{!list.length && <Empty />}</div></div>
      {assign && (
        <Modal title={`Tugaskan: ${assign.name}`} onClose={() => setAssign(null)}>
          <div className="list-group">{sales.map((u) => <button key={u.id} className={`list-group-item list-group-item-action ${assign.assignedTo === u.id ? 'active' : ''}`} onClick={() => { patch('prospects', assign.id, { assignedTo: u.id }, `Prospek ditugaskan kepada ${u.name}.`); setAssign(null); }}>{u.name}</button>)}</div>
        </Modal>
      )}
    </>
  );
}

/* ── WhatsApp Team (mockup UI) ── */
export function WhatsApp() {
  const { db, sendChat, readChat } = useStore();
  const [active, setActive] = useState(db.chats[0]?.id);
  const [text, setText] = useState('');
  const box = useRef(null);
  const chat = db.chats.find((c) => c.id === active);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [chat?.messages.length, active]);
  const qr = text.startsWith('/') ? db.quickReplies.filter((r) => r.key.startsWith(text)) : [];
  const send = (e) => { e.preventDefault(); if (text.trim()) { sendChat(active, text.trim()); setText(''); } };
  return (
    <>
      <PageHeader title="WhatsApp Team" sub={<>Inbox berkongsi untuk pasukan. <Sim>MOCKUP — tiada mesej sebenar dihantar</Sim></>} />
      <div className="card overflow-hidden"><div className="wa-wrap">
        <div className="wa-list">{db.chats.map((c) => (
          <div key={c.id} className={`wa-item ${c.id === active ? 'active' : ''}`} onClick={() => { setActive(c.id); readChat(c.id); }} role="button">
            <div className="d-flex justify-content-between"><strong className="small">{c.name}</strong>{c.unread > 0 && <span className="badge bg-success rounded-pill">{c.unread}</span>}</div>
            <div className="small text-muted text-truncate">{c.messages[c.messages.length - 1]?.text}</div>
            <span className="badge bg-light text-dark border mt-1" style={{ fontSize: '.65rem' }}>{c.label}</span>
          </div>
        ))}</div>
        {chat && <div className="d-flex flex-column" style={{ minHeight: 460 }}>
          <div className="p-2 px-3 border-bottom d-flex justify-content-between align-items-center"><div><strong>{chat.name}</strong> <span className="small text-muted">{chat.phone}</span></div><Link to="/orders/new" className="btn btn-sm btn-outline-danger"><i className="bi bi-cart-plus me-1" />Buat Order</Link></div>
          <div className="wa-msgs" ref={box}>{chat.messages.map((m, i) => <div key={i} className={`wa-bubble ${m.from}`}>{m.text}<div className="text-end" style={{ fontSize: '.65rem', opacity: .6 }}>{fmtDateTime(m.at)}</div></div>)}</div>
          <form className="p-2 border-top position-relative" onSubmit={send}>
            {qr.length > 0 && <div className="list-group position-absolute bottom-100 start-0 end-0 m-2 shadow">{qr.map((r) => <button type="button" key={r.key} className="list-group-item list-group-item-action small" onClick={() => setText(r.text)}><strong>{r.key}</strong> — {r.text}</button>)}</div>}
            <div className="input-group"><input className="form-control" placeholder="Taip mesej… (cuba taip /harga)" value={text} onChange={(e) => setText(e.target.value)} /><button className="btn btn-success"><i className="bi bi-send" /></button></div>
          </form>
        </div>}
      </div></div>
    </>
  );
}

/* ── Tentang Demo ── */
export function About() {
  const rows = [
    ['Dashboard Sales / Syarikat', 'Interaktif', 'Stat card, carta revenue, status breakdown, tapis tarikh'],
    ['Buat Order', 'Interaktif', 'Platform → Objective → Channel, produk, pakej promo, free gift, COD/Transfer/Marketplace, Pos Pada'],
    ['Verify Payment & Remittance', 'Interaktif', 'Sahkan/tolak transfer dengan sebab; sahkan remittance TikTok/Shopee'],
    ['Logistik', 'Interaktif', 'Pos Pada → Awaiting → Processing → Delivering → Delivered/Returned, Hold, Stock Take'],
    ['Produk / Free Gift / Pakej Promo', 'Interaktif', 'Tambah & edit; stok berkurang bila order dibuat'],
    ['Prospect', 'Interaktif', 'Stage follow-up, tugaskan, tanda jadi customer'],
    ['Cuti / Apply Shift / Process Leaves', 'Interaktif', 'Mohon → HR lulus/tolak → baki cuti dikemas kini'],
    ['Summary Prestasi Admin', 'Interaktif (baca-sahaja)', 'Role Master Admin'],
    ['Kehadiran', 'Simulasi', 'Sistem sebenar menerima data peranti cap jari; demo menjana rekod rekaan'],
    ['Slip Gaji / P&L', 'Dipermudah', 'Angka contoh; formula sebenar (kutipan merentas bulan, overriding) tidak didedahkan'],
    ['WhatsApp Team', 'Mockup', 'Tiada mesej dihantar; hanya UI inbox & quick reply'],
    ['API courier (Ninjavan, J&T, Pos Laju), Billplz, Google Sheets', 'Simulasi', 'Tiada panggilan luar; nombor tracking adalah rekaan'],
  ];
  return (
    <>
      <PageHeader title="Tentang Demo Ini" sub="Apa yang benar-benar interaktif, apa yang disimulasikan." />
      <div className="alert alert-warning"><i className="bi bi-shield-check me-1" /><strong>Ini bukan sistem production.</strong> Demo ini ialah aplikasi statik (React + Vite) tanpa backend, tanpa API, tanpa database. Semua data adalah rekaan dan disimpan dalam <code>localStorage</code> browser anda. Butang <strong>Reset Demo</strong> memulihkan data asal.</div>
      <div className="card"><div className="table-responsive"><table className="table mb-0">
        <thead><tr><th>Modul</th><th>Tahap</th><th>Nota</th></tr></thead>
        <tbody>{rows.map(([a, b, c]) => <tr key={a}><td className="fw-semibold">{a}</td><td><span className={`badge ${b.startsWith('Interaktif') ? 'bg-success' : b === 'Mockup' ? 'bg-secondary' : 'bg-warning text-dark'}`}>{b}</span></td><td className="small">{c}</td></tr>)}</tbody>
      </table></div></div>
      <div className="small text-muted mt-3">Modul yang <strong>tiada</strong> dalam sistem sebenar (cth. Purchase Order, Supplier, Invoice/e-Invoice, Quotation, multi-gudang) sengaja tidak dipaparkan. · Dibina oleh MHM Web Studio.</div>
    </>
  );
}

