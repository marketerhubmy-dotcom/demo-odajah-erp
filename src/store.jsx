// Store DEMO: semua data hidup dalam browser (localStorage). Tiada API, tiada backend.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { seedData, DEMO_LOGIN } from './data/seed.js';

const KEY_DATA = 'odajah_demo_data_v1';
const KEY_SESSION = 'odajah_demo_session_v1';

function load(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function save(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage disekat: demo tetap berjalan dalam memori */ }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => {
    const d = load(KEY_DATA);
    return d && d.version === 1 ? d : seedData();
  });
  const [session, setSession] = useState(() => load(KEY_SESSION));
  const [toasts, setToasts] = useState([]);

  useEffect(() => save(KEY_DATA, db), [db]);
  useEffect(() => { if (session) save(KEY_SESSION, session); else { try { localStorage.removeItem(KEY_SESSION); } catch { /* */ } } }, [session]);

  const toast = useCallback((text, variant = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const user = session ? db.users.find((u) => u.id === session.userId) : null;
  const role = session?.role || null;

  // Mutasi immutable ringkas.
  const mutate = useCallback((fn) => setDb((prev) => { const next = structuredClone(prev); fn(next); return next; }), []);

  const log = (o, by, action) => o.history.push({ at: new Date().toISOString(), by, action });

  const actions = useMemo(() => ({
    login(r) { setSession({ role: r, userId: DEMO_LOGIN[r] }); },
    logout() { setSession(null); },
    resetDemo() {
      try { localStorage.removeItem(KEY_DATA); } catch { /* */ }
      setDb(seedData());
      toast('Data demo telah ditetapkan semula.', 'info');
    },

    createOrder(data, byId) {
      let newId;
      mutate((d) => {
        newId = d.nextIds.order++;
        const method = data.payment.method;
        let status = method === 'transfer' ? 'pending' : 'approved';
        if (data.posPadaDate) status = 'pos_pada';
        d.orders.unshift({
          ...data,
          id: newId,
          createdAt: new Date().toISOString(),
          createdBy: byId,
          status,
          tracking: data.tracking || '',
          shippedAt: null, deliveredAt: null, onHoldRemark: '', remittanceId: null,
          payment: { ...data.payment, status: method === 'transfer' ? 'pending' : 'approved', verifiedAt: null, verifiedBy: null, rejectReason: '' },
          history: [{ at: new Date().toISOString(), by: byId, action: `Order dicipta (${status === 'pending' ? 'menunggu pengesahan bayaran' : 'terus ke Logistik'})` }],
        });
        const p = d.products.find((x) => x.id === data.productId);
        if (p) p.stock = Math.max(0, p.stock - data.quantity);
        if (data.product2Id) { const p2 = d.products.find((x) => x.id === data.product2Id); if (p2) p2.stock = Math.max(0, p2.stock - data.quantity2); }
        if (data.giftId) { const g = d.freeGifts.find((x) => x.id === data.giftId); if (g) g.stock = Math.max(0, g.stock - (data.giftQty || 0)); }
      });
      toast(`Order #${newId} berjaya dicipta.`);
      return newId;
    },

    updateOrder(id, byId, fn, message) {
      mutate((d) => { const o = d.orders.find((x) => x.id === id); if (o) { fn(o, d); log(o, byId, message); } });
      if (message) toast(message);
    },

    deleteOrder(id) {
      mutate((d) => { d.orders = d.orders.filter((o) => o.id !== id); });
      toast(`Order #${id} dipadam.`, 'danger');
    },

    verifyPayment(id, byId) {
      mutate((d) => {
        const o = d.orders.find((x) => x.id === id);
        o.payment.status = 'approved'; o.payment.verifiedAt = new Date().toISOString(); o.payment.verifiedBy = byId;
        if (o.status === 'pending') o.status = 'approved';
        log(o, byId, 'Bayaran transfer disahkan oleh Accounting');
      });
      toast(`Bayaran order #${id} disahkan — order dihantar ke Logistik.`);
    },
    rejectPayment(id, byId, reason) {
      mutate((d) => {
        const o = d.orders.find((x) => x.id === id);
        o.payment.status = 'rejected'; o.payment.rejectReason = reason;
        log(o, byId, `Bayaran ditolak: ${reason}`);
      });
      toast(`Bayaran order #${id} ditolak.`, 'danger');
    },
    verifyRemittance(id, byId) {
      mutate((d) => { const r = d.remittances.find((x) => x.id === id); r.status = 'approved'; r.verifiedBy = byId; });
      toast(`Remittance #${id} disahkan.`);
    },

    upsert(collection, item, idKey) {
      mutate((d) => {
        if (item.id) { const i = d[collection].findIndex((x) => x.id === item.id); d[collection][i] = item; }
        else d[collection].push({ ...item, id: d.nextIds[idKey]++ });
      });
      toast('Rekod disimpan.');
    },
    patch(collection, id, fields, message) {
      mutate((d) => { const x = d[collection].find((y) => y.id === id); Object.assign(x, fields); });
      if (message) toast(message);
    },

    applyLeave(data, userId) {
      mutate((d) => { d.leaves.unshift({ ...data, id: d.nextIds.leave++, userId, status: 'pending', hrRemark: '', createdAt: new Date().toISOString() }); });
      toast('Permohonan dihantar ke HR.');
    },
    reviewLeave(id, status, remark) {
      mutate((d) => {
        const l = d.leaves.find((x) => x.id === id);
        l.status = status; l.hrRemark = remark || '';
        if (status === 'approved' && l.type !== 'shift') {
          const b = d.leaveBalances.find((x) => x.userId === l.userId);
          const days = l.type === 'halfday' ? 0.5 : Math.round((new Date(l.end) - new Date(l.start)) / 86400000) + 1;
          if (b) b.used += days;
        }
      });
      toast(status === 'approved' ? 'Permohonan diluluskan.' : 'Permohonan ditolak.', status === 'approved' ? 'success' : 'danger');
    },

    sendChat(chatId, text) {
      mutate((d) => { const c = d.chats.find((x) => x.id === chatId); c.messages.push({ from: 'me', text, at: new Date().toISOString() }); c.unread = 0; });
    },
    readChat(chatId) { mutate((d) => { const c = d.chats.find((x) => x.id === chatId); c.unread = 0; }); },
  }), [mutate, toast]);

  const value = { db, user, role, toasts, toast, ...actions };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
