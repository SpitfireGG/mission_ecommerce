/**
 * Seed demonstration trading activity.
 *
 * A brand new install has a full catalogue but no orders, which leaves the
 * admin dashboard, the sales report and the audit log all reading zero. This
 * creates a fortnight of plausible orders across the payment methods the shop
 * accepts, plus the two standing discount codes, so the management screens
 * have something real to show.
 *
 *   node seed/seedDemoActivity.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const { connectToDB } = require('../database/db')

const Product = require('../models/Product')
const Order = require('../models/Order')
const User = require('../models/User')
const Address = require('../models/Address')
const Coupon = require('../models/Coupon')

const DELIVERY = 100
const VAT_RATE = 0.13

const STATUSES = ['Pending', 'Dispatched', 'Out for delivery', 'Cancelled']
const METHODS = ['ESEWA', 'KHALTI', 'COD']

const CUSTOMERS = [
  { fullName: 'Sita Rai', phone: '9801234567', city: 'Lalitpur', street: 'Pulchowk, Ward 3' },
  { fullName: 'Bikash Shrestha', phone: '9812345678', city: 'Kathmandu', street: 'Baneshwor, Ward 10' },
  { fullName: 'Anjali Gurung', phone: '9843216789', city: 'Pokhara', street: 'Lakeside, Ward 6' },
  { fullName: 'Prakash Tamang', phone: '9856781234', city: 'Bhaktapur', street: 'Suryabinayak' },
  { fullName: 'Manisha Thapa', phone: '9807654321', city: 'Kathmandu', street: 'Chabahil, Ward 7' },
]

const pick = (a) => a[Math.floor(Math.random() * a.length)]
const between = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))

async function main() {
  await connectToDB()
  console.log('connected')

  // Exclude the outliers (vehicles and the like) so the reported average order
  // value reflects what this shop actually sells.
  const products = await Product.find({ price: { $lte: 50000 } }).limit(150)
  if (!products.length) throw new Error('no products - run reseedCatalogue.js first')

  const user = await User.findOne({ email: 'demo@gmail.com' })
  if (!user) throw new Error('demo user missing - run the base seed first')

  let address = await Address.findOne({ user: user._id })
  if (!address) {
    address = await new Address({
      user: user._id, street: 'Pulchowk, Ward 3', city: 'Lalitpur',
      state: 'Bagmati', postalCode: '44700', country: 'Nepal', phoneNumber: '9801234567',
      type: 'Home',
    }).save()
  }

  // Standing discount codes.
  await Coupon.deleteMany({ code: { $in: ['MISSION10', 'DASHAIN500'] } })
  await Coupon.insertMany([
    { code: 'MISSION10', type: 'percent', value: 10, minAmount: 2000, active: true },
    { code: 'DASHAIN500', type: 'flat', value: 500, minAmount: 6000, active: true },
  ])
  console.log('  2 coupons')

  await Order.deleteMany({})

  const orders = []
  for (let day = 13; day >= 0; day--) {
    // Trade is uneven; some days see nothing.
    for (let n = 0; n < between(0, 3); n++) {
      const lines = []
      for (let i = 0; i < between(1, 3); i++) {
        const product = pick(products)
        const quantity = between(1, 2)
        lines.push({ product: product._id, quantity })
      }

      const subtotal = lines.reduce((sum, l) => {
        const p = products.find((x) => String(x._id) === String(l.product))
        return sum + p.price * l.quantity
      }, 0)

      const total = subtotal + DELIVERY + Math.round(subtotal * VAT_RATE)
      const method = pick(METHODS)
      const status = pick(STATUSES)
      const customer = pick(CUSTOMERS)

      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - day)
      createdAt.setHours(between(9, 21), between(0, 59), 0, 0)

      orders.push({
        user: user._id,
        item: lines,
        address: [address],
        status,
        paymentMode: method,
        // Cash on delivery settles on handover; the wallets settle up front.
        paymentStatus: status === 'Cancelled' ? 'failed' : (method === 'COD' ? 'pending' : 'paid'),
        billingDetails: {
          fullName: customer.fullName,
          email: user.email,
          phone: customer.phone,
          street: customer.street,
          city: customer.city,
          state: 'Bagmati',
          country: 'Nepal',
          postalCode: '44600',
        },
        total,
        createdAt,
      })
    }
  }

  const saved = await Order.insertMany(orders)
  const paid = saved.filter((o) => o.paymentStatus === 'paid')
  const revenue = paid.reduce((s, o) => s + o.total, 0)

  console.log(`  ${saved.length} orders over 14 days`)
  console.log(`  ${paid.length} paid, revenue Rs. ${revenue.toLocaleString('en-IN')}`)

  await mongoose.connection.close()
  console.log('done')
}

main().catch(async (err) => {
  console.error('seed failed:', err.message)
  await mongoose.connection.close().catch(() => {})
  process.exit(1)
})
