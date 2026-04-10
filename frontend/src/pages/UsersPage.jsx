import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const ROLE_LABELS = {
  admin:    { label: 'Administrator', color: '#7c3aed' },
  manager:  { label: 'Menedżer',      color: '#0891b2' },
  employee: { label: 'Pracownik',     color: '#2563eb' },
};

const UsersPage = () => {
  usePageTitle('Użytkownicy');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'employee' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
      } else {
        await api.post('/users', form);
      }
      handleCancel();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Błąd podczas usuwania');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pl-PL');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Użytkownicy</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditUser(null); }}>
            + Nowy użytkownik
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 480 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {editUser ? 'Edytuj użytkownika' : 'Nowy użytkownik'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Imię i nazwisko *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="Jan Kowalski" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="jan@firma.pl" />
            </div>
            <div className="form-group">
              <label>{editUser ? 'Nowe hasło (zostaw puste aby nie zmieniać)' : 'Hasło *'}</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required={!editUser}
                placeholder={editUser ? 'Zostaw puste aby nie zmieniać' : 'Min. 6 znaków'}
              />
            </div>
            <div className="form-group">
              <label>Rola</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="employee">Pracownik</option>
                <option value="manager">Menedżer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary">
                {editUser ? 'Zapisz zmiany' : 'Dodaj użytkownika'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>Anuluj</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Imię i nazwisko</th>
                <th>Email</th>
                <th>Rola</th>
                <th>2FA</th>
                <th>Data dodania</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>
                    {user.name}
                    {user.id === currentUser?.id && (
                      <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>(Ty)</span>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span style={{
                      color: ROLE_LABELS[user.role]?.color,
                      border: `1px solid ${ROLE_LABELS[user.role]?.color}`,
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {ROLE_LABELS[user.role]?.label}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: user.totp_enabled ? '#16a34a' : '#9ca3af',
                    }}>
                      {user.totp_enabled ? '✓ Włączone' : '✗ Wyłączone'}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 12px', fontSize: 13 }}
                        onClick={() => handleEdit(user)}
                      >
                        Edytuj
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 12px', fontSize: 13 }}
                          onClick={() => handleDelete(user.id)}
                        >
                          Usuń
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;