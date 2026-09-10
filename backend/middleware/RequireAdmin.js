require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

/**
 * Guard for everything under /api/admin except the login route.
 *
 * The admin console is a separate origin, so it cannot rely on the session
 * cookie the storefront uses. It sends an Authorization header instead, and
 * this accepts all three forms the system produces:
 *
 *   Authorization: Bearer <jwt>            issued by /api/admin/login
 *   Authorization: Basic  <base64 e:p>     stored by the console after login
 *   Cookie: token=<jwt>                    the storefront session
 *
 * Whichever arrives, the account behind it must exist and carry isAdmin.
 * Without that check these routes were reachable by anyone.
 */
async function requireAdmin(req, res, next) {
  const deny = (message) => res.status(401).json({ message })

  try {
    const header = req.headers.authorization || ''
    const [scheme, value] = header.split(' ')
    let user = null

    if (scheme === 'Bearer' && value) {
      const decoded = jwt.verify(value, process.env.SECRET_KEY)
      if (!decoded?._id) return deny('Invalid token')
      user = await User.findById(decoded._id)
    } else if (scheme === 'Basic' && value) {
      const decoded = Buffer.from(value, 'base64').toString()
      const separator = decoded.indexOf(':')
      if (separator === -1) return deny('Malformed credentials')

      const email = decoded.slice(0, separator)
      const password = decoded.slice(separator + 1)

      user = await User.findOne({ email })
      if (!user) return deny('Invalid credentials')
      if (!(await bcrypt.compare(password, user.password))) return deny('Invalid credentials')
    } else if (req.cookies?.token) {
      const decoded = jwt.verify(req.cookies.token, process.env.SECRET_KEY)
      if (!decoded?._id) return deny('Invalid token')
      user = await User.findById(decoded._id)
    } else {
      return deny('Authentication required')
    }

    if (!user) return deny('Invalid credentials')
    if (!user.isAdmin) return res.status(403).json({ message: 'Administrator access required' })

    req.admin = user
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return deny('Token expired, please login again')
    if (err instanceof jwt.JsonWebTokenError) return deny('Invalid token, please login again')
    console.log(err)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

module.exports = { requireAdmin }
