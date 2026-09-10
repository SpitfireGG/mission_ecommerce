/**
 * Rebuild the product catalogue with working imagery, priced in NPR.
 *
 * The catalogue that shipped with this project pointed at an image host that
 * has since been retired, so every product rendered as broken alt text. This
 * pulls a current catalogue, converts the prices to Nepalese Rupees, and
 * rewrites categories, brands and products to match.
 *
 * Anything that references a product by id (carts, wishlists, reviews, orders)
 * is cleared first, because those references would otherwise dangle and break
 * the pages that read them. Users and addresses are left untouched.
 *
 *   node seed/reseedCatalogue.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const { connectToDB } = require('../database/db')

const Product = require('../models/Product')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const Cart = require('../models/Cart')
const Wishlist = require('../models/Wishlist')
const Review = require('../models/Review')
const Order = require('../models/Order')

const SOURCE = 'https://dummyjson.com/products?limit=200'

/** USD figures become whole rupees, rounded to something a shop would print. */
const toNPR = (usd) => Math.round((Number(usd) || 0) * 130 / 10) * 10

/** "womens-dresses" -> "Womens Dresses" */
const titleCase = (s) =>
  String(s).replace(/-/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase())

async function main() {
  await connectToDB()
  console.log('connected')

  console.log('fetching catalogue …')
  const res = await fetch(SOURCE)
  if (!res.ok) throw new Error(`source returned HTTP ${res.status}`)
  const { products: source } = await res.json()
  if (!Array.isArray(source) || !source.length) throw new Error('no products returned')
  console.log(`  ${source.length} products`)

  // Verify the imagery actually resolves before rebuilding anything on it.
  const probe = source[0].thumbnail
  const probeRes = await fetch(probe, { method: 'HEAD' })
  if (!probeRes.ok) throw new Error(`sample image is not reachable (${probeRes.status}): ${probe}`)
  console.log(`  imagery reachable (${probe.split('/').slice(-2).join('/')})`)

  // Clear what points at products; keep users and addresses.
  const cleared = {}
  for (const [name, model] of Object.entries({ Cart, Wishlist, Review, Order })) {
    cleared[name] = (await model.deleteMany({})).deletedCount
  }
  await Promise.all([Product.deleteMany({}), Category.deleteMany({}), Brand.deleteMany({})])
  console.log('  cleared', JSON.stringify(cleared))

  // Categories and brands are simple {name} documents referenced by id.
  const categoryNames = [...new Set(source.map((p) => titleCase(p.category)))].sort()
  const brandNames = [...new Set(source.map((p) => p.brand).filter(Boolean))].sort()

  const categories = await Category.insertMany(categoryNames.map((name) => ({ name })))
  const brands = await Brand.insertMany(brandNames.map((name) => ({ name })))

  const categoryId = new Map(categories.map((c) => [c.name, c._id]))
  const brandId = new Map(brands.map((b) => [b.name, b._id]))
  const fallbackBrand = brands[0]._id

  console.log(`  ${categories.length} categories, ${brands.length} brands`)

  const docs = source.map((p) => ({
    title: p.title,
    description: p.description,
    price: toNPR(p.price),
    discountPercentage: Math.round(p.discountPercentage || 0),
    category: categoryId.get(titleCase(p.category)),
    brand: p.brand ? brandId.get(p.brand) || fallbackBrand : fallbackBrand,
    stockQuantity: typeof p.stock === 'number' ? p.stock : 25,
    thumbnail: p.thumbnail,
    images: Array.isArray(p.images) && p.images.length ? p.images : [p.thumbnail],
    isDeleted: false,
  }))

  const inserted = await Product.insertMany(docs)
  console.log(`  ${inserted.length} products inserted`)

  const cheapest = await Product.findOne().sort({ price: 1 })
  const dearest = await Product.findOne().sort({ price: -1 })
  console.log(`  price range: Rs. ${cheapest.price.toLocaleString('en-IN')} – Rs. ${dearest.price.toLocaleString('en-IN')}`)

  await mongoose.connection.close()
  console.log('done')
}

main().catch(async (err) => {
  console.error('reseed failed:', err.message)
  await mongoose.connection.close().catch(() => {})
  process.exit(1)
})
