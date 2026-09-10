import {axiosi} from '../../config/axios'
export const getAllInvoices=async()=>{const r=await axiosi.get("/invoices");return r.data}
export const getInvoiceById=async(id)=>{const r=await axiosi.get(`/invoices/${id}`);return r.data}
export const getInvoicesByUser=async(id)=>{const r=await axiosi.get(`/invoices/user/${id}`);return r.data}
export const getInvoiceByOrder=async(orderId)=>{const r=await axiosi.get(`/invoices/order/${orderId}`);return r.data}
export const generateInvoice=async(orderId)=>{const r=await axiosi.post(`/invoices/generate/${orderId}`);return r.data}
export const getInvoiceStats=async()=>{const r=await axiosi.get("/invoices/stats/summary");return r.data}
