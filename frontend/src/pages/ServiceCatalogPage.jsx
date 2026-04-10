import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const ServiceCatalogPage = () => {
  usePageTitle('Katalog usług');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', description: '', base_price: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/services/all').then(res => {
      setServices(res.data);
      setLoading(false);
    });
  }, []);

  const handleEdit = (svc) => {
    setEditingId(svc.id);
    setEditForm({ ...svc });
  };

  const handleSave = async () => {
    if (!editForm.name?.trim()) return setError('Nazwa jest wymagana');
    setSaving(true);
    setError('');
    try {
      const res = await api.put(`/services/${editingId}`, editForm);
      setServices(prev => prev.map(s => s.id === editingId ? res.data : s));
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name?.trim()) return setError('Nazwa jest wymagana');
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/services', addForm);
      setServices(prev => [...prev, res.data]);
      setAdding(false);
      setAddForm({ name: '', description: '', base_price: '', sort_order: 0 });
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd dodawania');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę usługę?')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Błąd usuwania');
    }
  };

  const toggleActive = async (svc) => {
    try {
      const res = await api.put(`/services/${svc.id}`, { ...svc, active: !svc.active });
      setServices(prev => prev.map(s => s.id === svc.id ? res.data : s));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Katalog usług</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setAdding(true); setError(''); }}>
            + Dodaj usługę
          </button>
        )}
      </div>

      {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

      {isAdmin && adding && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Nowa usługa</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Nazwa *</label>
              <input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="np. Detailing zewnętrzny" />
            </div>
            <div className="form-group">
              <label>Cena bazowa (PLN)</label>
              <input type="number" min="0" step="0.01" value={addForm.base_price} onChange={e => setAddForm(p => ({ ...p, base_price: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Opis</label>
              <textarea rows={2} value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} placeholder="Opcjonalny opis..." />
            </div>
            <div className="form-group">
              <label>Kolejność sortowania</label>
              <input type="number" min="0" value={addForm.sort_order} onChange={e => setAddForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Dodawanie...' : 'Dodaj'}</button>
            <button className="btn-secondary" onClick={() => { setAdding(false); setError(''); }}>Anuluj</button>
          </div>
        </div>
      )}

      <div className="card">
        {services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Brak usług w katalogu</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Opis</th>
                <th>Cena bazowa</th>
                <th>Kolejność</th>
                <th>Status</th>
                {isAdmin && <th>Akcje</th>}
              </tr>
            </thead>
            <tbody>
              {services.map(svc => (
                <tr key={svc.id}>
                  {isAdmin && editingId === svc.id ? (
                    <>
                      <td><input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></td>
                      <td><input value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} /></td>
                      <td><input type="number" min="0" step="0.01" value={editForm.base_price || ''} onChange={e => setEditForm(p => ({ ...p, base_price: e.target.value }))} style={{ width: 80 }} /></td>
                      <td><input type="number" min="0" value={editForm.sort_order || 0} onChange={e => setEditForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} style={{ width: 60 }} /></td>
                      <td>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                          <input type="checkbox" checked={editForm.active !== false} onChange={e => setEditForm(p => ({ ...p, active: e.target.checked }))} />
                          Aktywna
                        </label>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={handleSave} disabled={saving}>Zapisz</button>
                          <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => { setEditingId(null); setError(''); }}>Anuluj</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 500 }}>{svc.name}</td>
                      <td style={{ fontSize: 13, color: '#6b7280', maxWidth: 200 }}>{svc.description || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{svc.base_price ? `${parseFloat(svc.base_price).toFixed(2)} zł` : '—'}</td>
                      <td>{svc.sort_order}</td>
                      <td>
                        <span
                          onClick={() => isAdmin && toggleActive(svc)}
                          style={{
                            fontSize: 12, fontWeight: 600, borderRadius: 99, padding: '2px 8px',
                            cursor: isAdmin ? 'pointer' : 'default',
                            background: svc.active ? '#f0fdf4' : '#f9fafb',
                            color: svc.active ? '#16a34a' : '#9ca3af',
                            border: `1px solid ${svc.active ? '#16a34a' : '#e5e7eb'}`,
                          }}
                          title={isAdmin ? 'Kliknij aby zmienić' : ''}
                        >
                          {svc.active ? 'Aktywna' : 'Nieaktywna'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => { handleEdit(svc); setError(''); }}>Edytuj</button>
                            <button className="btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleDelete(svc.id)}>Usuń</button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ServiceCatalogPage;
