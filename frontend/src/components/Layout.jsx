import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GlobalSearch from './GlobalSearch.jsx';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '220px',
        background: '#1e293b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Auto Detailing</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>CRM System</div>
        </div>

        <div style={{ padding: '16px 12px', borderBottom: '1px solid #334155' }}>
          <GlobalSearch />
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {[
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/schedule', label: 'Harmonogram' },
            { to: '/orders', label: 'Zlecenia' },
            { to: '/clients', label: 'Klienci' },
            { to: '/vehicles', label: 'Pojazdy' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'block',
              padding: '10px 12px',
              borderRadius: 6,
              color: isActive ? 'white' : '#94a3b8',
              background: isActive ? '#2563eb' : 'transparent',
              textDecoration: 'none',
              marginBottom: 4,
              fontWeight: isActive ? 600 : 400,
            })}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{user?.name}</div>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%' }}>
            Wyloguj
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;