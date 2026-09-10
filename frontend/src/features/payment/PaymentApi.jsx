import {axiosi} from '../../config/axios'
export const initiatePayment=async(data)=>{
    const res=await axiosi.post("/payments/initiate",data)
    return res.data
}
export const verifyEsewa=async(data)=>{
    const res=await axiosi.post("/payments/esewa/verify",data)
    return res.data
}
export const verifyKhalti=async(data)=>{
    const res=await axiosi.post("/payments/khalti/verify",data)
    return res.data
}
export const getPaymentsByUser=async(id)=>{
    const res=await axiosi.get(`/payments/user/${id}`)
    return res.data
}
export const getAllPayments=async()=>{
    const res=await axiosi.get("/payments")
    return res.data
}
