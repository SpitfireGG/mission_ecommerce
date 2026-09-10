import {createAsyncThunk,createSlice} from '@reduxjs/toolkit'
import {initiatePayment,verifyEsewa,verifyKhalti,getAllPayments,getPaymentsByUser} from './PaymentApi'
const initialState={status:'idle',initiateStatus:'idle',verifyStatus:'idle',payments:[],currentPayment:null,esewaConfig:null,khaltiData:null,error:null}
export const initiatePaymentAsync=createAsyncThunk('payment/initiate',async(data)=>{const r=await initiatePayment(data);return r})
export const verifyEsewaAsync=createAsyncThunk('payment/verifyEsewa',async(data)=>{const r=await verifyEsewa(data);return r})
export const verifyKhaltiAsync=createAsyncThunk('payment/verifyKhalti',async(data)=>{const r=await verifyKhalti(data);return r})
export const getAllPaymentsAsync=createAsyncThunk('payment/getAll',async()=>{const r=await getAllPayments();return r})
export const getPaymentsByUserAsync=createAsyncThunk('payment/getByUser',async(id)=>{const r=await getPaymentsByUser(id);return r})
const paymentSlice=createSlice({
    name:'paymentSlice',initialState,
    reducers:{resetPaymentStatus:(s)=>{s.initiateStatus='idle';s.verifyStatus='idle';s.error=null},clearCurrentPayment:(s)=>{s.currentPayment=null;s.esewaConfig=null;s.khaltiData=null}},
    extraReducers:(builder)=>{
        builder
        .addCase(initiatePaymentAsync.pending,(s)=>{s.initiateStatus='pending'})
        .addCase(initiatePaymentAsync.fulfilled,(s,a)=>{s.initiateStatus='fulfilled';s.currentPayment=a.payload.payment||a.payload;s.esewaConfig=a.payload.esewaConfig||null;s.khaltiData=a.payload.khalti||null})
        .addCase(initiatePaymentAsync.rejected,(s,a)=>{s.initiateStatus='rejected';s.error=a.error})
        .addCase(verifyEsewaAsync.pending,(s)=>{s.verifyStatus='pending'})
        .addCase(verifyEsewaAsync.fulfilled,(s,a)=>{s.verifyStatus='fulfilled';s.currentPayment=a.payload.payment})
        .addCase(verifyEsewaAsync.rejected,(s,a)=>{s.verifyStatus='rejected';s.error=a.error})
        .addCase(verifyKhaltiAsync.pending,(s)=>{s.verifyStatus='pending'})
        .addCase(verifyKhaltiAsync.fulfilled,(s,a)=>{s.verifyStatus='fulfilled';s.currentPayment=a.payload.payment})
        .addCase(verifyKhaltiAsync.rejected,(s,a)=>{s.verifyStatus='rejected';s.error=a.error})
        .addCase(getAllPaymentsAsync.fulfilled,(s,a)=>{s.payments=a.payload})
        .addCase(getPaymentsByUserAsync.fulfilled,(s,a)=>{s.payments=a.payload})
    }
})
export const {resetPaymentStatus,clearCurrentPayment}=paymentSlice.actions
export const selectPaymentStatus=(s)=>s.PaymentSlice.initiateStatus
export const selectVerifyStatus=(s)=>s.PaymentSlice.verifyStatus
export const selectCurrentPayment=(s)=>s.PaymentSlice.currentPayment
export const selectEsewaConfig=(s)=>s.PaymentSlice.esewaConfig
export const selectKhaltiData=(s)=>s.PaymentSlice.khaltiData
export const selectPayments=(s)=>s.PaymentSlice.payments
export default paymentSlice.reducer
