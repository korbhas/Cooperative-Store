import twilio from 'twilio'

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const FROM = process.env.TWILIO_WHATSAPP_FROM
const ADMIN_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER

const client = ACCOUNT_SID && AUTH_TOKEN ? twilio(ACCOUNT_SID, AUTH_TOKEN) : null

function formatPhone(phone) {
  if (!phone) return null
  const p = String(phone).trim()
  if (p.startsWith('+')) return `whatsapp:${p}`
  return `whatsapp:+91${p}`
}

async function send(to, body) {
  if (!client || !FROM || !to) return
  const toFormatted = to.startsWith('whatsapp:') ? to : formatPhone(to)
  if (!toFormatted) return
  await client.messages.create({ from: FROM, to: toFormatted, body })
}

// Customer: notified only when order is out for delivery
export async function notifyOutForDelivery(phone, name, orderId) {
  const displayName = name ?? 'there'
  return send(phone, `Hi ${displayName}! Your TU Cooperative Store Order #${orderId} is out for delivery. Our agent is on the way — please keep your phone handy!`)
}

// Admin: notified when a new order is confirmed (payment received or Razorpay skipped)
export async function notifyAdminOrderConfirmed(orderId, customerName, customerPhone, total, address) {
  if (!ADMIN_NUMBER) return
  const phone = customerPhone ? `+91${String(customerPhone).replace(/^\+91/, '')}` : 'N/A'
  const lines = [
    `🛒 New Order #${orderId} confirmed!`,
    `Customer: ${customerName ?? 'Unknown'} (${phone})`,
    `Total: ₹${Number(total).toFixed(2)}`,
    `Address: ${address ?? 'N/A'}`,
  ]
  return send(ADMIN_NUMBER, lines.join('\n'))
}
