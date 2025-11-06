import env from '#start/env'
import nodemailer from 'nodemailer'
import crypto from 'node:crypto'

function createMagicToken(payload: Record<string, any>): string {
  const data = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString('base64url')
  const sig = crypto
    .createHash('sha256')
    .update(data + (env.get('MAGIC_SECRET', 'secret') as string))
    .digest('base64url')
  return `${data}.${sig}`
}

const SMTP_HOST = (env.get('SMTP_HOST', '') as string) || ''
const SMTP_PORT = Number(env.get('SMTP_PORT', 587))
const SMTP_USER = (env.get('SMTP_USER', '') as string) || ''
const SMTP_PASS = (env.get('SMTP_PASS', '') as string) || ''
const MAIL_FROM = (env.get('MAIL_FROM', 'MiniAppExpert <no-reply@miniapp.expert>') as string) ||
  'MiniAppExpert <no-reply@miniapp.expert>'

const transport = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null

async function sendWelcomeEmail({
  to,
  name,
  product,
  orderId,
  magicToken,
}: {
  to: string
  name?: string
  product?: string
  orderId: string
  magicToken: string
}): Promise<boolean> {
  if (!transport || !to) return false
  const baseUrl = (env.get('API_BASE_URL', 'https://miniapp.expert') as string) || 'https://miniapp.expert'
  const magicUrl = `${baseUrl}/auth/magic?token=${encodeURIComponent(magicToken)}&email=${encodeURIComponent(
    to
  )}&name=${encodeURIComponent(name || 'Клиент')}&product=${encodeURIComponent(product || 'Mini App')}`
  const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#f6f9fc;padding:24px">
        <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
          <div style="padding:24px 24px 0">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;background:#10B981;border-radius:12px;display:flex;align-items:center;justify-content:center">
                <span style="font-size:20px;color:#fff">⚡</span>
              </div>
              <div style="font-size:18px;font-weight:800;color:#0b1220">MiniAppExpert</div>
            </div>
            <h1 style="margin:24px 0 8px;font-size:22px;color:#0b1220">Оплата принята — доступ в личный кабинет</h1>
            <p style="margin:0 0 12px;color:#374151">Здравствуйте${name ? `, ${name}` : ''}! Спасибо за оплату заказа <b>${
              product || 'Продукт'
            }</b>.</p>
            <p style="margin:0 0 16px;color:#374151">Номер заказа: <b>${orderId}</b></p>
          </div>
          <div style="padding:0 24px 24px">
            <a href="${magicUrl}" style="display:inline-block;background:#10B981;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700">Войти в личный кабинет</a>
            <p style="margin:12px 0 0;font-size:12px;color:#6b7280">Кнопка содержит одноразовую ссылку авторизации и действует 24 часа.</p>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:0"/>
          <div style="padding:16px 24px;background:#fafafa">
            <div style="font-weight:700;margin-bottom:6px;color:#111827">Что дальше?</div>
            <ul style="margin:0;padding-left:18px;color:#374151">
              <li>Мы добавили продукт в ваш кабинет со статусом «Настройка»</li>
              <li>В течение 1–2 рабочих дней мы свяжемся для уточнения деталей</li>
              <li>Фискальный чек отправлен банком на вашу почту</li>
            </ul>
          </div>
        </div>
        <p style="text-align:center;margin:12px 0 0;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} MiniAppExpert</p>
      </div>`
  try {
    await transport.sendMail({ from: MAIL_FROM, to, subject: 'Оплата принята — доступ в личный кабинет', html })
    return true
  } catch (e) {
    console.error('Mail send error:', (e as Error).message)
    return false
  }
}

export { sendWelcomeEmail, createMagicToken }


