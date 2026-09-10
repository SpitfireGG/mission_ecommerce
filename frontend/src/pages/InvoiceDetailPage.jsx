import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getInvoiceByOrderAsync, getInvoiceByIdAsync, selectCurrentInvoice } from '../features/invoice/InvoiceSlice'
import { Stack, Paper, Typography, Divider, Box, Button, Chip } from '@mui/material'
export const InvoiceDetailPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const invoice = useSelector(selectCurrentInvoice)
  useEffect(() => { if (id) dispatch(getInvoiceByIdAsync(id)) }, [id])
  if (!invoice) return <Stack p={4}><Typography>Loading invoice...</Typography></Stack>
  return (
    <Stack p={3} alignItems="center">
      <Paper sx={{ p: 4, maxWidth: 800, width: '100%' }} elevation={2}>
        <Stack direction="row" justifyContent="space-between" mb={2}>
          <Typography variant="h4" color="primary" fontWeight={800}>MISSION SHOP</Typography>
          <Chip label={invoice.paymentStatus} color={invoice.paymentStatus === 'paid' ? 'success' : 'warning'} />
        </Stack>
        <Typography variant="h5" fontWeight={700}>Invoice {invoice.invoiceNumber}</Typography>
        <Typography variant="body2" color="text.secondary">Issued: {new Date(invoice.issuedAt).toLocaleDateString()} | Order: {invoice.order?._id || invoice.order}</Typography>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box><Typography fontWeight={600}>Billed To</Typography><Typography>{invoice.billingDetails.fullName}</Typography><Typography variant="body2">{invoice.billingDetails.email} | {invoice.billingDetails.phone}</Typography><Typography variant="body2">{invoice.billingDetails.street}, {invoice.billingDetails.city}, {invoice.billingDetails.state}, {invoice.billingDetails.country} - {invoice.billingDetails.postalCode}</Typography>{invoice.billingDetails.panVat && <Typography variant="body2">PAN/VAT: {invoice.billingDetails.panVat}</Typography>}</Box>
          <Box textAlign="right"><Typography fontWeight={600}>Payment</Typography><Typography>{invoice.paymentProvider}</Typography><Typography variant="body2">Status: {invoice.paymentStatus}</Typography></Box>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack gap={1}>
          {invoice.items.map((it, idx) => (
            <Stack key={idx} direction="row" justifyContent="space-between"><Typography>{it.product?.title || 'Product'} x {it.quantity}</Typography><Typography>Rs. {((it.product?.price || 0) * it.quantity).toFixed(2)}</Typography></Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack alignItems="flex-end" gap={0.5}>
          <Typography>Subtotal: Rs. {invoice.subtotal.toFixed(2)}</Typography><Typography>Shipping: Rs. {invoice.shipping}</Typography><Typography>Taxes: Rs. {invoice.taxes}</Typography><Typography variant="h6" fontWeight={700}>Total: Rs. {invoice.total.toFixed(2)}</Typography>
        </Stack>
        <Button fullWidth variant="contained" sx={{ mt: 3 }} onClick={() => window.print()}>Print / Save as PDF</Button>
      </Paper>
    </Stack>
  )
}
