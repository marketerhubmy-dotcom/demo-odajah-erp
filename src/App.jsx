import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store.jsx';
import Layout, { DemoBanner } from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard, { LogistikDashboard, HRDashboard } from './pages/Dashboards.jsx';
import Orders from './pages/Orders.jsx';
import CreateOrder from './pages/CreateOrder.jsx';
import { VerifyPayment, VerifiedPayments, Remittances, Cogs } from './pages/Accounting.jsx';
import LogistikTab, { SearchOrder, StockTake } from './pages/Logistik.jsx';
import { Products, FreeGifts, Promos } from './pages/Catalog.jsx';
import { Attendance, ProcessLeaves, LeaveBalances, Performance, PayslipList, Users, MyLeaves } from './pages/HR.jsx';
import { MasterSummary, PnlSaya, Prospects, WhatsApp, About } from './pages/Misc.jsx';

// Akses route ikut role (mencerminkan sidebar). master_admin hanya Summary + Tentang.
const ACCESS = {
  '/orders': ['admin', 'sales'], '/orders/new': ['admin', 'sales'], '/prospects': ['admin', 'sales'],
  '/accounting': ['admin', 'accounting'], '/logistik': ['admin', 'logistik'],
  '/products': ['admin', 'logistik'], '/free-gifts': ['admin', 'logistik'], '/promo': ['admin'],
  '/users': ['admin', 'hr'], '/whatsapp': ['admin', 'sales'], '/hr': ['admin', 'hr'], '/payroll': ['admin', 'sales', 'accounting', 'logistik', 'hr'],
  '/pnl': ['sales'], '/master': ['admin', 'master_admin'], '/cuti': ['admin', 'sales', 'accounting', 'logistik', 'hr'], '/shift': ['admin', 'sales', 'accounting', 'logistik', 'hr'],
  '/dashboard': ['admin', 'sales', 'accounting', 'logistik', 'hr'],
};

function Guard({ path, children }) {
  const { role } = useStore();
  const key = Object.keys(ACCESS).filter((k) => path.startsWith(k)).sort((a, b) => b.length - a.length)[0];
  if (key && !ACCESS[key].includes(role)) {
    return (
      <div className="card"><div className="card-body text-center py-5">
        <i className="bi bi-lock fs-1 text-muted" />
        <h5 className="mt-2">Tiada akses untuk role ini</h5>
        <p className="text-muted small">Dalam ODAJAH, setiap role hanya nampak menu yang berkaitan. Tukar role di bahagian atas untuk melihat halaman ini.</p>
      </div></div>
    );
  }
  return children;
}

const r = (path, el) => <Route key={path} path={path} element={<Guard path={path}>{el}</Guard>} />;

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`alert alert-${t.variant} shadow-sm py-2 px-3 mb-0 small`}><i className={`bi ${t.variant === 'danger' ? 'bi-x-circle' : t.variant === 'info' ? 'bi-info-circle' : 'bi-check-circle'} me-2`} />{t.text}</div>
      ))}
    </div>
  );
}

export default function App() {
  const { user, role } = useStore();
  return (
    <>
      <DemoBanner />
      <Toasts />
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            {r('/dashboard', <Dashboard />)}
            {r('/orders', <Orders />)}
            {r('/orders/new', <CreateOrder />)}
            {r('/prospects', <Prospects />)}
            {r('/accounting/verify', <VerifyPayment />)}
            {r('/accounting/verified', <VerifiedPayments />)}
            {r('/accounting/remittance', <Remittances />)}
            {r('/accounting/cogs', <Cogs />)}
            {r('/logistik', <LogistikDashboard />)}
            {r('/logistik/search', <SearchOrder />)}
            {r('/logistik/stock', <StockTake />)}
            {r('/logistik/:tab', <LogistikTab />)}
            {r('/products', <Products />)}
            {r('/free-gifts', <FreeGifts />)}
            {r('/promo', <Promos />)}
            {r('/users', <Users />)}
            {r('/whatsapp', <WhatsApp />)}
            {r('/hr', <HRDashboard />)}
            {r('/hr/attendance', <Attendance />)}
            {r('/hr/leaves', <ProcessLeaves />)}
            {r('/hr/balances', <LeaveBalances />)}
            {r('/hr/performance', <Performance />)}
            {r('/payroll/slips', <PayslipList />)}
            {r('/pnl', <PnlSaya />)}
            {r('/master/summary', <MasterSummary />)}
            {r('/cuti', <MyLeaves />)}
            {r('/shift', <MyLeaves shiftOnly />)}
            <Route path="/tentang" element={<About />} />
            <Route path="*" element={<Navigate to={role === 'master_admin' ? '/master/summary' : '/dashboard'} replace />} />
          </Routes>
        </Layout>
      )}
    </>
  );
}
