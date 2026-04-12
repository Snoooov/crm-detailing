const nodemailer = require('nodemailer');
const pool = require('../config/db');
const config = require('../config/appConfig');
const { getCompany } = require('../utils/companySettings');

const wrapEmailHtml = (body, company) => {
  const companyName = company.name || 'Auto Detailing';
  const footerLines = [
    company.address,
    company.phone ? `Tel: ${company.phone}` : null,
    company.email_contact ? `E-mail: ${company.email_contact}` : null,
    company.website ? `<a href="${company.website}" style="color:#6366f1;text-decoration:none;">${company.website}</a>` : null,
    company.nip ? `NIP: ${company.nip}` : null,
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  // Konwertuj zwykły tekst na akapity HTML jeśli body nie zawiera tagów HTML
  const isPlainText = !/<[a-z][\s\S]*>/i.test(body);
  const contentHtml = isPlainText
    ? body.split('\n').map(line => line.trim() ? `<p style="margin:0 0 12px 0;">${line}</p>` : '').join('')
    : body;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- NAGŁÓWEK -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;line-height:48px;font-size:24px;margin-bottom:12px;">✦</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${companyName}</h1>
            </td>
          </tr>

          <!-- TREŚĆ -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <div style="color:#1e293b;font-size:15px;line-height:1.7;">
                ${contentHtml}
              </div>
            </td>
          </tr>

          <!-- STOPKA -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 6px 0;color:#64748b;font-size:12px;line-height:1.6;">${footerLines}</p>
              <p style="margin:0;color:#94a3b8;font-size:11px;">Ta wiadomość została wygenerowana automatycznie. Prosimy na nią nie odpowiadać.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const renderTemplate = (template, variables) => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });
  return result;
};

const getTemplate = async (type) => {
  const result = await pool.query(
    'SELECT * FROM email_templates WHERE type = $1 AND enabled = TRUE',
    [type]
  );
  return result.rows[0] || null;
};

const wasEmailSent = async (orderId, type) => {
  const result = await pool.query(
    'SELECT id FROM email_logs WHERE order_id = $1 AND email_type = $2',
    [orderId, type]
  );
  return result.rows.length > 0;
};

const logEmail = async ({ orderId, clientId, type, email, subject, status, error }) => {
  await pool.query(
    `INSERT INTO email_logs (order_id, client_id, email_type, recipient_email, subject, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [orderId, clientId, type, email, subject, status, error || null]
  );
};

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
};

const sendOrderEmail = async (order, type, options = {}) => {
  if (!order.client_email) return { skipped: 'brak emaila klienta' };

  const template = await getTemplate(type);
  if (!template) return { skipped: 'brak szablonu' };

  if (!options.skipDuplicateCheck) {
    const alreadySent = await wasEmailSent(order.id, type);
    if (alreadySent) return { skipped: 'już wysłano' };
  }

  const company = await getCompany();

  const variables = {
    client_name: order.client_name?.split(' ')[0] || order.client_name,
    vehicle_brand: order.vehicle_brand,
    vehicle_model: order.vehicle_model,
    plate_number: order.plate_number,
    service_name: order.service_name,
    date_from: order.date_from
      ? new Date(order.date_from).toLocaleDateString('pl-PL')
      : '',
    date_to: order.date_to
      ? new Date(order.date_to).toLocaleDateString('pl-PL')
      : '',
    company_name:    company.name,
    company_address: company.address,
    company_phone:   company.phone,
    company_email:   company.email_contact,
    company_nip:     company.nip,
    company_website: company.website,
  };

  const subject = renderTemplate(template.subject, variables);
  const body = renderTemplate(template.body, variables);
  const html = wrapEmailHtml(body, company);

  try {
    await sendEmail({ to: order.client_email, subject, html });
    await logEmail({
      orderId: order.id,
      clientId: order.client_id,
      type,
      email: order.client_email,
      subject,
      status: 'sent',
    });
    return { sent: true };
  } catch (err) {
    await logEmail({
      orderId: order.id,
      clientId: order.client_id,
      type,
      email: order.client_email,
      subject,
      status: 'failed',
      error: err.message,
    });
    return { error: err.message };
  }
};

module.exports = { sendOrderEmail, getTemplate, wasEmailSent, sendEmail, logEmail, renderTemplate, wrapEmailHtml };