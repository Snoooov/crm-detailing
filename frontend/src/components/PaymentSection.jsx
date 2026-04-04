import { useState } from 'react';
import useDarkMode from '../hooks/useDarkMode.js';

const PaymentSection = ({ form, onChange, clientNip }) => {
  const price = parseFloat(form.price) || 0;
  const paidCash = parseFloat(form.paid_cash) || 0;
  const paidCard = parseFloat(form.paid_card) || 0;
  const totalPaid = paidCash + paidCard;
  const remaining = price - totalPaid;
  const isDark = useDarkMode();

  const handlePaidChange = (e) => {
    const isPaid = e.target.checked;
    onChange('is_paid', isPaid);
    if (isPaid && totalPaid === 0) {
      onChange('paid_cash', price);
      onChange('paid_card', 0);
    }
    if (!isPaid) {
      onChange('paid_cash', 0);
      onChange('paid_card', 0);
    }
  };

  return (
    <div style={{
      border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      background: form.is_paid
        ? (isDark ? '#14532d33' : '#f0fdf4')
        : (isDark ? '#263548' : '#fafafa'),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: form.is_paid ? 16 : 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={form.is_paid || false}
            onChange={handlePaidChange}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          Zlecenie opłacone
        </label>
        {form.is_paid && totalPaid > 0 && (
          <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
            {totalPaid.toFixed(2)} zł / {price.toFixed(2)} zł
          </span>
        )}
        {form.is_paid && remaining > 0.01 && (
          <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
            Pozostało: {remaining.toFixed(2)} zł
          </span>
        )}
      </div>

      {clientNip && (
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Nr faktury</label>
          <input
            type="text"
            value={form.invoice_number || ''}
            onChange={e => onChange('invoice_number', e.target.value)}
            placeholder="np. FV/2024/001"
          />
        </div>
      )}

      {form.is_paid && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                background: '#16a34a',
                color: 'white',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: 11,
                fontWeight: 700,
              }}>
                GOTÓWKA
              </span>
            </label>
            <input
              type="number"
              value={form.paid_cash || ''}
              onChange={e => onChange('paid_cash', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: 11,
                fontWeight: 700,
              }}>
                KARTA
              </span>
            </label>
            <input
              type="number"
              value={form.paid_card || ''}
              onChange={e => onChange('paid_card', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSection;