import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'
import crypto from 'node:crypto'
import env from '#start/env'
import pocketbase from '#services/pocketbase'
import { sendWelcomeEmail, createMagicToken } from '#services/mailer'
//

function generateToken(params: Record<string, any>, password: string) {
  const tokenParams: Record<string, any> = { ...params }
  delete tokenParams.Token
  delete tokenParams.Receipt
  delete tokenParams.DATA
  delete tokenParams.Shops
  tokenParams.Password = password
  const sortedKeys = Object.keys(tokenParams).sort()
  const tokenString = sortedKeys.map((k) => tokenParams[k]).join('')
  return crypto.createHash('sha256').update(tokenString).digest('hex')
}

// Note: createMagicToken moved to mailer in future; removing to satisfy typecheck

function verifyMagicToken(token?: string | null) {
  const value = String(token || '')
  const [data, sig] = value.split('.')
  const expected = crypto
    .createHash('sha256')
    .update(data + (env.get('MAGIC_SECRET', 'secret') as string))
    .digest('base64url')
  if (sig !== expected) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export default class ApiController {
  public async health({ response }: HttpContext) {
    return response.json({ status: 'ok', service: 'miniapp-expert-api', ts: new Date().toISOString() })
  }

  public async paymentCreate({ request, response }: HttpContext) {
    try {
      const { amount, orderId, description, email, phone, name } = request.only([
        'amount',
        'orderId',
        'description',
        'email',
        'phone',
        'name',
      ])

      const TBANK_API = 'https://securepay.tinkoff.ru/v2'
      const terminalKey = env.get('TBANK_TERMINAL_KEY') as string
      const password = env.get('TBANK_PASSWORD') as string

      const paymentData: any = {
        TerminalKey: terminalKey,
        Amount: Math.round(Number(amount) * 100),
        OrderId: orderId,
        Description: description,
        Receipt: {
          Email: email,
          Phone: phone,
          Taxation: 'usn_income',
          Items: [
            {
              Name: description,
              Price: Math.round(Number(amount) * 100),
              Quantity: 1,
              Amount: Math.round(Number(amount) * 100),
              Tax: 'none',
            },
          ],
        },
        DATA: {
          Name: name || 'Клиент',
          Email: email,
          Phone: phone,
        },
        SuccessURL: `${env.get('FRONTEND_BASE_URL', 'https://miniapp.expert')}/payment-success.html?orderId=${orderId}`,
        FailURL: `${env.get('FRONTEND_BASE_URL', 'https://miniapp.expert')}/payment-failed.html?orderId=${orderId}&error=declined`,
        NotificationURL: `${env.get('API_BASE_URL', 'https://miniapp.expert')}/api/payment/webhook`,
      }

      paymentData.Token = generateToken(paymentData, password)

      const { data } = await axios.post(`${TBANK_API}/Init`, paymentData)

      if (data.Success) {
        const ok = await pocketbase.ensureAdminAuth()
        if (ok) {
          try {
            await pocketbase.client.collection('orders').create({
              orderId,
              amount,
              status: 'NEW',
              product: { description },
              customer: { email, phone, name },
              payment: { paymentId: data.PaymentId, paymentUrl: data.PaymentURL },
            })
          } catch (e) {
            console.error('PB create order error:', (e as Error).message)
          }
        }
        return response.json({
          success: true,
          paymentId: data.PaymentId,
          paymentUrl: data.PaymentURL,
          orderId,
        })
      }
      return response.status(500).json({ success: false, error: data.Message || 'Payment creation failed' })
    } catch (error) {
      return response.status(500).json({ success: false, error: (error as Error).message })
    }
  }

  public async paymentStatus({ request, response }: HttpContext) {
    try {
      const { paymentId } = request.only(['paymentId'])
      const TBANK_API = 'https://securepay.tinkoff.ru/v2'
      const terminalKey = env.get('TBANK_TERMINAL_KEY') as string
      const password = env.get('TBANK_PASSWORD') as string
      const payload: any = { TerminalKey: terminalKey, PaymentId: paymentId }
      payload.Token = generateToken(payload, password)
      const { data } = await axios.post(`${TBANK_API}/GetState`, payload)
      return response.json({
        success: data.Success,
        status: data.Status,
        paymentId: data.PaymentId,
        amount: data.Amount,
      })
    } catch (error) {
      return response.status(500).json({ success: false, error: (error as Error).message })
    }
  }

  public async paymentWebhook({ request, response }: HttpContext) {
    try {
      const body = request.body()
      const { Status, PaymentId, OrderId } = body || {}
      const ok = await pocketbase.ensureAdminAuth()
      if (ok && OrderId) {
        try {
          const list = await pocketbase.client
            .collection('orders')
            .getList(1, 1, { filter: `orderId = "${OrderId}"` })
          const rec = list.items?.[0]
          if (rec) {
            await pocketbase.client.collection('orders').update(rec.id, {
              status: Status,
              payment: { ...(rec.payment || {}), paymentId: PaymentId, status: Status },
            })
            if (Status === 'CONFIRMED') {
              const email = rec?.customer?.email
              const name = rec?.customer?.name || rec?.customer?.Name || 'Клиент'
              const product = rec?.product?.description || 'Продукт'
              if (email) {
                const magicToken = createMagicToken({ email, name, orderId: OrderId, product })
                await sendWelcomeEmail({ to: email, name, product, orderId: OrderId, magicToken })
              }
            }
          }
        } catch (e) {
          console.error('PB update order error:', (e as Error).message)
        }
      }
      return response.send('OK')
    } catch (error) {
      console.error('Webhook error:', error)
      return response.send('OK')
    }
  }

  public async magic({ request, response }: HttpContext) {
    try {
      const token = request.qs().token
      const payload = verifyMagicToken(token)
      if (!payload) {
        return response.status(400).send('<meta charset="utf-8"><div style="font-family:Arial;padding:24px">Ссылка недействительна или истекла.</div>')
      }
      const { email, name, product } = payload
      const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход...</title></head><body><script>(function(){try{localStorage.setItem('userAuth','true');localStorage.setItem('userEmail', ${JSON.stringify(
        email
      )});localStorage.setItem('userName', ${JSON.stringify(
        name
      )});localStorage.setItem('userRegistrationDate', new Date().toISOString());var products=JSON.parse(localStorage.getItem('userProducts')||'[]');var has=products.some(function(p){return p && p.slug==='paid-product'});if(!has){products.push({slug:'paid-product',name:${JSON.stringify(
        product || 'Оплаченный продукт'
      )},status:'Настройка',date:new Date().toLocaleDateString('ru-RU'),icon:'📱',appLink:'#',adminLink:'#'});localStorage.setItem('userProducts', JSON.stringify(products));}window.location.replace('/cabinet.html');}catch(e){document.write('<meta charset=\'utf-8\'><div style=\'font-family:Arial;padding:24px\'>Ошибка авторизации. Откройте личный кабинет вручную.</div>');}})();</script></body></html>`
      response.header('Content-Type', 'text/html; charset=utf-8')
      return response.send(html)
    } catch (e) {
      return response
        .status(500)
        .send('<meta charset="utf-8"><div style="font-family:Arial;padding:24px">Ошибка. Попробуйте позднее.</div>')
    }
  }
}


