import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const TYPE_ICONS = {
  overdue: '🔴',
  today: '🟡',
  ready: '🟢',
  tomorrow: '🔵',
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (notification) => {
    navigate(`/orders/${notification.orderId}`);
    setOpen(false);
  };

  const grouped = {
    overdue: notifications.filter(n => n.type === 'overdue'),
    today: notifications.filter(n => n.type === 'today'),
    ready: notifications.filter(n => n.type === 'ready'),
    tomorrow: notifications.filter(n => n.type === 'tomorrow'),
  };

  const groupLabels = {
    overdue: 'Przeterminowane',
    today: 'Na dziś',
    ready: 'Gotowe do wydania',
    tomorrow: 'Jutro',
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: 6,
          position: 'relative',
          color: '#94a3b8',
          fontSize: 20,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Powiadomienia"
      >
        🔔
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: notifications.some(n => n.type === 'overdue') ? '#ef4444' : '#d97706',
            color: 'white',
            borderRadius: 99,
            minWidth: 16,
            height: 16,
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          }}>
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: '100%',
          top: 0,
          marginLeft: 8,
          width: 340,
          background: 'white',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden',
          maxHeight: 480,
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>
              Powiadomienia
            </span>
            <button
              onClick={fetchNotifications}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: '#6b7280',
                padding: '2px 6px',
              }}
            >
              {loading ? '...' : 'Odśwież'}
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{
              padding: 32,
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: 13,
            }}>
              Brak powiadomień
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => {
              if (items.length === 0) return null;
              const first = items[0];
              return (
                <div key={type}>
                  <div style={{
                    padding: '8px 16px',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: first.color,
                    background: '#f9fafb',
                    borderBottom: '1px solid #f3f4f6',
                  }}>
                    {TYPE_ICONS[type]} {groupLabels[type]} ({items.length})
                  </div>
                  {items.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        borderLeft: `3px solid ${n.color}`,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: 500, fontSize: 13, color: '#111' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {n.sub}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;