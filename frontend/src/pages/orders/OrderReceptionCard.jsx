import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';

const OrderReceptionCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => {
      setOrder(res.data);
      setLoading(false);
    });
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '_______________';
    return new Date(dateStr).toLocaleDateString('pl-PL');
  };

  const handleGeneratePDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/pdf/orders/${id}/reception`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Błąd generowania PDF');
      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('Nie udało się wygenerować PDF');
    }
  };

  if (loading) return <div>Ładowanie...</div>;
  if (!order) return <div>Nie znaleziono zlecenia</div>;

  return (
    <>
      <style>{`
        .field-line {
          border-bottom: 1px solid #333;
          min-height: 20px;
          margin-bottom: 2px;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .checkbox-box {
          width: 14px;
          height: 14px;
          border: 1.5px solid #333;
          flex-shrink: 0;
        }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #444;
          border-bottom: 1.5px solid #333;
          padding-bottom: 3px;
          margin-bottom: 8px;
          margin-top: 14px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 20px;
        }
        .field-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 1px;
        }
        .damage-line {
          border-bottom: 1px solid #333;
          min-height: 24px;
          margin-bottom: 12px;
        }
        .inne-box {
          border: 1px solid #333;
          border-radius: 4px;
          min-height: 60px;
          margin-top: 4px;
          padding: 4px;
        }
        .fuel-row {
          display: flex;
          gap: 20px;
          margin-top: 6px;
        }
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
      `}</style>

      {/* Pasek nawigacji */}
      <div style={{
        padding: '16px 32px',
        background: '#1e293b',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}>
        <button
          onClick={handleGeneratePDF}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '8px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Generuj PDF
        </button>
        <button
          onClick={() => navigate(`/orders/${id}`)}
          style={{
            background: '#334155',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          ← Wróć do zlecenia
        </button>
      </div>

      {/* Podgląd karty */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '28px 32px',
        background: 'white',
        color: '#111',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
      }}>

        {/* Nagłówek */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Auto Detailing</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>Karta przyjęcia pojazdu</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Nr zlecenia: #{order.id}</div>
            <div style={{ color: '#555', marginTop: 4 }}>Data przyjęcia: {formatDate(order.date_from)}</div>
            <div style={{ color: '#555' }}>Planowane wydanie: {formatDate(order.date_to)}</div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #111', marginBottom: 14 }} />

        {/* Dane klienta i pojazdu */}
        <div className="two-col">
          <div>
            <div className="section-title">Dane klienta</div>
            <div style={{ marginBottom: 6 }}>
              <div className="field-label">Imię i nazwisko</div>
              <div className="field-line" style={{ fontWeight: 600 }}>{order.client_name}</div>
            </div>
            <div className="grid-2">
              <div>
                <div className="field-label">Telefon</div>
                <div className="field-line">{order.client_phone || ''}</div>
              </div>
              <div>
                <div className="field-label">Email</div>
                <div className="field-line">{order.client_email || ''}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="section-title">Dane pojazdu</div>
            <div className="grid-2">
              <div>
                <div className="field-label">Marka / Model</div>
                <div className="field-line" style={{ fontWeight: 600 }}>{order.vehicle_brand} {order.vehicle_model}</div>
              </div>
              <div>
                <div className="field-label">Nr rejestracyjny</div>
                <div className="field-line" style={{ fontWeight: 600 }}>{order.plate_number}</div>
              </div>
              <div>
                <div className="field-label">Rok produkcji</div>
                <div className="field-line">{order.vehicle_year || ''}</div>
              </div>
              <div>
                <div className="field-label">Kolor</div>
                <div className="field-line">{order.vehicle_color || ''}</div>
              </div>
              <div>
                <div className="field-label">VIN</div>
                <div className="field-line">{order.vehicle_vin || ''}</div>
              </div>
              <div>
                <div className="field-label">Przebieg (km)</div>
                <div className="field-line"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Usługa */}
        <div className="section-title">Zlecona usługa</div>
        <div className="grid-2" style={{ marginBottom: 8 }}>
          <div>
            <div className="field-label">Nazwa usługi</div>
            <div className="field-line" style={{ fontWeight: 600 }}>{order.service_name}</div>
          </div>
          <div>
            <div className="field-label">Szacowana cena</div>
            <div className="field-line">{order.price ? `${parseFloat(order.price).toFixed(2)} zł` : ''}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="field-label">Poziom paliwa</div>
            <div className="fuel-row">
              {['1/4', '1/2', '3/4', 'pełny'].map(lvl => (
                <div key={lvl} className="checkbox-row" style={{ margin: 0 }}>
                  <div className="checkbox-box" />
                  <span>{lvl}</span>
                </div>
              ))}
            </div>
          </div>
          {order.service_description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="field-label">Opis usługi</div>
              <div className="field-line">{order.service_description}</div>
            </div>
          )}
        </div>

        {/* Wyposażenie */}
        <div className="section-title">Wyposażenie pojazdu</div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginBottom: 8 }}>
          <div className="checkbox-row">
            <div className="checkbox-box" />
            <span>Kluczyki</span>
          </div>
          <div className="checkbox-row">
            <div className="checkbox-box" />
            <span>Dowód rejestracyjny</span>
          </div>
        </div>
        <div>
          <div className="field-label">Inne</div>
          <div className="inne-box"></div>
        </div>

        {/* Stan pojazdu */}
        <div className="section-title">Stan zewnętrzny pojazdu</div>
        <div className="field-label" style={{ marginBottom: 10 }}>
          Opis uszkodzeń, zarysowań, wgnieceń i innych uwag dotyczących stanu pojazdu
        </div>
        <div className="damage-line" />
        <div className="damage-line" />
        <div className="damage-line" />
        <div className="damage-line" />

        {/* Uwagi */}
        <div className="section-title">Uwagi klienta</div>
        <div className="field-line" style={{ marginBottom: 10, minHeight: 22 }} />
        <div className="field-line" style={{ marginBottom: 14, minHeight: 22 }} />

        {/* Zgoda */}
        <div style={{
          border: '1px solid #aaa',
          borderRadius: 4,
          padding: '8px 10px',
          fontSize: 11,
          color: '#444',
          marginBottom: 12,
          lineHeight: 1.6,
        }}>
          Wyrażam zgodę na wykonanie zleconych prac serwisowych oraz potwierdzam zgodność powyższych danych.
          Przyjmuję do wiadomości, że ostateczna cena może ulec zmianie po dokładnej ocenie stanu pojazdu.
          Pojazd zostaje przyjęty w opisanym stanie.
        </div>

        {/* Podpisy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 8 }}>
          <div>
            <div className="field-label">Data i podpis klienta</div>
            <div style={{ borderBottom: '1px solid #333', marginTop: 32 }} />
          </div>
          <div>
            <div className="field-label">Podpis pracownika</div>
            <div style={{ borderBottom: '1px solid #333', marginTop: 32 }} />
          </div>
        </div>

      </div>
    </>
  );
};

export default OrderReceptionCard;