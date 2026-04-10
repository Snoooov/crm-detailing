import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import Pagination from '../../components/Pagination.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import useDarkMode from '../../hooks/useDarkMode.js';

const STATUS_LABELS = {
  vip:     { label: 'VIP',    color: '#7c3aed', bg: '#f5f3ff' },
  regular: { label: 'Stały',  color: '#2563eb', bg: '#eff6ff' },
  normal:  { label: 'Zwykły', color: '#6b7280', bg: '#f9fafb' },
};

const STATUS_LABELS_DARK = {
  vip:     { label: 'VIP',    color: '#a78bfa', bg: '#1e1535' },
  regular: { label: 'Stały',  color: '#60a5fa', bg: '#1e3a5f' },
  normal:  { label: 'Zwykły', color: '#94a3b8', bg: '#1e293b' },
};

const StatusBadge = ({ status, isDark }) => {
  const map = isDark ? STATUS_LABELS_DARK : STATUS_LABELS;
  const s = map[status] || map.normal;
  return (
    <span style={{
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.color}30`,
      borderRadius: 99,
      padding: '2px 10px',
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
};

const ClientCard = ({ client, navigate, showNip, isDark }) => (
  <div
    onClick={() => navigate(`/clients/${client.id}`)}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      borderRadius: 10,
      border: `1px solid ${isDark ? '#30363d' : '#e2e8f0'}`,
      background: isDark ? '#1c2333' : '#fafafa',
      cursor: 'pointer',
      gap: 12,
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = isDark ? '#7c3aed80' : '#7c3aed40';
      e.currentTarget.style.background = isDark ? '#1e1535' : '#f5f3ff';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = isDark ? '#30363d' : '#e2e8f0';
      e.currentTarget.style.background = isDark ? '#1c2333' : '#fafafa';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: isDark ? '#1e1535' : '#f5f3ff',
        border: `1px solid ${isDark ? '#3d2b6b' : '#ddd6fe'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        fontWeight: 700,
        color: isDark ? '#a78bfa' : '#7c3aed',
        flexShrink: 0,
        letterSpacing: '-0.5px',
      }}>
        {client.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: isDark ? '#e6edf3' : '#0f172a', marginBottom: 2 }}>
          {client.full_name}
        </div>
        <div style={{ fontSize: 12, color: isDark ? '#8b949e' : '#6b7280', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {client.phone && <span>{client.phone}</span>}
          {client.email && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{client.email}</span>}
          {showNip && client.nip && <span>NIP: {client.nip}</span>}
        </div>
      </div>
    </div>
    <StatusBadge status={client.status} isDark={isDark} />
  </div>
);

const SectionHeader = ({ label, count, isDark }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: isDark ? '#484f58' : '#94a3b8',
    }}>
      {label}
    </span>
    <span style={{
      background: isDark ? '#1e293b' : '#f1f5f9',
      color: isDark ? '#64748b' : '#64748b',
      border: `1px solid ${isDark ? '#30363d' : '#e2e8f0'}`,
      borderRadius: 99,
      padding: '1px 8px',
      fontSize: 11,
      fontWeight: 700,
    }}>
      {count}
    </span>
    <div style={{ flex: 1, height: 1, background: isDark ? '#21262d' : '#e2e8f0' }} />
  </div>
);

const ClientsPage = () => {
  usePageTitle('Klienci');
  const isDark = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

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
  const paginatedIndividuals = individuals.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const paginatedCompanies = companies.slice(0, PER_PAGE);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.3px' }}>Klienci</h1>
          {!loading && (
            <div style={{ fontSize: 13, color: isDark ? '#8b949e' : '#6b7280', marginTop: 2 }}>
              {clients.length} {clients.length === 1 ? 'klient' : clients.length < 5 ? 'klientów' : 'klientów'} łącznie
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Anuluj' : '+ Nowy klient'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 640 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Nowy klient</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
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
                <label>NIP <span style={{ color: isDark ? '#484f58' : '#94a3b8', fontWeight: 400 }}>(dla firm)</span></label>
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

      {/* Main card */}
      <div className="card">
        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="🔍  Szukaj po nazwie, telefonie, emailu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 14 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: isDark ? '#484f58' : '#94a3b8' }}>
            Ładowanie...
          </div>
        ) : clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: isDark ? '#484f58' : '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Brak klientów</div>
            <div style={{ fontSize: 13 }}>Dodaj pierwszego klienta klikając przycisk powyżej</div>
          </div>
        ) : (
          <>
            {/* Osoby prywatne */}
            <SectionHeader label="Osoby prywatne" count={individuals.length} isDark={isDark} />
            {individuals.length === 0 ? (
              <div style={{ fontSize: 13, color: isDark ? '#484f58' : '#94a3b8', padding: '8px 0 16px' }}>Brak osób prywatnych</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {paginatedIndividuals.map(client => (
                  <ClientCard key={client.id} client={client} navigate={navigate} isDark={isDark} />
                ))}
              </div>
            )}
            {individuals.length > PER_PAGE && (
              <div style={{ marginBottom: 24 }}>
                <Pagination
                  total={individuals.length}
                  perPage={PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {/* Firmy */}
            <SectionHeader label="Firmy" count={companies.length} isDark={isDark} />
            {companies.length === 0 ? (
              <div style={{ fontSize: 13, color: isDark ? '#484f58' : '#94a3b8', padding: '8px 0' }}>Brak firm</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {paginatedCompanies.map(client => (
                  <ClientCard key={client.id} client={client} navigate={navigate} showNip isDark={isDark} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
