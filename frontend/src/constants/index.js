// Storefront constants. Money is in whole Nepalese Rupees.
export const SHIPPING = 100        // flat delivery charge, inside the valley
export const VAT_RATE = 0.13       // Nepal VAT
export const ITEMS_PER_PAGE = 10

// Kept for the older call sites that expect a flat figure; VAT is computed
// from the subtotal wherever the subtotal is known.
export const TAXES = 0
