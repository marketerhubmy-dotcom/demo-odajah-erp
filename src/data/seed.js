// Penjana data DEMO. Semua nama, nombor telefon, alamat & angka adalah REKAAN.
import { SC, COURIERS, STATES, BANKS, MARKETPLACE_METHODS } from './constants.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86400000;
export const iso = (d) => new Date(d).toISOString();
export const ymd = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const USERS = [
  { id: 1, name: 'Aiman (Demo Admin)',     username: 'demo.admin',      role: 'admin',        team: 'HQ',       active: true },
  { id: 2, name: 'Nurul (Demo Sales)',     username: 'demo.sales',      role: 'sales',        team: 'TEAM A',   active: true },
  { id: 3, name: 'Hafiz (Demo Sales)',     username: 'demo.sales2',     role: 'sales',        team: 'TEAM A',   active: true },
  { id: 4, name: 'Sarah (Demo Agent)',     username: 'demo.agent',      role: 'sales',        team: 'AGENT',    active: true },
  { id: 5, name: 'Farah (Demo Akaun)',     username: 'demo.accounting', role: 'accounting',   team: 'HQ',       active: true },
  { id: 6, name: 'Zul (Demo Logistik)',    username: 'demo.logistik',   role: 'logistik',     team: 'HQ',       active: true },
  { id: 7, name: 'Liyana (Demo HR)',       username: 'demo.hr',         role: 'hr',           team: 'HQ',       active: true },
  { id: 8, name: 'Master (Demo)',          username: 'demo.master',     role: 'master_admin', team: 'HQ',       active: true },
  { id: 9, name: 'Irfan (Demo Sales)',     username: 'demo.sales3',     role: 'sales',        team: 'TEAM B',   active: true },
  { id: 10, name: 'Aina (Demo Agent)',     username: 'demo.agent2',     role: 'sales',        team: 'AGENT',    active: false },
];

// Pengguna yang dipakai untuk setiap role semasa Demo Login.
export const DEMO_LOGIN = { admin: 1, sales: 2, accounting: 5, logistik: 6, hr: 7, master_admin: 8 };

const FIRST = ['Ahmad', 'Siti', 'Mohd', 'Nur', 'Faizal', 'Aisyah', 'Rahim', 'Zarina', 'Kamal', 'Haslina', 'Azlan', 'Rosmah', 'Hakim', 'Wani', 'Syafiq', 'Mira', 'Danial', 'Huda', 'Imran', 'Laila'];
const LAST = ['Contoh', 'Rekaan', 'Demo', 'Sampel', 'Ujian'];
const TOWNS = { Johor: 'Batu Pahat', Kedah: 'Alor Setar', Kelantan: 'Kota Bharu', Melaka: 'Ayer Keroh', 'Negeri Sembilan': 'Seremban', Pahang: 'Kuantan', Perak: 'Ipoh', Perlis: 'Kangar', 'Pulau Pinang': 'Bukit Mertajam', Sabah: 'Kota Kinabalu', Sarawak: 'Kuching', Selangor: 'Shah Alam', Terengganu: 'Kuala Terengganu', 'W.P. Kuala Lumpur': 'Kuala Lumpur', 'W.P. Putrajaya': 'Putrajaya' };

