import type { HttpContext } from '@adonisjs/core/http'
import pocketbase from '#services/pocketbase'
import Database from '@adonisjs/lucid/services/db'

async function ensureSchema() {
  // Create tables if not exists (minimal port of Express initializer)
  const k = Database
  await k.rawQuery(`create table if not exists profiles (
    email text primary key,
    name text,
    phone text,
    data jsonb default '{}'::jsonb
  );`)
  await k.rawQuery(`create table if not exists user_products (
    email text primary key,
    items jsonb default '[]'::jsonb
  );` )
  await k.rawQuery(`create table if not exists user_subscriptions (
    email text primary key,
    items jsonb default '[]'::jsonb
  );`)
  await k.rawQuery(`create table if not exists user_referrals (
    email text primary key,
    items jsonb default '[]'::jsonb
  );`)
}

export default class UserController {
  public async profileGet({ request, response }: HttpContext) {
    const email = String(request.qs().email || '').toLowerCase()
    if (!email) return response.status(400).json({ success: false, message: 'email required' })
    await ensureSchema()
    const k = Database
    const row = await k.rawQuery('select email, name, phone, data from profiles where email = ? limit 1', [email])
    const record = row?.rows?.[0] || null
    if (record) return response.json({ success: true, profile: record })
    // PB fallback
    try {
      const ok = await pocketbase.ensureAdminAuth()
      if (ok) {
        const list = await pocketbase.client
          .collection('profiles')
          .getList(1, 1, { filter: `email = "${email}"` })
        const rec = list.items?.[0] || null
        if (rec) return response.json({ success: true, profile: { email: rec.email, name: rec.name, phone: rec.phone, data: rec.data || {} } })
      }
    } catch {}
    return response.json({ success: true, profile: null })
  }

  public async profilePost({ request, response }: HttpContext) {
    const { email, name, phone, data } = request.only(['email', 'name', 'phone', 'data'])
    if (!email) return response.status(400).json({ success: false, message: 'email required' })
    await ensureSchema()
    const em = String(email).toLowerCase()
    const k = Database
    const res = await k.rawQuery(
      `insert into profiles(email, name, phone, data)
       values(?, ?, ?, ?)
       on conflict(email) do update set name=excluded.name, phone=excluded.phone, data=excluded.data
       returning email, name, phone, data`,
      [em, name || null, phone || null, data || {}]
    )
    const profile = res.rows?.[0] || null
    try { await pocketbase.ensureAdminAuth(); await pocketbase.client.collection('profiles').create({ email: em, name, phone, data: data || {} }) } catch {}
    if (!profile) return response.status(503).json({ success: false, message: 'storage unavailable' })
    return response.json({ success: true, profile })
  }

  public async itemsGet({ request, response, params }: HttpContext) {
    const collection = params.collection as 'user_products' | 'user_subscriptions' | 'user_referrals'
    const email = String(request.qs().email || '').toLowerCase()
    if (!email) return response.status(400).json({ success: false, message: 'email required' })
    await ensureSchema()
    const k = Database
    const r = await k.rawQuery(`select items from ${collection} where email = ?`, [email])
    let items = r?.rows?.[0]?.items || []
    if (!items?.length) {
      try {
        const ok = await pocketbase.ensureAdminAuth()
        if (ok) {
          const list = await pocketbase.client
            .collection(collection)
            .getList(1, 1, { filter: `email = "${email}"` })
          items = list.items?.[0]?.items || []
        }
      } catch {}
    }
    return response.json({ success: true, items })
  }

  public async itemsPost({ request, response, params }: HttpContext) {
    const collection = params.collection as 'user_products' | 'user_subscriptions' | 'user_referrals'
    const { email, items } = request.only(['email', 'items'])
    if (!email) return response.status(400).json({ success: false, message: 'email required' })
    await ensureSchema()
    const em = String(email).toLowerCase()
    const k = Database
    const r = await k.rawQuery(
      `insert into ${collection}(email, items) values(?, ?)
       on conflict(email) do update set items = excluded.items
       returning items`,
      [em, Array.isArray(items) ? items : []]
    )
    try {
      const ok = await pocketbase.ensureAdminAuth()
      if (ok) await pocketbase.client.collection(collection).create({ email: em, items: Array.isArray(items) ? items : [] })
    } catch {}
    return response.json({ success: true, items: r?.rows?.[0]?.items || [] })
  }
}


