const nodemailer = require('nodemailer');
const pool = require('../config/db');
const config = require('../config/appConfig');

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

const sendOrderEmail = async (order, type) => {
  if (!order.client_email) return { skipped: 'brak emaila klienta' };

  const template = await getTemplate(type);
  if (!template) return { skipped: 'brak szablonu' };

  const alreadySent = await wasEmailSent(order.id, type);
  if (alreadySent) return { skipped: 'już wysłano' };

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
  };

  const subject = renderTemplate(template.subject, variables);
  const body = renderTemplate(template.body, variables);

  try {
    await sendEmail({ to: order.client_email, subject, html: body });
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

module.exports = { sendOrderEmail, getTemplate, wasEmailSent, sendEmail, logEmail, renderTemplate };