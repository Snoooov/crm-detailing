const puppeteer = require('puppeteer');
const config = require('../config/appConfig');

const generateReceptionCardPDF = async (order) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const formatDate = (dateStr) => {
    if (!dateStr) return '_______________';
    return new Date(dateStr).toLocaleDateString('pl-PL');
  };

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #111;
      padding: 28px 32px;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .company-name { font-size: 20px; font-weight: 700; }
    .company-sub { font-size: 12px; color: #555; margin-top: 2px; }
    .order-info { text-align: right; font-size: 12px; }
    .order-number { font-size: 16px; font-weight: 700; }
    .divider { border-top: 2px solid #111; margin-bottom: 14px; }
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
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
    .field-label { font-size: 10px; color: #666; margin-bottom: 1px; }
    .field-line {
      border-bottom: 1px solid #333;
      min-height: 20px;
      margin-bottom: 2px;
    }
    .field-value { font-weight: 600; }
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
    .fuel-row { display: flex; gap: 20px; margin-top: 6px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .consent-box {
      border: 1px solid #aaa;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 11px;
      color: #444;
      line-height: 1.6;
      margin-top: 12px;
      margin-bottom: 12px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 8px;
    }
    .signature-line {
      border-bottom: 1px solid #333;
      margin-top: 32px;
    }
    .inne-box {
      border: 1px solid #333;
      border-radius: 4px;
      min-height: 60px;
      margin-top: 4px;
      padding: 4px;
    }
    .damage-line {
      border-bottom: 1px solid #333;
      min-height: 24px;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="company-name">${config.company.name}</div>
      <div class="company-sub">Karta przyjęcia pojazdu</div>
    </div>
    <div class="order-info">
      <div class="order-number">Nr zlecenia: #${order.id}</div>
      <div style="color:#555; margin-top:4px">Data przyjęcia: ${formatDate(order.date_from)}</div>
      <div style="color:#555">Planowane wydanie: ${formatDate(order.date_to)}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="two-col">
    <div>
      <div class="section-title">Dane klienta</div>
      <div style="margin-bottom:6px">
        <div class="field-label">Imię i nazwisko</div>
        <div class="field-line field-value">${order.client_name || ''}</div>
      </div>
      <div class="grid-2">
        <div>
          <div class="field-label">Telefon</div>
          <div class="field-line">${order.client_phone || ''}</div>
        </div>
        <div>
          <div class="field-label">Email</div>
          <div class="field-line">${order.client_email || ''}</div>
        </div>
      </div>
    </div>

    <div>
      <div class="section-title">Dane pojazdu</div>
      <div class="grid-2">
        <div>
          <div class="field-label">Marka / Model</div>
          <div class="field-line field-value">${order.vehicle_brand || ''} ${order.vehicle_model || ''}</div>
        </div>
        <div>
          <div class="field-label">Nr rejestracyjny</div>
          <div class="field-line field-value">${order.plate_number || ''}</div>
        </div>
        <div>
          <div class="field-label">Rok produkcji</div>
          <div class="field-line">${order.vehicle_year || ''}</div>
        </div>
        <div>
          <div class="field-label">Kolor</div>
          <div class="field-line">${order.vehicle_color || ''}</div>
        </div>
        <div>
          <div class="field-label">VIN</div>
          <div class="field-line">${order.vehicle_vin || ''}</div>
        </div>
        <div>
          <div class="field-label">Przebieg (km)</div>
          <div class="field-line"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="section-title">Zlecona usługa</div>
  <div class="grid-2">
    <div>
      <div class="field-label">Nazwa usługi</div>
      <div class="field-line field-value">${order.service_name || ''}</div>
    </div>
    <div>
      <div class="field-label">Szacowana cena</div>
      <div class="field-line">${order.price ? parseFloat(order.price).toFixed(2) + ' zł' : ''}</div>
    </div>
    <div style="grid-column: 1 / -1">
      <div class="field-label">Poziom paliwa</div>
      <div class="fuel-row">
        ${['1/4', '1/2', '3/4', 'pełny'].map(lvl => `
          <div class="checkbox-row" style="margin:0">
            <div class="checkbox-box"></div>
            <span>${lvl}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ${order.service_description ? `
    <div style="grid-column: 1 / -1">
      <div class="field-label">Opis usługi</div>
      <div class="field-line">${order.service_description}</div>
    </div>` : ''}
  </div>

  <div class="section-title">Wyposażenie pojazdu</div>
  <div style="display: flex; gap: 32px; align-items: flex-start; margin-bottom: 8px;">
    <div class="checkbox-row">
      <div class="checkbox-box"></div>
      <span>Kluczyki</span>
    </div>
    <div class="checkbox-row">
      <div class="checkbox-box"></div>
      <span>Dowód rejestracyjny</span>
    </div>
  </div>
  <div>
    <div class="field-label">Inne</div>
    <div class="inne-box"></div>
  </div>

  <div class="section-title">Stan zewnętrzny pojazdu</div>
  <div class="field-label" style="margin-bottom: 10px">Opis uszkodzeń, zarysowań, wgnieceń i innych uwag dotyczących stanu pojazdu</div>
  <div class="damage-line"></div>
  <div class="damage-line"></div>
  <div class="damage-line"></div>
  <div class="damage-line"></div>

  <div class="section-title">Uwagi klienta</div>
  <div class="field-line" style="margin-bottom:10px; min-height:22px;"></div>
  <div class="field-line" style="margin-bottom:14px; min-height:22px;"></div>

  <div class="consent-box">
    Wyrażam zgodę na wykonanie zleconych prac serwisowych oraz potwierdzam zgodność powyższych danych.
    Przyjmuję do wiadomości, że ostateczna cena może ulec zmianie po dokładnej ocenie stanu pojazdu.
    Pojazd zostaje przyjęty w opisanym stanie.
  </div>

  <div class="signatures">
    <div>
      <div class="field-label">Data i podpis klienta</div>
      <div class="signature-line"></div>
    </div>
    <div>
      <div class="field-label">Podpis pracownika</div>
      <div class="signature-line"></div>
    </div>
  </div>

</body>
</html>`;

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });

  await browser.close();
  return pdf;
};

module.exports = { generateReceptionCardPDF };