export const rm = (n) => 'RM ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const rm0 = (n) => 'RM ' + Math.round(n || 0).toLocaleString('en-MY');
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const today = () => {
  const x = new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const inRange = (iso, from, to) => {
  if (!iso) return false;
  const d = iso.slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
};
export const MONTHS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

// Kutipan: COD dikira bila delivered, Transfer bila disahkan, Marketplace bila remittance disahkan.
export function collectionDate(o, remittances) {
  const m = o.payment.method;
  if (m === 'cod') return o.status === 'completed' ? o.deliveredAt : null;
  if (m === 'transfer') return o.payment.status === 'approved' ? o.payment.verifiedAt : null;
  const r = remittances.find((x) => x.id === o.remittanceId);
  return r && r.status === 'approved' ? r.transferDate + 'T00:00:00' : null;
}
