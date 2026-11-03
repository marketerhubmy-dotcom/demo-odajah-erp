// Taksonomi & enum dicerminkan daripada ODAJAH sebenar (nilai sahaja — tiada data pelanggan).

export const ROLES = {
  admin:        { label: 'Admin',        badge: 'bg-danger text-white',  icon: 'bi-shield-lock',     desc: 'Akses penuh: order, payment, logistik, produk, pengguna.' },
  sales:        { label: 'Sales',        badge: 'bg-success text-white', icon: 'bi-cart3',           desc: 'Buat order, pantau dashboard jualan & prospek sendiri.' },
  accounting:   { label: 'Accounting',   badge: 'bg-primary text-white', icon: 'bi-cash-coin',       desc: 'Sahkan bayaran transfer & remittance TikTok/Shopee.' },
  logistik:     { label: 'Logistik',     badge: 'bg-info text-white',    icon: 'bi-truck',           desc: 'Proses, tahan & hantar order; pantau status penghantaran.' },
  hr:           { label: 'HR',           badge: 'bg-warning text-dark',  icon: 'bi-person-badge',    desc: 'Cuti, shift, kehadiran, prestasi & slip gaji staf.' },
  master_admin: { label: 'Master Admin', badge: 'bg-dark text-white',    icon: 'bi-graph-up-arrow',  desc: 'Paparan baca-sahaja: Summary Prestasi Admin.' },
};

export const PLATFORMS = {
  facebook: 'Facebook', tiktok: 'TikTok', shopee: 'Shopee', google: 'Google', database: 'Database',
};

const CH6 = ['WEBSITE AUTO', 'WHATSAPP MANUAL', 'WHATSAPP BOT', 'CALL', 'BROADCAST', 'BROADCAST CALL'];
const CHT = ['WHATSAPP MANUAL', 'WHATSAPP BOT', 'MESSENGER BOT', 'CALL', 'BROADCAST', 'BROADCAST CALL'];
const CHL = ['WHATSAPP MANUAL', 'CALL', 'BROADCAST', 'BROADCAST CALL'];

export const SC = {
  facebook: { AWARENESS: [], TRAFIK: CHT, ENGAGEMENT: CHT, 'LEAD GEN': CHL, CONVERSION: CH6 },
  tiktok: {
    REACH: [], TRAFIK: CHT, 'VIDEO VIEW': [], 'COMMUNITY INTERACTION': [], 'LEAD GEN': CHL, CONVERSION: CH6,
    'PRODUCT SALE': ['VIDEO SHOPPING ADS (VSA)', 'LIVE SHOPPING ADS (LSA)', 'PRODUCT SHOPPING ADS (PSA)'],
  },
  shopee: { 'PROMOTE PRODUCT': [], 'PROMOTE SHOP': [], 'PROMOTE LIVE': [] },
  google: { 'SEARCH ADS': CH6, 'PERFORMANCE MAX': CH6, 'DEMAND GEN': CH6, DISPLAY: CH6, VIDEO: CH6 },
  database: { DATABASE: ['WHATSAPP MANUAL', 'CALL', 'BROADCAST', 'BROADCAST CALL', 'GROUP VIP'] },
};

export const CUSTOMER_TYPES = { new: 'New Customer', existing: 'Existing Customer', prospect: 'Existing Prospect' };
export const ORDER_TYPES = { biasa: 'Order Biasa', promo: 'Promo' };

export const PAYMENT_METHODS = {
  cod: 'COD',
  transfer: 'Online Transfer',
  tiktok_paid: 'TikTok (Paid)',
  tiktok_cod: 'TikTok COD',
  shopee_paid: 'Shopee (Paid)',
  shopee_cod: 'Shopee COD',
};
export const MARKETPLACE_METHODS = ['tiktok_paid', 'tiktok_cod', 'shopee_paid', 'shopee_cod'];

export const COURIERS = ['Ninjavan', 'J&T', 'Pos Laju'];

export const BANKS = ['Maybank', 'CIMB', 'Bank Islam', 'RHB', 'Public Bank', 'BSN'];

export const STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
  'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Putrajaya',
];

// Aliran status sebenar: pending → approved → processing → shipped → completed (+ pos_pada, on_hold, returned)
export const STATUS = {
  pending:    { label: 'Pending',    cls: 'bg-warning text-dark', color: '#ffc107' },
  pos_pada:   { label: 'Pos Pada',   cls: 'bg-purple text-white', color: '#6f42c1' },
  approved:   { label: 'Approved',   cls: 'bg-primary',           color: '#4361ee' },
  processing: { label: 'Processing', cls: 'bg-info text-dark',    color: '#0dcaf0' },
  on_hold:    { label: 'On Hold',    cls: 'bg-orange text-white', color: '#fd7e14' },
  shipped:    { label: 'Delivering', cls: 'bg-secondary',         color: '#6c757d' },
  completed:  { label: 'Delivered',  cls: 'bg-success',           color: '#198754' },
  returned:   { label: 'Returned',   cls: 'bg-danger',            color: '#dc3545' },
};
export const FLOW = ['pending', 'approved', 'processing', 'shipped', 'completed'];

export const LEAVE_TYPES = {
  single: 'Sehari (Single Day)',
  halfday: 'Separuh Hari (Half Day)',
  multiple: 'Berbilang Hari (Multiple Days)',
  shift: 'Cuti Ganti Shift',
};

export const PROSPECT_STAGES = ['Baru', 'FU 1', 'FU 2', 'FU 3', 'Closing'];
