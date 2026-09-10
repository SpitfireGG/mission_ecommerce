import { Stack, TextField, Typography, Button, Grid, FormControl, Radio, Paper, IconButton, Box, useTheme, useMediaQuery, Divider, Chip, Alert } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import React, { useEffect, useState } from 'react'
import { Cart } from '../../cart/components/Cart'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { addAddressAsync, selectAddressStatus, selectAddresses } from '../../address/AddressSlice'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import { Link, useNavigate } from 'react-router-dom'
import { createOrderAsync, selectCurrentOrder, selectOrderStatus } from '../../order/OrderSlice'
import { resetCartByUserIdAsync, selectCartItems } from '../../cart/CartSlice'
import { selectUserInfo } from '../../user/UserSlice'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SHIPPING, VAT_RATE } from '../../../constants'
import { motion } from 'framer-motion'
import { initiatePaymentAsync, selectPaymentStatus, selectEsewaConfig, selectKhaltiData, verifyEsewaAsync, verifyKhaltiAsync, selectVerifyStatus } from '../../payment/PaymentSlice'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
export const Checkout = () => {
    const addresses = useSelector(selectAddresses)
    const [selectedAddress, setSelectedAddress] = useState(addresses[0])
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD')
    const { register: registerAddress, handleSubmit: handleAddressSubmit, reset: resetAddress } = useForm()
    const { register: registerBilling, handleSubmit: handleBillingSubmit, watch: watchBilling, setValue: setBillingValue, formState: { errors: billingErrors } } = useForm({
        defaultValues: { fullName: "", email: "", phone: "", street: "", city: "", state: "", country: "Nepal", postalCode: "", panVat: "" }
    })
    const dispatch = useDispatch()
    const loggedInUser = useSelector(selectLoggedInUser)
    const userInfo = useSelector(selectUserInfo)
    const addressStatus = useSelector(selectAddressStatus)
    const navigate = useNavigate()
    const cartItems = useSelector(selectCartItems)
    const orderStatus = useSelector(selectOrderStatus)
    const currentOrder = useSelector(selectCurrentOrder)
    const paymentStatus = useSelector(selectPaymentStatus)
    const verifyStatus = useSelector(selectVerifyStatus)
    const esewaConfig = useSelector(selectEsewaConfig)
    const khaltiData = useSelector(selectKhaltiData)
    const orderTotal = cartItems.reduce((acc, item) => (item.product.price * item.quantity) + acc, 0)
    const theme = useTheme()
    const is900 = useMediaQuery(theme.breakpoints.down(900))
    const is480 = useMediaQuery(theme.breakpoints.down(480))
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
    const [pendingOrder, setPendingOrder] = useState(null)
    useEffect(() => {
        if (userInfo) {
            setBillingValue('fullName', userInfo.name || "")
            setBillingValue('email', userInfo.email || "")
        }
    }, [userInfo])
    useEffect(() => {
        if (selectedAddress && billingSameAsShipping) {
            setBillingValue('street', selectedAddress.street || "")
            setBillingValue('city', selectedAddress.city || "")
            setBillingValue('state', selectedAddress.state || "")
            setBillingValue('country', selectedAddress.country || "Nepal")
            setBillingValue('postalCode', selectedAddress.postalCode || "")
            setBillingValue('phone', selectedAddress.phoneNumber || "")
        }
    }, [selectedAddress, billingSameAsShipping])
    useEffect(() => {
        if (addressStatus === 'fulfilled') resetAddress()
        else if (addressStatus === 'rejected') alert('Error adding your address')
    }, [addressStatus])
    useEffect(() => {
        if (addresses.length && !selectedAddress) setSelectedAddress(addresses[0])
    }, [addresses])
    useEffect(() => {
        if (currentOrder && currentOrder?._id) {
            dispatch(resetCartByUserIdAsync(loggedInUser?._id))
            navigate(`/order-success/${currentOrder?._id}`)
        }
    }, [currentOrder])
    useEffect(() => {
        if (paymentStatus === 'fulfilled' && pendingOrder) {
            if (selectedPaymentMethod === 'ESEWA' && esewaConfig) {
                dispatch(verifyEsewaAsync({ oid: esewaConfig.pid, amt: esewaConfig.tAmt, refId: `mock-${esewaConfig.pid}`, orderId: pendingOrder?._id }))
            }
            if (selectedPaymentMethod === 'KHALTI' && khaltiData) {
                const pidx = khaltiData.pidx || khaltiData?.pidx
                if (pidx) dispatch(verifyKhaltiAsync({ pidx }))
            }
        }
    }, [paymentStatus, esewaConfig, khaltiData])
    useEffect(() => {
        if (verifyStatus === 'fulfilled' && pendingOrder) {
            const order = { ...pendingOrder, paymentStatus: 'paid' }
            dispatch(createOrderAsync(order))
            setPendingOrder(null)
        }
    }, [verifyStatus])
    const handleAddAddress = (data) => {
        const address = { ...data, user: loggedInUser._id }
        dispatch(addAddressAsync(address))
    }
    const onBillingSubmit = (billingData) => {
        if (!selectedAddress) { alert('Please select shipping address'); return }
        if (!cartItems.length) { alert('Cart is empty'); return }
        const taxes = Math.round(orderTotal * VAT_RATE)
        const order = { user: loggedInUser._id, item: cartItems, address: selectedAddress, billingDetails: billingData, paymentMode: selectedPaymentMethod, total: orderTotal + SHIPPING + taxes }
        if (selectedPaymentMethod === 'COD' || selectedPaymentMethod === 'CARD') {
            dispatch(createOrderAsync(order))
        } else {
            setPendingOrder(order)
            dispatch(initiatePaymentAsync({ provider: selectedPaymentMethod, amount: orderTotal + SHIPPING + Math.round(orderTotal * VAT_RATE), user: loggedInUser._id, billingDetails: billingData }))
        }
    }
    const handleCreateOrder = handleBillingSubmit(onBillingSubmit)
    const paymentOptions = [
        { value: 'COD', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: <PaymentsIcon />, color: '#E8F5E9' },
        { value: 'ESEWA', label: 'eSewa', desc: 'Nepal #1 digital wallet', icon: <Box sx={{ bgcolor: '#60BB46', color: 'white', px: 1, py: 0.2, borderRadius: 1, fontWeight: 700, fontSize: 12 }}>eSewa</Box>, color: '#E8F5E9' },
        { value: 'KHALTI', label: 'Khalti', desc: 'Pay via Khalti wallet', icon: <Box sx={{ bgcolor: '#5C2D91', color: 'white', px: 1, py: 0.2, borderRadius: 1, fontWeight: 700, fontSize: 12 }}>Khalti</Box>, color: '#F3E5F5' },
        { value: 'CARD', label: 'Card / UPI', desc: 'Credit, Debit & UPI', icon: <CreditCardIcon />, color: '#E3F2FD' },
    ]
    return (
        <Stack flexDirection={'row'} p={2} rowGap={10} justifyContent={'center'} flexWrap={'wrap'} mb={'5rem'} mt={2} columnGap={4} alignItems={'flex-start'}>
            <Stack rowGap={4} flex={1} maxWidth={is900 ? '100%' : '42rem'}>
                <Stack flexDirection={'row'} columnGap={is480 ? 0.3 : 1} alignItems={'center'}>
                    <motion.div whileHover={{ x: -5 }}>
                        <IconButton component={Link} to={"/cart"}><ArrowBackIcon fontSize={is480 ? "medium" : 'large'} /></IconButton>
                    </motion.div>
                    <Typography variant='h4'>Checkout</Typography>
                    <Chip size="small" icon={<ReceiptLongIcon />} label="Secure billing" sx={{ ml: 1 }} />
                </Stack>
                <Stack component={'form'} noValidate rowGap={2} onSubmit={handleAddressSubmit(handleAddAddress)} sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                    <Typography variant='h6'>Shipping Information</Typography>
                    <Stack>
                        <Typography gutterBottom>Type</Typography>
                        <TextField placeholder='Eg. Home, Business' {...registerAddress("type", { required: true })} size="small" />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Street</Typography>
                        <TextField {...registerAddress("street", { required: true })} size="small" />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Country</Typography>
                        <TextField {...registerAddress("country", { required: true })} size="small" />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Phone Number</Typography>
                        <TextField type='number' {...registerAddress("phoneNumber", { required: true })} size="small" />
                    </Stack>
                    <Stack flexDirection={'row'} gap={1}>
                        <Stack width={'100%'}><Typography gutterBottom>City</Typography><TextField {...registerAddress("city", { required: true })} size="small" /></Stack>
                        <Stack width={'100%'}><Typography gutterBottom>State</Typography><TextField {...registerAddress("state", { required: true })} size="small" /></Stack>
                        <Stack width={'100%'}><Typography gutterBottom>Postal Code</Typography><TextField type='number' {...registerAddress("postalCode", { required: true })} size="small" /></Stack>
                    </Stack>
                    <Stack flexDirection={'row'} alignSelf={'flex-end'} columnGap={1}>
                        <LoadingButton loading={addressStatus === 'pending'} type='submit' variant='contained'>add</LoadingButton>
                        <Button color='error' variant='outlined' onClick={() => resetAddress()}>Reset</Button>
                    </Stack>
                </Stack>
                <Stack rowGap={3}>
                    <Stack>
                        <Typography variant='h6'>Choose Shipping Address</Typography>
                        <Typography variant='body2' color={'text.secondary'}>Select where to deliver your order</Typography>
                    </Stack>
                    <Grid container gap={2} justifyContent={'flex-start'} alignContent={'flex-start'}>
                        {addresses.map((address, index) => (
                            <FormControl key={address._id}>
                                <Stack p={2} width={is480 ? '100%' : '20rem'} height={'auto'} rowGap={1} component={Paper} elevation={selectedAddress?._id === address._id ? 3 : 1} sx={{ border: selectedAddress?._id === address._id ? '2px solid #1976d2' : '1px solid #e0e0e0', cursor: 'pointer' }} onClick={() => setSelectedAddress(address)}>
                                    <Stack flexDirection={'row'} alignItems={'center'}>
                                        <Radio checked={selectedAddress?._id === address._id} onChange={() => setSelectedAddress(address)} />
                                        <Typography fontWeight={600}>{address.type}</Typography>
                                    </Stack>
                                    <Stack>
                                        <Typography variant="body2">{address.street}</Typography>
                                        <Typography variant="body2">{address.state}, {address.city}, {address.country}, {address.postalCode}</Typography>
                                        <Typography variant="body2">{address.phoneNumber}</Typography>
                                    </Stack>
                                </Stack>
                            </FormControl>
                        ))}
                    </Grid>
                </Stack>
                <Divider />
                <Stack rowGap={2} component={'form'} noValidate onSubmit={handleBillingSubmit(onBillingSubmit)} id="billing-form">
                    <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
                        <Stack>
                            <Typography variant='h6'>Billing Details</Typography>
                            <Typography variant='body2' color={'text.secondary'}>For invoice & payment verification</Typography>
                        </Stack>
                        <Stack flexDirection={'row'} alignItems={'center'}>
                            <Radio checked={billingSameAsShipping} onChange={() => setBillingSameAsShipping(!billingSameAsShipping)} />
                            <Typography variant="body2">Same as shipping</Typography>
                        </Stack>
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name" size="small" {...registerBilling("fullName", { required: true })} error={!!billingErrors.fullName} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" size="small" {...registerBilling("email", { required: true })} error={!!billingErrors.email} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" size="small" {...registerBilling("phone", { required: true })} error={!!billingErrors.phone} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="PAN/VAT (optional)" size="small" {...registerBilling("panVat")} /></Grid>
                        <Grid item xs={12}><TextField fullWidth label="Street" size="small" {...registerBilling("street", { required: true })} error={!!billingErrors.street} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="City" size="small" {...registerBilling("city", { required: true })} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="State" size="small" {...registerBilling("state", { required: true })} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Postal Code" size="small" {...registerBilling("postalCode", { required: true })} /></Grid>
                        <Grid item xs={12}><TextField fullWidth label="Country" size="small" {...registerBilling("country", { required: true })} /></Grid>
                    </Grid>
                    {(paymentStatus === 'pending' || verifyStatus === 'pending') && <Alert severity="info">Processing {selectedPaymentMethod} payment — please wait...</Alert>}
                    {esewaConfig && <Alert severity="success">eSewa initiated: {esewaConfig.pid} — verifying...</Alert>}
                    {khaltiData && <Alert severity="success">Khalti initiated: {khaltiData.pidx || khaltiData.payment_url} — verifying...</Alert>}
                </Stack>
                <Stack rowGap={3}>
                    <Stack>
                        <Typography variant='h6'>Payment Methods</Typography>
                        <Typography variant='body2' color={'text.secondary'}>Choose how you want to pay • eSewa & Khalti supported</Typography>
                    </Stack>
                    <Grid container spacing={1.5}>
                        {paymentOptions.map(opt => (
                            <Grid item xs={12} sm={6} key={opt.value}>
                                <Paper onClick={() => setSelectedPaymentMethod(opt.value)} elevation={selectedPaymentMethod === opt.value ? 4 : 1} sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', cursor: 'pointer', border: selectedPaymentMethod === opt.value ? '2px solid #1976d2' : '1px solid #e0e0e0', bgcolor: selectedPaymentMethod === opt.value ? opt.color : 'white' }}>
                                    <Radio checked={selectedPaymentMethod === opt.value} onChange={() => setSelectedPaymentMethod(opt.value)} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>{opt.icon}</Box>
                                    <Stack>
                                        <Typography fontWeight={600} variant="body2">{opt.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                        <Chip icon={<AccountBalanceWalletIcon />} label="eSewa test: EPAYTEST" size="small" variant="outlined" />
                        <Chip label="Khalti test: mock auto-verify" size="small" variant="outlined" />
                        <Chip label="COD available everywhere" size="small" variant="outlined" />
                    </Stack>
                </Stack>
            </Stack>
            <Stack width={is900 ? '100%' : '28rem'} position={is900 ? 'static' : 'sticky'} top={80} rowGap={2}>
                <Typography variant='h4'>Order summary</Typography>
                <Cart checkout={true} />
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }} elevation={0}>
                    <Stack rowGap={0.5}>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Subtotal</Typography><Typography variant="body2">Rs. {orderTotal.toLocaleString("en-IN")}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Shipping</Typography><Typography variant="body2">Rs. {SHIPPING.toLocaleString("en-IN")}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">VAT (13%)</Typography><Typography variant="body2">Rs. {Math.round(orderTotal*VAT_RATE).toLocaleString("en-IN")}</Typography></Stack>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>Total</Typography><Typography fontWeight={700}>Rs. {(orderTotal + SHIPPING + Math.round(orderTotal*VAT_RATE)).toLocaleString("en-IN")}</Typography></Stack>
                        <Typography variant="caption" color="text.secondary">Invoice will be auto-generated • Billing details included</Typography>
                    </Stack>
                </Paper>
                <LoadingButton fullWidth loading={orderStatus === 'pending' || paymentStatus === 'pending' || verifyStatus === 'pending'} variant='contained' onClick={handleCreateOrder} size='large' sx={{ py: 1.5, fontWeight: 700 }}>
                    {selectedPaymentMethod === 'COD' ? 'Place Order — Pay on Delivery' : selectedPaymentMethod === 'ESEWA' ? 'Pay with eSewa' : selectedPaymentMethod === 'KHALTI' ? 'Pay with Khalti' : 'Pay and Order'}
                </LoadingButton>
                <Typography variant="caption" color="text.secondary" textAlign="center">🔒 Secure payment • Invoice emailed after order</Typography>
                {khaltiData?.payment_url && selectedPaymentMethod === 'KHALTI' && <Button variant="outlined" href={khaltiData.payment_url} target="_blank">Open Khalti Checkout</Button>}
            </Stack>
        </Stack>
    )
}
