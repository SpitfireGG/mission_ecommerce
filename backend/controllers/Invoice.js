const Invoice=require("../models/Invoice")
const Order=require("../models/Order")
const Payment=require("../models/Payment")
exports.getAll=async(req,res)=>{
    try{
        let skip=0,limit=0
        if(req.query.page && req.query.limit){const ps=parseInt(req.query.limit);const pg=parseInt(req.query.page);skip=ps*(pg-1);limit=ps}
        const total=await Invoice.find({}).countDocuments()
        const results=await Invoice.find({}).populate('order').populate('user','name email').populate('payment').skip(skip).limit(limit).sort({issuedAt:-1}).exec()
        res.header("X-Total-Count",total)
        res.status(200).json(results)
    }catch(err){console.log(err);res.status(500).json({message:'Error fetching invoices'})}
}
exports.getById=async(req,res)=>{
    try{const inv=await Invoice.findById(req.params.id).populate('order').populate('user','name email').populate('payment');if(!inv) return res.status(404).json({message:'Invoice not found'});res.status(200).json(inv)}catch(err){console.log(err);res.status(500).json({message:'Error fetching invoice'})}
}
exports.getByUserId=async(req,res)=>{
    try{const invs=await Invoice.find({user:req.params.id}).populate('order').populate('payment').sort({issuedAt:-1});res.status(200).json(invs)}catch(err){console.log(err);res.status(500).json({message:'Error fetching invoices'})}
}
exports.getByOrderId=async(req,res)=>{
    try{const inv=await Invoice.findOne({order:req.params.orderId}).populate('order').populate('user','name email').populate('payment');if(!inv) return res.status(404).json({message:'Invoice not found for order'});res.status(200).json(inv)}catch(err){console.log(err);res.status(500).json({message:'Error fetching invoice'})}
}
exports.generateForOrder=async(req,res)=>{
    try{
        const order=await Order.findById(req.params.orderId).populate('user')
        if(!order) return res.status(404).json({message:'Order not found'})
        const PaymentModel=require("../models/Payment")
        const existing=await Invoice.findOne({order:order._id})
        if(existing) return res.status(200).json(existing)
        const payment=order.payment?await PaymentModel.findById(order.payment):null
        const {createInvoiceForOrder}=require("./Payment")
        const inv=await createInvoiceForOrder(order,payment)
        res.status(201).json(inv)
    }catch(err){console.log(err);res.status(500).json({message:'Error generating invoice'})}
}
exports.updateById=async(req,res)=>{
    try{const updated=await Invoice.findByIdAndUpdate(req.params.id,req.body,{new:true});res.status(200).json(updated)}catch(err){console.log(err);res.status(500).json({message:'Error updating invoice'})}
}
exports.getStats=async(req,res)=>{
    try{
        const totalRevenueAgg=await Invoice.aggregate([{$group:{_id:null,total:{$sum:"$total"}}}])
        const total=await Invoice.countDocuments()
        const paid=await Invoice.countDocuments({paymentStatus:'paid'})
        const pending=await Invoice.countDocuments({paymentStatus:'pending'})
        res.status(200).json({totalInvoices:total,totalRevenue:totalRevenueAgg[0]?.total||0,paid,pending})
    }catch(err){console.log(err);res.status(500).json({message:'Error fetching stats'})}
}
