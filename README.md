# ODAJAH ERP — Versi DEMO

Demo interaktif sistem pengurusan order & operasi **ODAJAH**, untuk portfolio **MHM Web Studio**.

> ⚠️ **Ini bukan sistem production.** Aplikasi statik (React + Vite) tanpa backend, API, database,
> authentication atau storage luar. **Semua data adalah rekaan** dan disimpan dalam `localStorage`
> browser pelawat sahaja. Butang **Reset Demo** memulihkan data contoh asal.

## Ciri

- **Demo Login satu klik** — 6 role: Admin, Sales, Accounting, Logistik, HR, Master Admin (baca-sahaja); tukar role bila-bila masa dari topbar.
- **Aliran order penuh** — Sales buat order → Accounting sahkan transfer → Logistik proses (waybill) → Ship → Delivered / Returned, dengan audit log per order.
- Dashboard & carta (Chart.js), Pos Pada, On Hold, Stock Take, Produk / Free Gift / Pakej Promo, Prospect,
  Cuti / Apply Shift / Process Leaves / Baki Cuti, Kehadiran, Prestasi, Slip Gaji, P&L ringkas, WhatsApp Team (mockup), Summary Prestasi Admin.
- Responsif desktop & mobile (sidebar hamburger), mod gelap.
- Halaman **Tentang Demo** menyenaraikan apa yang interaktif, disimulasi atau dipermudah.

Ciri yang **tiada** dalam ODAJAH sebenar (Purchase Order, Supplier, Invoice/e-Invoice, Quotation, multi-gudang) sengaja tidak dipaparkan.

## Pembangunan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output ke dist/
npm run preview
```

Node 20+.

## Deploy ke Cloudflare Pages

Workers & Pages → Create → Pages → Connect to Git → pilih repo `demo-odajah-erp`:

| Tetapan | Nilai |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(kosong)* |
| Environment variable | `NODE_VERSION` = `20` |

Tiada environment variable / secret lain diperlukan. `public/_redirects` mengendalikan routing SPA,
`public/_headers` menetapkan `noindex` dan header keselamatan asas.

## Struktur

```
src/
  data/constants.js   taksonomi Platform/Objective/Channel, status, kaedah bayaran
  data/seed.js        penjana data rekaan (deterministik)
  store.jsx           state + localStorage + tindakan workflow
  nav.js              menu sidebar per role
  components/         Layout, UI (StatCard, Modal, ChartBox, OrderDetail)
  pages/              Dashboards, Orders, CreateOrder, Accounting, Logistik, Catalog, HR, Misc
```

## Privasi & keselamatan

- Tiada `fetch`/XHR ke mana-mana pelayan; tiada API key atau secret.
- Tiada data pelanggan, pekerja, transaksi, logo atau aset sebenar daripada sistem production.
- Nama staf demo bertanda "(Demo …)"; nombor telefon berformat `01X-000 XXXX`.
