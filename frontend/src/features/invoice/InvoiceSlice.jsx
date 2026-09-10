import {createAsyncThunk,createSlice} from '@reduxjs/toolkit'
import {getAllInvoices,getInvoiceById,getInvoicesByUser,getInvoiceByOrder,generateInvoice,getInvoiceStats} from './InvoiceApi'
const initialState={status:'idle',invoices:[],currentInvoice:null,stats:null,error:null}
export const getAllInvoicesAsync=createAsyncThunk('invoice/getAll',async()=>{const r=await getAllInvoices();return r})
export const getInvoiceByIdAsync=createAsyncThunk('invoice/getById',async(id)=>{const r=await getInvoiceById(id);return r})
export const getInvoicesByUserAsync=createAsyncThunk('invoice/getByUser',async(id)=>{const r=await getInvoicesByUser(id);return r})
export const getInvoiceByOrderAsync=createAsyncThunk('invoice/getByOrder',async(orderId)=>{const r=await getInvoiceByOrder(orderId);return r})
export const generateInvoiceAsync=createAsyncThunk('invoice/generate',async(orderId)=>{const r=await generateInvoice(orderId);return r})
export const getInvoiceStatsAsync=createAsyncThunk('invoice/stats',async()=>{const r=await getInvoiceStats();return r})
const invoiceSlice=createSlice({
    name:'invoiceSlice',initialState,
    reducers:{resetInvoiceStatus:(s)=>{s.status='idle'}},
    extraReducers:(builder)=>{
        builder
        .addCase(getAllInvoicesAsync.pending,(s)=>{s.status='pending'})
        .addCase(getAllInvoicesAsync.fulfilled,(s,a)=>{s.status='fulfilled';s.invoices=a.payload})
        .addCase(getAllInvoicesAsync.rejected,(s,a)=>{s.status='rejected';s.error=a.error})
        .addCase(getInvoiceByIdAsync.fulfilled,(s,a)=>{s.currentInvoice=a.payload})
        .addCase(getInvoicesByUserAsync.fulfilled,(s,a)=>{s.invoices=a.payload})
        .addCase(getInvoiceByOrderAsync.fulfilled,(s,a)=>{s.currentInvoice=a.payload})
        .addCase(generateInvoiceAsync.fulfilled,(s,a)=>{s.currentInvoice=a.payload;s.invoices.push(a.payload)})
        .addCase(getInvoiceStatsAsync.fulfilled,(s,a)=>{s.stats=a.payload})
    }
})
export const {resetInvoiceStatus}=invoiceSlice.actions
export const selectInvoices=(s)=>s.InvoiceSlice.invoices
export const selectCurrentInvoice=(s)=>s.InvoiceSlice.currentInvoice
export const selectInvoiceStats=(s)=>s.InvoiceSlice.stats
export const selectInvoiceStatus=(s)=>s.InvoiceSlice.status
export default invoiceSlice.reducer
