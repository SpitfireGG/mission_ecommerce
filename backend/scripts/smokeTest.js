/**
 * Smoke test for the Mission Shop API.
 *
 * Exercises the flows a demo touches - catalogue, guest shopping, admin
 * access and payments - against a running API, and cleans up after itself.
 * Run it after starting the database and the API:
 *
 *   npm run check
 *
 * Exits non-zero if any check fails.
 */

const BASE = process.env.API_URL || 'http://localhost:8000'
const STOREFRONT = 'http://localhost:3000'
const ADMIN_CONSOLE = 'http://localhost:3003'
const ADMIN = { username: 'admin', password: 'helloWorld@123' }

const results = []
const check = async (name, fn) => {
  try { results.push([true, name, (await fn()) || '']) }
  catch (e) { results.push([false, name, e.message]) }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg) }
const list = (b) => (Array.isArray(b) ? b : b?.data || [])

async function api(path, { method = 'GET', body, headers = {}, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data, headers: res.headers }
}

async function main() {
  let productId, categoryId, basic, created, guest, guestCookie

  // --- catalogue ------------------------------------------------------------
  await check('catalogue lists products', async () => {
    const r = await api('/products?user=true')
    must(r.status === 200, `HTTP ${r.status}`)
    const a = list(r.data)
    must(a.length > 0, 'no products')
    productId = a[0]._id
    return `${a.length} products`
  })

  await check('product images load', async () => {
    const a = list((await api('/products?user=true&limit=4')).data)
    for (const p of a) {
      const img = await fetch(p.thumbnail, { method: 'HEAD' })
      must(img.ok, `${p.title}: image HTTP ${img.status}`)
    }
    return `${a.length}/${a.length} load`
  })

  await check('product detail resolves category and brand', async () => {
    const r = await api(`/products/${productId}`)
    must(r.status === 200 && r.data.category && r.data.brand, `HTTP ${r.status}`)
    return r.data.title
  })

  await check('pagination reports a total', async () => {
    const r = await api('/products?page=1&limit=12')
    must(list(r.data).length <= 12, 'page too large')
    must(r.headers.get('X-Total-Count'), 'X-Total-Count header missing')
    return `total ${r.headers.get('X-Total-Count')}`
  })

  await check('sort by price', async () => {
    const asc = list((await api('/products?sort=price&order=asc&limit=5')).data)
    must(asc[0].price <= asc[asc.length - 1].price, 'not ascending')
    return `from Rs. ${asc[0].price}`
  })

  await check('search', async () => {
    const r = await api('/products?search=watch')
    must(r.status === 200, `HTTP ${r.status}`)
    return `${list(r.data).length} results for "watch"`
  })

  await check('categories and brands', async () => {
    const c = list((await api('/categories')).data)
    const b = list((await api('/brands')).data)
    must(c.length && b.length, 'empty')
    categoryId = c[0]._id
    return `${c.length} categories, ${b.length} brands`
  })

  await check('filter by category', async () => {
    const r = await api(`/products?user=true&category=${categoryId}`)
    must(r.status === 200, `HTTP ${r.status}`)
    return `${list(r.data).length} in first category`
  })

  // --- guest shopping: the storefront never asks for a login --------------
  await check('guest session is issued without a password', async () => {
    const r = await api('/auth/guest', { method: 'POST' })
    must(r.status === 200, `HTTP ${r.status}`)
    must(r.data.isVerified && !r.data.isAdmin, 'guest must be verified and not an admin')
    guest = r.data
    guestCookie = (r.headers.get('set-cookie') || '').split(';')[0]
    must(guestCookie.startsWith('token='), 'no session cookie')
    return guest.email
  })

  await check('guest session is recognised', async () => {
    const r = await api('/auth/check-auth', { cookie: guestCookie })
    must(r.status === 200 && r.data._id === guest._id, `HTTP ${r.status}`)
    return 'check-auth returns the guest'
  })

  await check('guest can add to cart', async () => {
    const r = await api('/cart', { method: 'POST', cookie: guestCookie, body: { user: guest._id, product: productId, quantity: 1 } })
    must([200, 201].includes(r.status), `HTTP ${r.status}`)
    const cart = list((await api(`/cart/user/${guest._id}`, { cookie: guestCookie })).data)
    must(cart.length >= 1, 'cart empty after add')
    return `${cart.length} line(s)`
  })

  await check('guest can save to wishlist', async () => {
    const r = await api('/wishlist', { method: 'POST', cookie: guestCookie, body: { user: guest._id, product: productId } })
    must([200, 201].includes(r.status), `HTTP ${r.status}`)
    return 'saved'
  })

  await check('guest session is refused by the admin API', async () => {
    const r = await api('/api/admin/stats', { cookie: guestCookie })
    must(r.status === 403, `expected 403, got ${r.status}`)
    return '403'
  })

  // --- payments -----------------------------------------------------------
  for (const provider of ['ESEWA', 'KHALTI']) {
    await check(`${provider.toLowerCase()} payment starts`, async () => {
      const r = await api('/payments/initiate', {
        method: 'POST', cookie: guestCookie,
        body: { provider, amount: 2500, user: guest._id,
          billingDetails: { fullName: 'Smoke Test', email: guest.email, phone: '9800000000' } },
      })
      must([200, 201].includes(r.status), `HTTP ${r.status} ${JSON.stringify(r.data).slice(0, 80)}`)
      return provider === 'KHALTI' && r.data.mock ? 'session returned (offline fallback)' : 'payload returned'
    })
  }

  // --- admin --------------------------------------------------------------
  await check('admin login', async () => {
    const r = await api('/api/admin/login', { method: 'POST', body: ADMIN })
    must(r.status === 200 && r.data.basic, `HTTP ${r.status}`)
    basic = r.data.basic
    return 'signed in'
  })

  await check('admin login rejects a wrong password', async () => {
    const r = await api('/api/admin/login', { method: 'POST', body: { username: 'admin', password: 'wrong' } })
    must(r.status === 401, `expected 401, got ${r.status}`)
    return '401'
  })

  await check('admin API refuses anonymous callers', async () => {
    const r = await api('/api/admin/stats')
    must(r.status === 401, `expected 401, got ${r.status}`)
    return '401'
  })

  const auth = () => ({ Authorization: `Basic ${basic}` })

  await check('admin dashboard figures', async () => {
    const r = await api('/api/admin/stats', { headers: auth() })
    must(r.status === 200, `HTTP ${r.status}`)
    return `${r.data.totalProducts} products, ${r.data.totalOrders} orders, ${r.data.lowStock} low on stock`
  })

  await check('admin creates, edits and deletes a product', async () => {
    let r = await api('/api/admin/products', {
      method: 'POST', headers: auth(),
      body: { title: '__smoke-test product', description: 'temporary', price: 1234,
        category: 'Beauty', brand: 'Essence', stockQuantity: 3,
        thumbnail: 'https://cdn.dummyjson.com/product-images/beauty/red-lipstick/thumbnail.webp' },
    })
    must([200, 201].includes(r.status), `create: HTTP ${r.status}`)
    created = r.data.id || r.data._id
    r = await api(`/api/admin/products/${created}`, { method: 'PUT', headers: auth(), body: { stockQuantity: 1 } })
    must(r.status === 200, `update: HTTP ${r.status}`)
    r = await api(`/api/admin/products/${created}`, { method: 'DELETE', headers: auth() })
    must([200, 204].includes(r.status), `delete: HTTP ${r.status}`)
    // Delete is a soft delete; the product must still vanish from the console.
    const remaining = list((await api('/api/admin/products', { headers: auth() })).data)
    must(!remaining.some((p) => String(p.id || p._id) === String(created)), 'deleted product still listed in the console')
    created = null
    return 'create, edit and delete all succeed; deleted item no longer listed'
  })

  for (const path of ['/api/admin/orders', '/api/admin/reports/sales', '/api/admin/audit', '/api/admin/coupons']) {
    await check(`admin reads ${path.replace('/api/admin/', '')}`, async () => {
      const r = await api(path, { headers: auth() })
      must(r.status === 200, `HTTP ${r.status}`)
      return 'ok'
    })
  }

  // --- orders: what the console shows and edits ------------------------------
  let order
  await check('admin order lines name their products', async () => {
    const orders = list((await api('/api/admin/orders', { headers: auth() })).data)
    must(orders.length, 'no orders')
    order = orders[0]
    must(order.lines.every((l) => l.title && l.lineTotal > 0), 'unnamed or unpriced lines')
    return `${order.lines.length} line(s)`
  })

  await check('admin order breakdown adds up', async () => {
    const o = (await api(`/api/admin/orders/${order.transactionUuid}`, { headers: auth() })).data
    must(o.subtotal + o.deliveryCharge + o.vat === o.totalAmount,
      `${o.subtotal} + ${o.deliveryCharge} + ${o.vat} != ${o.totalAmount}`)
    return `Rs. ${o.subtotal} + ${o.deliveryCharge} + ${o.vat} VAT = Rs. ${o.totalAmount}`
  })

  await check('admin updates an order status', async () => {
    const original = order.status
    let r = await api(`/api/admin/orders/${order.transactionUuid}`, { method: 'PATCH', headers: auth(), body: { status: 'Dispatched' } })
    must(r.status === 200 && r.data.order.status === 'Dispatched', `HTTP ${r.status}`)
    r = await api(`/api/admin/orders/${order.transactionUuid}`, { method: 'PATCH', headers: auth(), body: { status: original } })
    must(r.status === 200, `restore: HTTP ${r.status}`)
    return 'set and restored'
  })

  await check('admin refuses an unknown order status', async () => {
    const r = await api(`/api/admin/orders/${order.transactionUuid}`, { method: 'PATCH', headers: auth(), body: { status: 'PROCESSING' } })
    must(r.status === 400, `expected 400, got ${r.status}`)
    return '400, nothing stored'
  })

  await check('admin exports the sales report as CSV', async () => {
    const res = await fetch(BASE + '/api/admin/reports/sales.csv', { headers: auth() })
    const text = await res.text()
    must(res.status === 200 && text.startsWith('orderNumber'), `HTTP ${res.status}`)
    return `${text.trim().split('\n').length - 1} rows`
  })

  // --- browsers: the API must accept requests from both apps ---------------
  for (const [origin, method] of [[STOREFRONT, 'POST'], [ADMIN_CONSOLE, 'POST'], [ADMIN_CONSOLE, 'PUT']]) {
    await check(`browser access from ${origin} (${method})`, async () => {
      const res = await fetch(BASE + '/api/admin/products/x', {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': 'content-type,authorization' },
      })
      must(res.headers.get('access-control-allow-origin') === origin, `origin not allowed (HTTP ${res.status})`)
      must((res.headers.get('access-control-allow-methods') || '').includes(method), `${method} not allowed`)
      return 'allowed'
    })
  }

  // --- clean up anything created above -------------------------------------
  if (created) await api(`/api/admin/products/${created}`, { method: 'DELETE', headers: auth() })
  if (guest) {
    const cart = list((await api(`/cart/user/${guest._id}`, { cookie: guestCookie })).data)
    for (const line of cart) await api(`/cart/${line._id}`, { method: 'DELETE', cookie: guestCookie })
    const saved = list((await api(`/wishlist/user/${guest._id}`, { cookie: guestCookie })).data)
    for (const item of saved) await api(`/wishlist/${item._id}`, { method: 'DELETE', cookie: guestCookie })
  }

  // Deleting through the API is a soft delete, which would leave the test
  // product behind as a hidden row on every run. Remove it for good.
  try {
    require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
    const mongoose = require('mongoose')
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 })
    await mongoose.connection.db.collection('products').deleteMany({ title: '__smoke-test product' })
    await mongoose.connection.close()
  } catch { /* cleanup is best-effort; the row is hidden either way */ }

  // --- report ---------------------------------------------------------------
  console.log('\n  Mission Shop - API smoke test\n')
  for (const [ok, name, detail] of results) {
    console.log(`  ${ok ? ' ok ' : 'FAIL'}  ${name.padEnd(46)} ${detail}`)
  }
  const failed = results.filter(([ok]) => !ok).length
  console.log(`\n  ${results.length - failed} passed, ${failed} failed\n`)
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(`\n  Could not reach the API at ${BASE}: ${err.message}`)
  console.error('  Start MongoDB (docker start mern-mongo) and the API (npm start) first.\n')
  process.exit(1)
})
