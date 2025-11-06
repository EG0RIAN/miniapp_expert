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

/**
 * Отправка письма с подтверждением регистрации
 */
async function sendRegistrationEmail({
  to,
  name,
  verificationToken,
}: {
  to: string
  name?: string
  verificationToken: string
}): Promise<boolean> {
  if (!transport || !to) return false
  const baseUrl = (env.get('APP_BASE_URL', 'https://miniapp.expert') as string) || 'https://miniapp.expert'
  const verifyUrl = `${baseUrl}/auth/verify?token=${encodeURIComponent(verificationToken)}`
  
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f6f9fc;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#10B981 0%,#059669 100%);padding:32px 24px;text-align:center">
          <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
            <span style="font-size:32px">🎉</span>
          </div>
          <h1 style="margin:0;font-size:28px;color:#fff;font-weight:800">Добро пожаловать!</h1>
        </div>

        <!-- Content -->
        <div style="padding:32px 24px">
          <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6">
            Здравствуйте${name ? `, <strong>${name}</strong>` : ''}!
          </p>
          <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6">
            Спасибо за регистрацию в <strong>MiniAppExpert</strong>. Мы рады видеть вас в нашей команде! 🚀
          </p>
          
          <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6">
            Чтобы завершить регистрацию и получить доступ к личному кабинету, пожалуйста, подтвердите свой email:
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}" style="display:inline-block;background:#10B981;color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(16,185,129,0.3);transition:all 0.3s">
              ✓ Подтвердить email
            </a>
          </div>

          <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5">
            Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
            <a href="${verifyUrl}" style="color:#10B981;word-break:break-all">${verifyUrl}</a>
          </p>
        </div>

        <!-- Info Block -->
        <div style="background:#f9fafb;padding:24px;border-top:1px solid #e5e7eb">
          <div style="font-weight:700;margin-bottom:12px;color:#111827;font-size:15px">🎁 Что вас ждёт:</div>
          <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.8">
            <li>Доступ к личному кабинету</li>
            <li>Управление продуктами и подписками</li>
            <li>История платежей и квитанции</li>
            <li>Реферальная программа с бонусами</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280">
            Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.
          </p>
          <p style="margin:0;font-size:12px;color:#9ca3af">
            © ${new Date().getFullYear()} MiniAppExpert. Все права защищены.
          </p>
        </div>
      </div>

      <!-- Bottom Text -->
      <p style="text-align:center;margin:20px 0 0;color:#9ca3af;font-size:12px">
        Письмо отправлено роботом, отвечать на него не нужно
      </p>
    </div>`

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to,
      subject: '🎉 Подтвердите регистрацию в MiniAppExpert',
      html,
    })
    return true
  } catch (e) {
    console.error('Registration email send error:', (e as Error).message)
    return false
  }
}

/**
 * Отправка письма для восстановления пароля
 */
async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}: {
  to: string
  name?: string
  resetToken: string
}): Promise<boolean> {
  if (!transport || !to) return false
  const baseUrl = (env.get('APP_BASE_URL', 'https://miniapp.expert') as string) || 'https://miniapp.expert'
  const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`
  
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f6f9fc;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#3B82F6 0%,#2563EB 100%);padding:32px 24px;text-align:center">
          <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
            <span style="font-size:32px">🔐</span>
          </div>
          <h1 style="margin:0;font-size:28px;color:#fff;font-weight:800">Восстановление пароля</h1>
        </div>

        <!-- Content -->
        <div style="padding:32px 24px">
          <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6">
            Здравствуйте${name ? `, <strong>${name}</strong>` : ''}!
          </p>
          <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6">
            Мы получили запрос на восстановление пароля для вашего аккаунта в <strong>MiniAppExpert</strong>.
          </p>
          
          <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6">
            Чтобы создать новый пароль, нажмите на кнопку ниже:
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}" style="display:inline-block;background:#3B82F6;color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(59,130,246,0.3);transition:all 0.3s">
              🔑 Сбросить пароль
            </a>
          </div>

          <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5">
            Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
            <a href="${resetUrl}" style="color:#3B82F6;word-break:break-all">${resetUrl}</a>
          </p>
        </div>

        <!-- Warning Block -->
        <div style="background:#FEF3C7;padding:20px 24px;border-left:4px solid #F59E0B">
          <div style="display:flex;align-items:start;gap:12px">
            <span style="font-size:24px">⚠️</span>
            <div>
              <div style="font-weight:700;margin-bottom:6px;color:#92400E;font-size:14px">Важная информация</div>
              <p style="margin:0;color:#78350F;font-size:13px;line-height:1.6">
                Ссылка действительна в течение <strong>1 часа</strong>. Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо — ваш аккаунт в безопасности.
              </p>
            </div>
          </div>
        </div>

        <!-- Security Tips -->
        <div style="background:#f9fafb;padding:24px;border-top:1px solid #e5e7eb">
          <div style="font-weight:700;margin-bottom:12px;color:#111827;font-size:15px">🛡️ Советы по безопасности:</div>
          <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.8;font-size:14px">
            <li>Используйте уникальный пароль для каждого сервиса</li>
            <li>Пароль должен содержать минимум 8 символов</li>
            <li>Включите двухфакторную аутентификацию</li>
            <li>Не передавайте пароль третьим лицам</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280">
            Если у вас возникли проблемы, свяжитесь с нашей поддержкой
          </p>
          <p style="margin:0;font-size:12px;color:#9ca3af">
            © ${new Date().getFullYear()} MiniAppExpert. Все права защищены.
          </p>
        </div>
      </div>

      <!-- Bottom Text -->
      <p style="text-align:center;margin:20px 0 0;color:#9ca3af;font-size:12px">
        Письмо отправлено роботом, отвечать на него не нужно
      </p>
    </div>`

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to,
      subject: '🔐 Восстановление пароля MiniAppExpert',
      html,
    })
    return true
  } catch (e) {
    console.error('Password reset email send error:', (e as Error).message)
    return false
  }
}

/**
 * Отправка письма об успешной смене пароля
 */
async function sendPasswordChangedEmail({
  to,
  name,
}: {
  to: string
  name?: string
}): Promise<boolean> {
  if (!transport || !to) return false
  
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f6f9fc;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#10B981 0%,#059669 100%);padding:32px 24px;text-align:center">
          <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
            <span style="font-size:32px">✅</span>
          </div>
          <h1 style="margin:0;font-size:28px;color:#fff;font-weight:800">Пароль изменён</h1>
        </div>

        <!-- Content -->
        <div style="padding:32px 24px;text-align:center">
          <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6">
            Здравствуйте${name ? `, <strong>${name}</strong>` : ''}!
          </p>
          <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6">
            Ваш пароль был успешно изменён.
          </p>
          
          <div style="background:#ECFDF5;border:1px solid #10B981;border-radius:12px;padding:20px;margin:24px 0">
            <div style="font-size:48px;margin-bottom:12px">🎉</div>
            <div style="font-weight:700;color:#065F46;font-size:16px">Всё готово!</div>
            <div style="color:#047857;font-size:14px;margin-top:8px">Теперь вы можете войти с новым паролем</div>
          </div>

          <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.6">
            Если вы не меняли пароль, немедленно свяжитесь с нашей службой поддержки.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">
            © ${new Date().getFullYear()} MiniAppExpert. Все права защищены.
          </p>
        </div>
      </div>
    </div>`

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to,
      subject: '✅ Пароль успешно изменён — MiniAppExpert',
      html,
    })
    return true
  } catch (e) {
    console.error('Password changed email send error:', (e as Error).message)
    return false
  }
}

export { 
  sendWelcomeEmail, 
  sendRegistrationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  createMagicToken 
}


