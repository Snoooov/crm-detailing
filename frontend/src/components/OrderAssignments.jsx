import { useState, useEffect } from 'react';
import api from '../api/axios.js';

const ROLE_LABELS = {
  admin: { label: 'Admin', color: '#7c3aed' },
  employee: { label: 'Pracownik', color: '#2563eb' },
};

const OrderAssignments = ({ orderId }) => {
  const [assigned, setAssigned] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/assignments/orders/${orderId}`),
      api.get('/users'),
    ]).then(([assignedRes, usersRes]) => {
      setAssigned(assignedRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    });
  }, [orderId]);

  const availableUsers = users.filter(
    u => !assigned.find(a => a.id === u.id)
  );

  const handleAdd = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.post(`/assignments/orders/${orderId}`, {
        user_id: parseInt(selectedUser),
      });
      setAssigned(res.data);
      setSelectedUser('');
      setAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await api.delete(`/assignments/orders/${orderId}/users/${userId}`);
      setAssigned(prev => prev.filter(a => a.id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          Przypisani pracownicy
          {assigned.length > 0 && (
            <span style={{
              background: '#f3f4f6',
              color: '#6b7280',
              borderRadius: 99,
              padding: '1px 8px',
              fontSize: 12,
              fontWeight: 600,
              marginLeft: 8,
            }}>
              {assigned.length}
            </span>
          )}
        </div>
        {!adding && availableUsers.length > 0 && (
          <button
            className="btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setAdding(true)}
          >
            + Przypisz
          </button>
        )}
      </div>

      {/* Lista przypisanych */}
      {assigned.length === 0 && !adding ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          Brak przypisanych pracowników
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: adding ? 12 : 0 }}>
          {assigned.map(user => (
            <div key={user.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: '8px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 99,
                  background: '#2563eb',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{user.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11,
                  color: ROLE_LABELS[user.role]?.color,
                  border: `1px solid ${ROLE_LABELS[user.role]?.color}`,
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontWeight: 600,
                }}>
                  {ROLE_LABELS[user.role]?.label}
                </span>
                <button
                  onClick={() => handleRemove(user.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: 18,
                    lineHeight: 1,
                    padding: '0 4px',
                  }}
                  title="Usuń przypisanie"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formularz dodawania */}
      {adding && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Wybierz pracownika...</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role === 'admin' ? 'Admin' : 'Pracownik'})
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={!selectedUser}
            style={{ whiteSpace: 'nowrap' }}
          >
            Przypisz
          </button>
          <button
            className="btn-secondary"
            onClick={() => { setAdding(false); setSelectedUser(''); }}
          >
            Anuluj
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderAssignments;