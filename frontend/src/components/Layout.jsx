import { useAuth } from '../context/AuthContext.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import NotificationBell from './NotificationBell.jsx';
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',    icon: '▦' },
  { to: '/schedule',  label: 'Harmonogram',  icon: '◷' },
  { to: '/orders',    label: 'Zlecenia',     icon: '◈' },
  { to: '/clients',   label: 'Klienci',      icon: '◉' },
  { to: '/vehicles',  label: 'Pojazdy',      icon: '◎' },
];

const ADMIN_ITEMS = [
  { to: '/inquiries', label: 'Zgłoszenia www', icon: '◉' },
  { to: '/reports',  label: 'Raporty',        icon: '◻' },
  { to: '/emails',   label: 'Maile',          icon: '◫' },
  { to: '/services', label: 'Katalog usług',  icon: '◧' },
  { to: '/users',    label: 'Użytkownicy',    icon: '◑', adminOnly: true },
  { to: '/logs',     label: 'Logi systemu',   icon: '◈', adminOnly: true },
];

const NavItem = ({ to, label, icon, colors, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 14px',
      borderRadius: 8,
      color: isActive ? 'white' : colors.text,
      background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
      textDecoration: 'none',
      marginBottom: 2,
      fontWeight: isActive ? 600 : 400,
      fontSize: 14,
      transition: 'all 0.15s ease',
      backdropFilter: isActive ? 'blur(4px)' : 'none',
      boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
    })}
    onMouseEnter={e => {
      if (!e.currentTarget.style.background.includes('0.15')) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
      }
    }}
    onMouseLeave={e => {
      if (!e.currentTarget.style.background.includes('0.15')) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <span style={{ fontSize: 15, opacity: 0.9, flexShrink: 0 }}>{icon}</span>
    {label}
  </NavLink>
);

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isPrivileged = isAdmin || isManager;

  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Zamknij sidebar przy zmianie strony na mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Blokuj scroll body gdy sidebar otwarty na mobile
  useEffect(() => {
    document.body.style.overflow = (isMobile && sidebarOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const colors = dark
    ? { text: '#8b949e', divider: 'rgba(255,255,255,0.07)', subtext: '#484f58' }
    : { text: 'rgba(255,255,255,0.65)', divider: 'rgba(255,255,255,0.1)', subtext: 'rgba(255,255,255,0.4)' };

  const sidebarBg = dark
    ? 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)'
    : 'linear-gradient(180deg, #1e1b4b 0%, #2d2a6e 50%, #1e1b4b 100%)';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarStyle = isMobile ? {
    position: 'fixed',
    top: 0,
    left: sidebarOpen ? 0 : -228,
    bottom: 0,
    width: 228,
    zIndex: 1000,
    transition: 'left 0.25s ease',
    background: sidebarBg,
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${dark ? '#30363d' : 'rgba(255,255,255,0.08)'}`,
  } : {
    width: 228,
    background: sidebarBg,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'relative',
    borderRight: `1px solid ${dark ? '#30363d' : 'rgba(255,255,255,0.08)'}`,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Overlay mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${colors.divider}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
              boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
            }}>
              ◈
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white', letterSpacing: '-0.01em' }}>
                Auto Detailing
              </div>
              <div style={{ fontSize: 11, color: colors.subtext, marginTop: 1 }}>
                CRM System
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 12px 0' }}>
          <GlobalSearch />
        </div>

        {/* Profil */}
        <div style={{
          margin: '10px 10px 0',
          padding: '10px 12px',
          borderRadius: 9,
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${colors.divider}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 99, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'white',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: colors.subtext }}>
              {isAdmin ? 'Administrator' : isManager ? 'Menedżer' : 'Pracownik'}
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: colors.subtext,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '4px 6px 8px',
          }}>
            Menu
          </div>
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} {...item} colors={colors} onClick={isMobile ? closeSidebar : undefined} />
          ))}

          {isPrivileged && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, color: colors.subtext,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '16px 6px 8px',
                borderTop: `1px solid ${colors.divider}`,
                marginTop: 10,
              }}>
                Administracja
              </div>
              {ADMIN_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => (
                <NavItem key={item.to} {...item} colors={colors} onClick={isMobile ? closeSidebar : undefined} />
              ))}
            </>
          )}

          <div style={{ borderTop: `1px solid ${colors.divider}`, marginTop: 10, paddingTop: 10 }}>
            <NavItem to="/settings" label="Ustawienia" icon="◬" colors={colors} onClick={isMobile ? closeSidebar : undefined} />
          </div>
        </nav>

        {/* Actions */}
        <div style={{ padding: '12px 14px 18px', borderTop: `1px solid ${colors.divider}` }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setDark(!dark)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${colors.divider}`,
                color: colors.text,
                borderRadius: 7,
                padding: '7px 10px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              {dark ? '☀ Jasny' : '☾ Ciemny'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.25)',
                color: '#f87171',
                borderRadius: 7,
                padding: '7px 10px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.15)'}
            >
              Wyloguj
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px' : '32px 36px',
        overflow: 'auto',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        {/* Topbar mobile */}
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: `1px solid ${dark ? '#30363d' : '#e5e7eb'}`,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 22,
                color: dark ? '#8b949e' : '#374151',
                padding: '4px 8px',
                borderRadius: 6,
                lineHeight: 1,
              }}
              aria-label="Otwórz menu"
            >
              ☰
            </button>
            <div style={{ fontWeight: 700, fontSize: 14, color: dark ? 'white' : '#1f2937' }}>
              Auto Detailing <span style={{ color: '#6366f1' }}>CRM</span>
            </div>
            <div style={{ width: 40 }} />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
