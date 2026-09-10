const Order = require("../models/Order");
const Payment=require("../models/Payment")

exports.create=async(req,res)=>{
    try {
        const {billingDetails,paymentMode}=req.body
        if(paymentMode && !['COD','UPI','CARD','ESEWA','KHALTI'].includes(paymentMode)){
            return res.status(400).json({message:'Invalid payment mode'})
        }
        const created=new Order(req.body)
        if(billingDetails) created.billingDetails=billingDetails
        if(paymentMode==='ESEWA' || paymentMode==='KHALTI' || paymentMode==='CARD' || paymentMode==='UPI'){
            created.paymentStatus='pending'
        } else if(paymentMode==='COD'){
            created.paymentStatus='pending'
        }
        await created.save()
        if(paymentMode==='COD'){
            const payment=new Payment({user:created.user,order:created._id,amount:created.total,provider:'COD',status:'pending'})
            await payment.save()
            created.payment=payment._id
            await created.save()
            const {createInvoiceForOrder}=require("./Payment")
            const inv=await createInvoiceForOrder(created,payment)
            created.invoice=inv._id
            await created.save()
        }
        const populated=await Order.findById(created._id).populate('payment').populate('invoice')
        res.status(201).json(populated||created)
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:'Error creating an order, please trying again later'})
    }
}

exports.getByUserId=async(req,res)=>{
    try {
        const {id}=req.params
        const results=await Order.find({user:id}).populate('payment').populate('invoice').sort({createdAt:-1})
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:'Error fetching orders, please trying again later'})
    }
}

exports.getAll = async (req, res) => {
    try {
        let skip=0
        let limit=0

        if(req.query.page && req.query.limit){
            const pageSize=req.query.limit
            const page=req.query.page
            skip=pageSize*(page-1)
            limit=pageSize
        }

        const totalDocs=await Order.find({}).countDocuments().exec()
        const results=await Order.find({}).populate('payment').populate('invoice').skip(skip).limit(limit).sort({createdAt:-1}).exec()

        res.header("X-Total-Count",totalDocs)
        res.status(200).json(results)

    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error fetching orders, please try again later'})
    }
};

exports.updateById=async(req,res)=>{
    try {
        const {id}=req.params
        const updated=await Order.findByIdAndUpdate(id,req.body,{new:true})
        res.status(200).json(updated)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error updating order, please try again later'})
    }
}
