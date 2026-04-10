import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import Pagination from '../../components/Pagination.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const STATUS_LABELS = {
  vip: { label: 'VIP', color: '#7c3aed' },
  regular: { label: 'Stały', color: '#2563eb' },
  normal: { label: 'Zwykły', color: '#6b7280' },
};

const ClientsTable = ({ clients, navigate, showNip = false }) => (
  
  clients.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>Brak klientów</div>
  ) : (
    <table>
      <thead>
        <tr>
          <th>Imię i nazwisko / Firma</th>
          <th>Telefon</th>
          <th>Email</th>
          {showNip && <th>NIP</th>}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {clients.map(client => (
          <tr
            key={client.id}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <td style={{ fontWeight: 500 }}>{client.full_name}</td>
            <td>{client.phone || '—'}</td>
            <td>{client.email || '—'}</td>
            {showNip && <td>{client.nip || '—'}</td>}
            <td>
              <span style={{
                color: STATUS_LABELS[client.status]?.color,
                border: `1px solid ${STATUS_LABELS[client.status]?.color}`,
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {STATUS_LABELS[client.status]?.label}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
);

const ClientsPage = () => {
  usePageTitle('Klienci');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 15;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', nip: '', status: 'normal' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchClients = async (q = '') => {
    try {
      const res = await api.get('/clients', { params: q ? { search: q } : {} });
      setClients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  useEffect(() => {
  const timeout = setTimeout(() => {
    fetchClients(search);
    setCurrentPage(1);
  }, 300);
  return () => clearTimeout(timeout);
}, [search]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/clients', form);
      setForm({ full_name: '', phone: '', email: '', nip: '', status: 'normal' });
      setShowForm(false);
      fetchClients();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const individuals = clients.filter(c => !c.nip);
  const companies = clients.filter(c => c.nip);
  const paginatedIndividuals = individuals.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const paginatedCompanies = companies.slice(0, PER_PAGE);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Klienci</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Anuluj' : '+ Nowy klient'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 640 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Nowy klient</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Imię i nazwisko / Nazwa firmy *</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Jan Kowalski" />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="500 100 200" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="jan@example.pl" />
              </div>
              <div className="form-group">
                <label>NIP <span style={{ color: '#6b7280', fontWeight: 400 }}>(wypełnij dla firm)</span></label>
                <input name="nip" value={form.nip} onChange={handleChange} placeholder="Opcjonalnie" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="normal">Zwykły</option>
                  <option value="regular">Stały</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>
            {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary">Zapisz klienta</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Anuluj</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Szukaj po nazwie, telefonie, emailu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
        ) : (
          <>
            {/* Sekcja — osoby prywatne */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6b7280',
              }}>
                Osoby prywatne
              </div>
              <div style={{
                background: '#f3f4f6',
                color: '#6b7280',
                borderRadius: 99,
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {individuals.length}
              </div>
            </div>
            <Pagination
              total={individuals.length}
              perPage={PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
            <ClientsTable clients={paginatedIndividuals} navigate={navigate}  />
              
            {/* Separator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '24px 0 12px',
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6b7280',
              }}>
                Firmy
              </div>
              <div style={{
                background: '#f3f4f6',
                color: '#6b7280',
                borderRadius: 99,
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {companies.length}
              </div>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>
            <Pagination
              total={companies.length}
              perPage={PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
            <ClientsTable clients={paginatedCompanies} navigate={navigate} showNip={true}/>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;