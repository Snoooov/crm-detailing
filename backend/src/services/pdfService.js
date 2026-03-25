const puppeteer = require('puppeteer');

const generateReceptionCardPDF = async (order) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const carSchemaPath = `file:///${process.cwd()}/public/images/car-schema.jpg`.replace(/\\/g, '/');

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
      padding: 32px;
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
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 12px; }
    .field-label { font-size: 10px; color: #666; margin-bottom: 1px; }
    .field-line {
      border-bottom: 1px solid #333;
      min-height: 18px;
      margin-bottom: 2px;
      font-size: 13px;
    }
    .field-value { font-weight: 600; }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 5px;
      font-size: 12px;
    }
    .checkbox-box {
      width: 13px;
      height: 13px;
      border: 1.5px solid #333;
      flex-shrink: 0;
    }
    .fuel-row { display: flex; gap: 16px; margin-top: 4px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
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
      margin-top: 28px;
    }
    .car-schema {
      width: 100%;
      max-height: 150px;
      object-fit: contain;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="company-name">Auto Detailing</div>
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
    <div>
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
    <div>
      <div class="field-label">Opis</div>
      <div class="field-line">${order.service_description}</div>
    </div>` : ''}
  </div>

  <div class="section-title">Wyposażenie pojazdu</div>
  <div class="grid-3">
    ${['Kluczyki (szt.): ___', 'Dowód rejestracyjny', 'Karta pojazdu',
       'Dywaniki', 'Trójkąt ostrzegawczy', 'Gaśnica',
       'Koło zapasowe', 'Ładowarka / kabel', 'Inne: _______________'
      ].map(item => `
      <div class="checkbox-row">
        <div class="checkbox-box"></div>
        <span>${item}</span>
      </div>
    `).join('')}
  </div>

  <div class="section-title">Stan zewnętrzny pojazdu</div>
  <div class="two-col">
    <div>
      <div class="field-label" style="margin-bottom:6px">Uwagi (zarysowania, wgniecenia itp.)</div>
      <div class="field-line" style="margin-bottom:8px"></div>
      <div class="field-line" style="margin-bottom:8px"></div>
      <div class="field-line" style="margin-bottom:8px"></div>
      <div class="field-line"></div>
    </div>
    <div>
      <div class="field-label" style="margin-bottom:6px">Schemat — zaznacz uszkodzenia</div>
      <img class="car-schema" src="${carSchemaPath}" alt="Schemat pojazdu" />
    </div>
  </div>

  <div class="section-title">Uwagi klienta</div>
  <div class="field-line" style="margin-bottom:8px"></div>
  <div class="field-line" style="margin-bottom:8px"></div>

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