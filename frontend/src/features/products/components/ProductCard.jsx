import { Box, Stack, Typography, Tooltip, IconButton } from '@mui/material'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/Favorite'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import CheckIcon from '@mui/icons-material/Check'
import { useDispatch, useSelector } from 'react-redux'
import { selectWishlistItems } from '../../wishlist/WishlistSlice'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import { addToCartAsync, selectCartItems } from '../../cart/CartSlice'
import { formatNPR } from '../../../utils/currency'

const INK = '#000000'
const ACCENT = '#DB4444'
const MIST = '#F5F5F5'
const LINE = '#E6E6E6'
const MUTED = '#7D7D7D'

/**
 * A product tile.
 *
 * Sizing is left to the grid that contains it rather than set from a stack of
 * breakpoint queries, which is what previously made rows ragged. The card fills
 * its column, so every tile in a row ends up the same height.
 */
export const ProductCard = ({
  id, title, price, thumbnail, brand, stockQuantity, discountPercentage,
  handleAddRemoveFromWishlist, isWishlistCard, isAdminCard,
}) => {
  const navigate = useNavigate()
  const wishlistItems = useSelector(selectWishlistItems)
  const loggedInUser = useSelector(selectLoggedInUser)
  const cartItems = useSelector(selectCartItems)
  const dispatch = useDispatch()

  const inWishlist = wishlistItems.some((item) => item.product?._id === id)
  const inCart = cartItems.some((item) => item.product?._id === id)

  const discount = Math.round(Number(discountPercentage) || 0)
  // The stored price is what the customer pays; the "was" price is derived.
  const wasPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : null

  const outOfStock = stockQuantity === 0
  const lowStock = stockQuantity > 0 && stockQuantity <= 10

  const addToCart = (e) => {
    e.stopPropagation()
    dispatch(addToCartAsync({ user: loggedInUser?._id, product: id }))
  }

  return (
    <Stack
      onClick={() => navigate(`/product-details/${id}`)}
      sx={{
        position: 'relative',
        height: '100%',
        cursor: 'pointer',
        bgcolor: '#fff',
        border: `1px solid ${LINE}`,
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'border-color .18s ease',
        '&:hover': { borderColor: INK },
        '&:hover .mission-img': { transform: 'scale(1.04)' },
        '&:hover .mission-buy': { opacity: 1, transform: 'translateY(0)' },
      }}
    >
      {/* Image well */}
      <Box sx={{ position: 'relative', bgcolor: MIST, aspectRatio: '1 / 1', overflow: 'hidden' }}>
        <Box
          component="img"
          className="mission-img"
          src={thumbnail}
          alt={title}
          loading="lazy"
          sx={{
            width: '100%', height: '100%', objectFit: 'contain',
            p: 2.5, transition: 'transform .3s ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />

        {discount > 0 && (
          <Box sx={{
            position: 'absolute', top: 10, left: 10, bgcolor: ACCENT, color: '#fff',
            fontSize: 12, fontWeight: 600, px: 1, py: '2px', borderRadius: '3px',
          }}>
            -{discount}%
          </Box>
        )}

        {outOfStock && (
          <Box sx={{
            position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontWeight: 600, color: INK, fontSize: 14 }}>Out of stock</Typography>
          </Box>
        )}

        {!isAdminCard && (
          <Tooltip title={inWishlist ? 'Remove from wishlist' : 'Save for later'}>
            <IconButton
              onClick={(e) => { e.stopPropagation(); handleAddRemoveFromWishlist?.(e, id) }}
              aria-label={inWishlist ? `Remove ${title} from wishlist` : `Save ${title} for later`}
              sx={{
                position: 'absolute', top: 6, right: 6, bgcolor: '#fff',
                width: 34, height: 34, border: `1px solid ${LINE}`,
                '&:hover': { bgcolor: '#fff', borderColor: INK },
              }}
            >
              {inWishlist
                ? <Favorite sx={{ fontSize: 18, color: ACCENT }} />
                : <FavoriteBorder sx={{ fontSize: 18, color: INK }} />}
            </IconButton>
          </Tooltip>
        )}

        {/* Buy action rides on the image well; always visible on touch. */}
        {!isWishlistCard && !isAdminCard && !outOfStock && (
          <Box
            className="mission-buy"
            sx={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              opacity: { xs: 1, md: 0 }, transform: { xs: 'none', md: 'translateY(100%)' },
              transition: 'opacity .18s ease, transform .18s ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            <Box
              component="button"
              onClick={addToCart}
              disabled={inCart}
              aria-label={inCart ? `${title} is in your bag` : `Add ${title} to bag`}
              sx={{
                width: '100%', border: 'none', cursor: inCart ? 'default' : 'pointer',
                bgcolor: inCart ? '#2E7D32' : INK, color: '#fff',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 500, py: 1.25,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: .75,
                '&:hover': { bgcolor: inCart ? '#2E7D32' : ACCENT },
              }}
            >
              {inCart
                ? <><CheckIcon sx={{ fontSize: 16 }} /> In your bag</>
                : <><ShoppingBagOutlinedIcon sx={{ fontSize: 16 }} /> Add to bag</>}
            </Box>
          </Box>
        )}
      </Box>

      {/* Detail */}
      <Stack sx={{ p: 1.75, gap: .5, flexGrow: 1 }}>
        <Typography sx={{ fontSize: 12, color: MUTED, lineHeight: 1.2 }}>{brand}</Typography>

        <Typography
          title={title}
          sx={{
            fontSize: 14, fontWeight: 500, color: INK, lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', minHeight: '2.7em',
          }}
        >
          {title}
        </Typography>

        <Stack direction="row" alignItems="baseline" gap={1} sx={{ mt: 'auto', pt: .5 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: ACCENT }}>
            {formatNPR(price)}
          </Typography>
          {wasPrice && (
            <Typography sx={{ fontSize: 12.5, color: MUTED, textDecoration: 'line-through' }}>
              {formatNPR(wasPrice)}
            </Typography>
          )}
        </Stack>

        {lowStock && (
          <Typography sx={{ fontSize: 11.5, color: ACCENT }}>
            {stockQuantity === 1 ? 'Last one left' : `Only ${stockQuantity} left`}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
