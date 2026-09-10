import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getAllInvoicesAsync, getInvoiceStatsAsync, selectInvoices, selectInvoiceStats } from '../../invoice/InvoiceSlice'
import { getAllPaymentsAsync, selectPayments } from '../../payment/PaymentSlice'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Typography, Chip, Button, IconButton, Box, Grid, useMediaQuery, useTheme, Divider, Tooltip } from '@mui/material'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Lottie from 'lottie-react'
import { noOrdersAnimation } from '../../../assets/index'
import { toast } from 'react-toastify'
export const AdminInvoices = () => {
  const dispatch = useDispatch()
  const invoices = useSelector(selectInvoices)
  const stats = useSelector(selectInvoiceStats)
  const payments = useSelector(selectPayments)
  const theme = useTheme()
  const is1200 = useMediaQuery(theme.breakpoints.down(1200))
  const is480 = useMediaQuery(theme.breakpoints.down(480))
  const [filter, setFilter] = useState('all')
  useEffect(() => { dispatch(getAllInvoicesAsync()); dispatch(getInvoiceStatsAsync()); dispatch(getAllPaymentsAsync()) }, [dispatch])
  const filtered = invoices.filter(inv => filter === 'all' ? true : inv.paymentProvider === filter || inv.paymentStatus === filter)
  const getProviderChip = (p) => {
    if (p === 'ESEWA') return <Chip label="eSewa" sx={{ bgcolor: '#60BB46', color: 'white', fontWeight: 600 }} size="small" />
    if (p === 'KHALTI') return <Chip label="Khalti" sx={{ bgcolor: '#5C2D91', color: 'white', fontWeight: 600 }} size="small" />
    if (p === 'COD') return <Chip label="COD" color="warning" size="small" />
    return <Chip label={p} size="small" />
  }
  const getPaymentStatusChip = (s) => {
    if (s === 'paid') return <Chip label="Paid" sx={{ bgcolor: '#b3f5ca', color: '#548c6a' }} size="small" />
    if (s === 'pending') return <Chip label="Pending" sx={{ bgcolor: '#feed80', color: '#927b1e' }} size="small" />
    if (s === 'failed') return <Chip label="Failed" sx={{ bgcolor: '#fac0c0', color: '#cc6d72' }} size="small" />
    return <Chip label={s} size="small" />
  }
  const handlePrint = (inv) => {
    const w = window.open('', '_blank')
    const itemsHtml = inv.items.map(i => `<tr><td style="padding:8px;border:1px solid #eee">${i.product?.title || i.title || 'Product'}</td><td style="padding:8px;border:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border:1px solid #eee;text-align:right">Rs. ${i.product?.price || 0}</td><td style="padding:8px;border:1px solid #eee;text-align:right">Rs. ${((i.product?.price || 0) * i.quantity).toFixed(2)}</td></tr>`).join('')
    w.document.write(`
      <html><head><title>Invoice ${inv.invoiceNumber}</title><style>body{font-family:Inter,Arial;padding:24px} table{width:100%;border-collapse:collapse} h1{color:#1976d2}</style></head>
      <body>
        <h1>MISSION SHOP — Invoice</h1>
        <p><b>Invoice:</b> ${inv.invoiceNumber} | <b>Date:</b> ${new Date(inv.issuedAt).toLocaleDateString()} | <b>Order:</b> ${inv.order?._id || inv.order}</p>
        <p><b>Billed to:</b> ${inv.billingDetails.fullName} (${inv.billingDetails.email}, ${inv.billingDetails.phone})<br/>${inv.billingDetails.street}, ${inv.billingDetails.city}, ${inv.billingDetails.state}, ${inv.billingDetails.country} - ${inv.billingDetails.postalCode} ${inv.billingDetails.panVat ? '| PAN/VAT:' + inv.billingDetails.panVat : ''}</p>
        <table><thead><tr><th style="text-align:left;padding:8px;border:1px solid #eee">Item</th><th style="padding:8px;border:1px solid #eee">Qty</th><th style="padding:8px;border:1px solid #eee;text-align:right">Price</th><th style="padding:8px;border:1px solid #eee;text-align:right">Amount</th></tr></thead><tbody>${itemsHtml}</tbody></table>
        <div style="text-align:right;margin-top:16px">
          <p>Subtotal: Rs. ${inv.subtotal.toFixed(2)}</p><p>Shipping: Rs. ${inv.shipping}</p><p>Taxes: Rs. ${inv.taxes}</p><h3>Total: Rs. ${inv.total.toFixed(2)}</h3><p>Payment: ${inv.paymentProvider} — ${inv.paymentStatus}</p>
        </div><p style="margin-top:32px;color:#888">Thank you for your business • Auto-generated</p>
      </body></html>`)
    w.document.close(); w.print()
  }
  return (
    <Stack p={is480 ? 1 : 3} rowGap={3}>
      <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} flexWrap="wrap" gap={2}>
        <Stack flexDirection={'row'} alignItems={'center'} gap={1}><ReceiptLongIcon color="primary" /><Typography variant={is480 ? 'h5' : 'h4'} fontWeight={700}>Billing & Invoices</Typography></Stack>
        <Stack flexDirection={'row'} gap={1} flexWrap="wrap">
          {['all', 'ESEWA', 'KHALTI', 'COD', 'paid', 'pending'].map(f => (
            <Chip key={f} label={f.toUpperCase()} onClick={() => setFilter(f)} color={filter === f ? 'primary' : 'default'} variant={filter === f ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize' }} />
          ))}
        </Stack>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><Paper sx={{ p: 2, borderLeft: '4px solid #1976d2' }}><Typography variant="body2" color="text.secondary">Total Invoices</Typography><Typography variant="h4" fontWeight={700}>{stats?.totalInvoices ?? invoices.length}</Typography></Paper></Grid>
        <Grid item xs={12} sm={6} md={3}><Paper sx={{ p: 2, borderLeft: '4px solid #60BB46' }}><Typography variant="body2" color="text.secondary">Total Revenue</Typography><Typography variant="h4" fontWeight={700}>Rs. {(stats?.totalRevenue ?? invoices.reduce((a, b) => a + b.total, 0)).toFixed(2)}</Typography></Paper></Grid>
        <Grid item xs={12} sm={6} md={3}><Paper sx={{ p: 2, borderLeft: '4px solid #5C2D91' }}><Typography variant="body2" color="text.secondary">Paid</Typography><Typography variant="h4" fontWeight={700}>{stats?.paid ?? invoices.filter(i => i.paymentStatus === 'paid').length}</Typography></Paper></Grid>
        <Grid item xs={12} sm={6} md={3}><Paper sx={{ p: 2, borderLeft: '4px solid #ff9800' }}><Typography variant="body2" color="text.secondary">Pending</Typography><Typography variant="h4" fontWeight={700}>{stats?.pending ?? invoices.filter(i => i.paymentStatus === 'pending').length}</Typography></Paper></Grid>
      </Grid>
      <Paper sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }} elevation={0}>
        <AccountBalanceWalletIcon color="success" /><Typography variant="body2" fontWeight={600}>Payment gateways:</Typography>
        <Chip label="eSewa EPAYTEST" size="small" sx={{ bgcolor: '#E8F5E9' }} /><Chip label="Khalti auto-verify (mock when no SECRET)" size="small" sx={{ bgcolor: '#F3E5F5' }} /><Chip label="COD + Card" size="small" />
        <Typography variant="caption" color="text.secondary">• Env: ESEWA_MERCHANT_CODE, ESEWA_VERIFY_URL, KHALTI_SECRET_KEY, ORIGIN</Typography>
      </Paper>
      {filtered.length ? (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size={is480 ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><b>Invoice</b></TableCell>
                <TableCell><b>Order</b></TableCell>
                <TableCell><b>Billed To</b></TableCell>
                <TableCell align="right"><b>Total</b></TableCell>
                <TableCell align="center"><b>Provider</b></TableCell>
                <TableCell align="center"><b>Payment</b></TableCell>
                <TableCell align="center"><b>Date</b></TableCell>
                <TableCell align="center"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(inv => (
                <TableRow key={inv._id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600} color="primary">{inv.invoiceNumber}</Typography><Typography variant="caption" color="text.secondary">{inv.status}</Typography></TableCell>
                  <TableCell><Tooltip title={inv.order?._id || inv.order}><Typography variant="caption" sx={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{String(inv.order?._id || inv.order).slice(-8)}</Typography></Tooltip></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={500}>{inv.billingDetails.fullName}</Typography><Typography variant="caption" color="text.secondary">{inv.billingDetails.email}</Typography><br /><Typography variant="caption">{inv.billingDetails.city}, {inv.billingDetails.country}</Typography></TableCell>
                  <TableCell align="right"><Typography fontWeight={700}>Rs. {inv.total.toFixed(2)}</Typography><Typography variant="caption" color="text.secondary">S:{inv.shipping} T:{inv.taxes}</Typography></TableCell>
                  <TableCell align="center">{getProviderChip(inv.paymentProvider)}</TableCell>
                  <TableCell align="center">{getPaymentStatusChip(inv.paymentStatus)}</TableCell>
                  <TableCell align="center"><Typography variant="body2">{new Date(inv.issuedAt).toLocaleDateString()}</Typography></TableCell>
                  <TableCell align="center">
                    <Stack direction="row" gap={0.5} justifyContent="center">
                      <Button size="small" variant="contained" onClick={() => handlePrint(inv)}>Print</Button>
                      <Button size="small" variant="outlined" onClick={() => { navigator.clipboard.writeText(inv.invoiceNumber); toast.success('Copied') }}>Copy</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Stack width={is480 ? "auto" : '30rem'} justifyContent={'center'} alignSelf="center">
          <Lottie animationData={noOrdersAnimation} />
          <Typography textAlign={'center'} variant='h6' fontWeight={400}>No invoices yet — orders will auto-generate billing</Typography>
        </Stack>
      )}
      <Divider />
      <Typography variant="h6">Recent Payments</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Payment ID</TableCell><TableCell>Provider</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell><TableCell>User</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
          <TableBody>
            {payments.slice(0, 8).map(p => (
              <TableRow key={p._id}><TableCell><Typography variant="caption">{p.transactionId || p.pidx || p._id.slice(-8)}</Typography></TableCell><TableCell>{getProviderChip(p.provider)}</TableCell><TableCell align="right">Rs. {(p.amount > 1000 && p.provider === 'KHALTI' ? p.amount / 100 : p.amount).toFixed(2)}</TableCell><TableCell>{getPaymentStatusChip(p.status === 'completed' ? 'paid' : p.status)}</TableCell><TableCell><Typography variant="caption">{p.user?.email || p.user}</Typography></TableCell><TableCell><Typography variant="caption">{new Date(p.createdAt).toLocaleDateString()}</Typography></TableCell></TableRow>
            ))}
            {!payments.length && <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">No payments recorded</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