export function seedData() {
  const r = rng(20261103);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const now = Date.now();

  const products = [
    { id: 1, name: 'Kopi Herba Pracampuran (20 sachet)', sku: 'DEMO-KOP-20', stock: 420, cost: 18, price: 59, weight: 0.5, active: true },
    { id: 2, name: 'Teh Detoks Herba (30 uncang)',       sku: 'DEMO-TEH-30', stock: 265, cost: 14, price: 49, weight: 0.3, active: true },
    { id: 3, name: 'Kapsul Multivitamin (60 biji)',      sku: 'DEMO-KAP-60', stock: 38,  cost: 25, price: 89, weight: 0.2, active: true },
    { id: 4, name: 'Minyak Urut Herba 50ml',             sku: 'DEMO-MNY-50', stock: 512, cost: 7,  price: 29, weight: 0.15, active: true },
    { id: 5, name: 'Serum Wajah Harian 30ml',            sku: 'DEMO-SRM-30', stock: 140, cost: 22, price: 79, weight: 0.1, active: true },
    { id: 6, name: 'Sabun Herba Semula Jadi',            sku: 'DEMO-SBN-01', stock: 0,   cost: 4,  price: 15, weight: 0.12, active: false },
  ];

  const freeGifts = [
    { id: 1, name: 'Pouch Kain DEMO', stock: 300, cost: 2.5, active: true },
    { id: 2, name: 'Sampel Serum 5ml', stock: 120, cost: 3, active: true },
    { id: 3, name: 'Botol Air 500ml', stock: 45, cost: 6, active: true },
  ];

  const promoPackages = [
    { id: 1, name: 'Combo 3 Kotak Kopi', productId: 1, quantity: 3, price: 150, giftId: 1, giftQty: 1, start: ymd(now - 20 * DAY), end: ymd(now + 25 * DAY), active: true },
    { id: 2, name: 'Pakej Detoks 2+1',   productId: 2, quantity: 3, price: 110, giftId: null, giftQty: 0, start: ymd(now - 40 * DAY), end: ymd(now + 10 * DAY), active: true },
    { id: 3, name: 'Serum Duo Raya',     productId: 5, quantity: 2, price: 139, giftId: 2, giftQty: 2, start: ymd(now - 120 * DAY), end: ymd(now - 60 * DAY), active: false },
  ];

  const salesIds = [2, 3, 4, 9];
  const orders = [];
  const N = 320;
  // Pool pelanggan rekaan supaya ada pelanggan berulang (repeat).
  const pool = Array.from({ length: 150 }, () => {
    const st = pick(STATES);
    return { name: `${pick(FIRST)} ${pick(LAST)}`, phone: `01${int(0, 9)}-000 ${String(int(0, 9999)).padStart(4, '0')}`, state: st, no: int(1, 99), jln: int(1, 20), pc: String(int(10000, 98999)) };
  });
  const seen = new Set();
  const ages = Array.from({ length: N }, () => Math.floor(Math.pow(r(), 1.6) * 300)).sort((x, y) => y - x);
  for (let i = 0; i < N; i++) {
    const daysAgo = ages[i];
    const created = now - daysAgo * DAY - int(0, 36000) * 1000;
    const platform = pick(['facebook', 'facebook', 'facebook', 'tiktok', 'tiktok', 'shopee', 'google', 'database']);
    const objective = pick(Object.keys(SC[platform]));
    const chans = SC[platform][objective];
    const channel = chans.length ? pick(chans) : '';
    let method;
    if (platform === 'shopee') method = pick(['shopee_paid', 'shopee_cod']);
    else if (platform === 'tiktok' && objective === 'PRODUCT SALE') method = pick(['tiktok_paid', 'tiktok_cod']);
    else method = pick(['cod', 'cod', 'cod', 'transfer', 'transfer']);

    const usePromo = r() < 0.3;
    const pkg = usePromo ? pick(promoPackages) : null;
    const product = pkg ? products.find((p) => p.id === pkg.productId) : pick(products.slice(0, 5));
    const qty = pkg ? pkg.quantity : int(1, 3);
    const price = pkg ? pkg.price : product.price * qty;
    const cust = pick(pool);
    const st = cust.state;
    const repeat = seen.has(cust.phone);
    seen.add(cust.phone);

    // Taburan status bergantung pada umur order.
    let status;
    if (daysAgo > 14) status = r() < 0.86 ? 'completed' : 'returned';
    else if (daysAgo > 5) status = pick(['completed', 'completed', 'shipped', 'shipped', 'returned', 'on_hold']);
    else status = pick(['pending', 'approved', 'approved', 'processing', 'shipped', 'pos_pada', 'on_hold']);
    if (status === 'pending' && method !== 'transfer') status = 'approved';

    const payStatus = method === 'transfer' ? (status === 'pending' ? 'pending' : 'approved') : 'approved';
    const courier = platform === 'shopee' ? 'Shopee' : pick(COURIERS);
    const shipped = ['shipped', 'completed', 'returned'].includes(status);
    const id = 1001 + i;

    orders.push({
      id,
      createdAt: iso(created),
      createdBy: pick(salesIds),
      customerName: cust.name,
      phone: cust.phone,
      address: `No. ${cust.no}, Jalan Contoh ${cust.jln}, Taman Demo`,
      postcode: cust.pc,
      city: TOWNS[st],
      state: st,
      productId: product.id,
      productName: product.name,
      quantity: qty,
      price,
      product2Id: null, product2Name: '', quantity2: 0,
      promoPackageId: pkg ? pkg.id : null,
      giftId: pkg?.giftId || null,
      giftQty: pkg?.giftQty || 0,
      platform, objective, channel,
      customerType: repeat ? 'existing' : pick(['new', 'new', 'prospect']),
      orderType: pkg ? 'promo' : 'biasa',
      payment: {
        method,
        status: payStatus,
        bank: method === 'transfer' ? pick(BANKS) : '',
        reference: method === 'transfer' ? `DEMO${int(100000, 999999)}` : '',
        paymentDate: method === 'transfer' ? ymd(created) : '',
        verifiedAt: method === 'transfer' && payStatus === 'approved' ? iso(created + 4 * 3600000) : null,
        verifiedBy: method === 'transfer' && payStatus === 'approved' ? 5 : null,
        rejectReason: '',
      },
      status,
      courier,
      tracking: shipped ? `DEMO${courier.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase()}${int(10000000, 99999999)}` : '',
      shippedAt: shipped ? iso(created + 1 * DAY) : null,
      deliveredAt: status === 'completed' ? iso(created + int(2, 5) * DAY) : null,
      posPadaDate: status === 'pos_pada' ? ymd(now + int(1, 10) * DAY) : '',
      onHoldRemark: status === 'on_hold' ? pick(['Alamat tidak lengkap', 'Pelanggan minta tangguh', 'Stok belum masuk']) : '',
      notes: '',
      remittanceId: null,
      history: [{ at: iso(created), by: 0, action: 'Order dicipta (data seed demo)' }],
    });
  }
  orders.sort((a, b) => b.id - a.id);

  // Pastikan beberapa bayaran transfer terkini masih menunggu pengesahan Accounting.
  orders.filter((o) => o.payment.method === 'transfer' && ['approved', 'processing'].includes(o.status)).slice(0, 5).forEach((o) => {
    o.status = 'pending'; o.payment.status = 'pending'; o.payment.verifiedAt = null; o.payment.verifiedBy = null;
  });

  // Remittance TikTok/Shopee untuk order marketplace yang sudah delivered > 14 hari.
  const remittances = [];
  const mkt = orders.filter((o) => MARKETPLACE_METHODS.includes(o.payment.method) && o.status === 'completed');
  for (let k = 0; k < 4; k++) {
    const batch = mkt.slice(k * 4, k * 4 + 4);
    if (!batch.length) break;
    const remId = 501 + k;
    batch.forEach((o) => { o.remittanceId = remId; });
    remittances.push({
      id: remId,
      platform: batch[0].platform === 'shopee' ? 'Shopee' : 'TikTok',
      transferDate: ymd(now - (k * 9 + 3) * DAY),
      total: batch.reduce((s, o) => s + o.price * 0.92, 0),
      reference: `REMDEMO${7000 + k}`,
      orderIds: batch.map((o) => o.id),
      status: k === 0 ? 'pending' : 'approved',
      createdBy: batch[0].createdBy,
    });
  }

  const prospects = Array.from({ length: 24 }, (_, i) => ({
    id: 301 + i,
    createdAt: iso(now - int(0, 30) * DAY),
    name: `${pick(FIRST)} ${pick(LAST)}`,
    phone: `01${int(0, 9)}-000 ${String(int(0, 9999)).padStart(4, '0')}`,
    state: pick(STATES),
    productId: pick(products.slice(0, 5)).id,
    source: pick(['Website', 'Facebook Lead', 'TikTok Lead', 'WhatsApp']),
    stage: pick(['Baru', 'Baru', 'FU 1', 'FU 2', 'FU 3', 'Closing']),
    assignedTo: r() < 0.8 ? pick(salesIds) : null,
    status: pick(['baru', 'baru', 'diproses', 'customer']),
  }));

  const leaves = [
    { id: 1, userId: 2, type: 'single',   start: ymd(now + 3 * DAY),  end: ymd(now + 3 * DAY),  shiftDate: '', reason: 'Urusan keluarga', status: 'pending',  hrRemark: '', createdAt: iso(now - 1 * DAY) },
    { id: 2, userId: 6, type: 'multiple', start: ymd(now + 10 * DAY), end: ymd(now + 12 * DAY), shiftDate: '', reason: 'Balik kampung',   status: 'pending',  hrRemark: '', createdAt: iso(now - 2 * DAY) },
    { id: 3, userId: 3, type: 'halfday',  start: ymd(now - 5 * DAY),  end: ymd(now - 5 * DAY),  shiftDate: '', reason: 'Temujanji klinik', status: 'approved', hrRemark: 'OK', createdAt: iso(now - 9 * DAY) },
    { id: 4, userId: 5, type: 'shift',    start: ymd(now + 6 * DAY),  end: ymd(now + 6 * DAY),  shiftDate: ymd(now - 3 * DAY), reason: 'Masuk kerja hari Sabtu (closing akaun)', status: 'pending', hrRemark: '', createdAt: iso(now - 3 * DAY) },
    { id: 5, userId: 9, type: 'single',   start: ymd(now - 15 * DAY), end: ymd(now - 15 * DAY), shiftDate: '', reason: 'Kenduri',          status: 'rejected', hrRemark: 'Bertembung kempen', createdAt: iso(now - 20 * DAY) },
  ];

  const leaveBalances = USERS.filter((u) => u.role !== 'master_admin').map((u) => ({ userId: u.id, allocated: 14, used: int(0, 8) }));

  const chats = [
    { id: 1, name: 'Pelanggan Demo A', phone: '011-000 1001', label: 'Prospek Panas', unread: 2, messages: [
      { from: 'them', text: 'Assalamualaikum, nak tanya harga combo kopi?', at: iso(now - 50 * 60000) },
      { from: 'me', text: 'Waalaikumussalam! Combo 3 kotak RM150 + free pouch 😊', at: iso(now - 45 * 60000) },
      { from: 'them', text: 'Boleh COD ke Shah Alam?', at: iso(now - 10 * 60000) },
    ] },
    { id: 2, name: 'Pelanggan Demo B', phone: '012-000 2002', label: 'Follow-up', unread: 0, messages: [
      { from: 'me', text: 'Hi, parcel dah sampai ya? 😊', at: iso(now - 26 * 3600000) },
      { from: 'them', text: 'Dah sampai, terima kasih!', at: iso(now - 25 * 3600000) },
    ] },
    { id: 3, name: 'Pelanggan Demo C', phone: '013-000 3003', label: 'Checkout', unread: 1, messages: [
      { from: 'them', text: 'Saya dah isi borang website tadi', at: iso(now - 3 * 3600000) },
    ] },
  ];
  const quickReplies = [
    { key: '/harga', text: 'Harga semasa: Kopi Herba RM59/kotak. Combo 3 kotak RM150 + free gift.' },
    { key: '/cod', text: 'Boleh COD seluruh Semenanjung, Sabah & Sarawak. Bayar bila barang sampai 😊' },
    { key: '/terima', text: 'Terima kasih! Order anda sedang diproses dan akan dihantar dalam 1-2 hari bekerja.' },
  ];

  return {
    version: 1,
    seededAt: iso(now),
    users: USERS.map((u) => ({ ...u })),
    products, freeGifts, promoPackages, orders, remittances, prospects, leaves, leaveBalances, chats, quickReplies,
    nextIds: { order: 1001 + N, product: 7, gift: 4, promo: 4, prospect: 325, leave: 6 },
  };
}
