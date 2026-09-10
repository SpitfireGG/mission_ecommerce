/**
 * Money formatting for the storefront.
 *
 * Every amount in this application is Nepalese Rupees. Prices are held as whole
 * rupees in the database, and grouped here the way they are written in Nepal
 * (en-IN grouping: 1,25,000 rather than 125,000).
 */

export const VAT_RATE = 0.13;          // Nepal VAT
export const DELIVERY_CHARGE = 100;    // flat, inside the valley

export const formatNPR = (amount) =>
  'Rs. ' + Math.round(Number(amount) || 0).toLocaleString('en-IN');

/** VAT on a subtotal, rounded to whole rupees. */
export const vatOn = (subtotal) => Math.round((Number(subtotal) || 0) * VAT_RATE);
