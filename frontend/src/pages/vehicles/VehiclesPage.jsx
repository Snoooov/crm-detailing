import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import Pagination from '../../components/Pagination.jsx';
import { useState, useEffect, useRef } from 'react';

const ClientSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res = await api.get('/clients', { params: { search: query } });
      setResults(res.data);
      setOpen(true);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); if (!e.target.value) onSelect(null); }}
        placeholder="Wpisz imię, nazwisko lub telefon..."
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 200, overflowY: 'auto',
        }}>
          {results.map(c => (
            <div
              key={c.id}
              onClick={() => { setQuery(c.full_name); setOpen(false); onSelect(c); }}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{c.phone || c.email || ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VehiclesPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 20;

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_id: '', brand: '', model: '', year: '', color: '', vin: '', plate_number: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchVehicles = async (q = '') => {
    try {
      const res = await api.get('/vehicles', { params: q ? { search: q } : {} });
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    api.get('/clients').then(res => setClients(res.data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchVehicles(search);
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
      await api.post('/vehicles', form);
      setForm({ client_id: '', brand: '', model: '', year: '', color: '', vin: '', plate_number: '' });
      setShowForm(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const paginated = vehicles.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Pojazdy</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Anuluj' : '+ Nowy pojazd'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 640 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Nowy pojazd</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Klient *</label>
              <ClientSearch onSelect={(client) => setForm(prev => ({ ...prev, client_id: client?.id || '' }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Marka *</label>
                <input name="brand" value={form.brand} onChange={handleChange} required placeholder="BMW" />
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input name="model" value={form.model} onChange={handleChange} required placeholder="E46" />
              </div>
              <div className="form-group">
                <label>Rok</label>
                <input type="number" name="year" value={form.year} onChange={handleChange} placeholder="2003" min="1900" max="2099" />
              </div>
              <div className="form-group">
                <label>Kolor</label>
                <input name="color" value={form.color} onChange={handleChange} placeholder="Czarny" />
              </div>
              <div className="form-group">
                <label>Nr rejestracyjny</label>
                <input name="plate_number" value={form.plate_number} onChange={handleChange} placeholder="KR12345" />
              </div>
              <div className="form-group">
                <label>VIN</label>
                <input name="vin" value={form.vin} onChange={handleChange} placeholder="Opcjonalnie" />
              </div>
            </div>
            {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary">Zapisz pojazd</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Anuluj</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Szukaj po marce, modelu, rejestracji..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
        ) : vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Brak pojazdów</div>
        ) : (
          
          <table>
            <thead>
              <tr>
                <th>Marka / Model</th>
                <th>Rejestracja</th>
                <th>Rok</th>
                <th>Kolor</th>
                <th>Właściciel</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(vehicle => (
                <tr
                  key={vehicle.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                >
                  <td style={{ fontWeight: 500 }}>{vehicle.brand} {vehicle.model}</td>
                  <td>{vehicle.plate_number || '—'}</td>
                  <td>{vehicle.year || '—'}</td>
                  <td>{vehicle.color || '—'}</td>
                  <td>{vehicle.client_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          total={vehicles.length}
          perPage={PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default VehiclesPage;