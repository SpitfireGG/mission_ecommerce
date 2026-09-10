const Payment=require("../models/Payment")
const Order=require("../models/Order")
const Invoice=require("../models/Invoice")
const crypto=require("crypto")
const generateInvoiceNumber=()=>{
    const d=new Date()
    return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}
const createInvoiceForOrder=async(order,payment)=>{
    const existing=await Invoice.findOne({order:order._id})
    if(existing) return existing
    const addr=Array.isArray(order.address)?order.address[0]:order.address
    const billing=order.billingDetails || {
        fullName:addr?.type || "Customer",
        email:"customer@example.com",
        phone:addr?.phoneNumber || "",
        street:addr?.street || "",
        city:addr?.city || "",
        state:addr?.state || "",
        country:addr?.country || "",
        postalCode:String(addr?.postalCode || ""),
        panVat:""
    }
    const subtotal=order.total - 5.55 - 5
    const inv=new Invoice({
        invoiceNumber:generateInvoiceNumber(),
        order:order._id,
        user:order.user,
        payment:payment?._id,
        billingDetails:{
            fullName:billing.fullName || billing.name || addr?.type || "Customer",
            email:billing.email || "customer@example.com",
            phone:billing.phone || addr?.phoneNumber || "",
            street:billing.street || addr?.street || "",
            city:billing.city || addr?.city || "",
            state:billing.state || addr?.state || "",
            country:billing.country || addr?.country || "",
            postalCode:String(billing.postalCode || addr?.postalCode || ""),
            panVat:billing.panVat || ""
        },
        items:order.item,
        subtotal:subtotal>0?subtotal:order.total,
        shipping:5.55,
        taxes:5,
        total:order.total,
        paymentProvider:order.paymentMode,
        paymentStatus:payment?.status==='completed'?'paid':order.paymentMode==='COD'?'pending':'pending',
        status:'issued',
        dueDate:new Date(Date.now()+7*24*60*60*1000)
    })
    await inv.save()
    await Order.findByIdAndUpdate(order._id,{invoice:inv._id})
    return inv
}
exports.initiate=async(req,res)=>{
    try{
        const {orderId,provider,amount,user,billingDetails}=req.body
        if(!provider || !amount) return res.status(400).json({message:'provider and amount required'})
        let order=null
        if(orderId) order=await Order.findById(orderId)
        const validProviders=['COD','ESEWA','KHALTI','CARD','UPI']
        if(!validProviders.includes(provider)) return res.status(400).json({message:'Invalid provider'})
        if(provider==='COD'){
            const payment=new Payment({user:user||order?.user,order:order?._id,amount,provider,status:'pending'})
            await payment.save()
            if(order){
                order.payment=payment._id
                order.paymentStatus='pending'
                if(billingDetails) order.billingDetails=billingDetails
                await order.save()
                const inv=await createInvoiceForOrder(order,payment)
                return res.status(201).json({payment,invoice:inv,message:'COD order placed, pay on delivery'})
            }
            return res.status(201).json({payment,message:'COD payment created'})
        }
        if(provider==='ESEWA'){
            const payment=new Payment({user:user||order?.user,order:order?._id,amount,provider,status:'initiated',transactionId:`ESEWA-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`})
            await payment.save()
            if(order){
                order.payment=payment._id
                order.paymentStatus='pending'
                if(billingDetails) order.billingDetails=billingDetails
                await order.save()
            }
            const esewaConfig={
                amt:amount,
                psc:0, pdc:0, txAmt:0, tAmt:amount,
                pid:payment.transactionId,
                scd:process.env.ESEWA_MERCHANT_CODE||"EPAYTEST",
                su:process.env.ESEWA_SUCCESS_URL||`${process.env.ORIGIN||'http://localhost:3000'}/payment/success`,
                fu:process.env.ESEWA_FAILURE_URL||`${process.env.ORIGIN||'http://localhost:3000'}/payment/failure`
            }
            return res.status(201).json({payment,esewaConfig,gatewayUrl:process.env.ESEWA_GATEWAY_URL||"https://rc-epay.esewa.com.np/api/epay/main"})
        }
        if(provider==='KHALTI'){
            const pidx=`KHALTI-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
            const payment=new Payment({user:user||order?.user,order:order?._id,amount:amount*100,provider,status:'initiated',pidx,transactionId:pidx})
            await payment.save()
            if(order){
                order.payment=payment._id
                order.paymentStatus='pending'
                if(billingDetails) order.billingDetails=billingDetails
                await order.save()
            }
            const khaltiPayload={
                return_url:process.env.KHALTI_RETURN_URL||`${process.env.ORIGIN||'http://localhost:3000'}/payment/khalti/callback`,
                website_url:process.env.ORIGIN||'http://localhost:3000',
                amount:amount*100,
                purchase_order_id:payment.transactionId,
                purchase_order_name:`Order ${order?._id||payment._id}`,
                customer_info:billingDetails?{name:billingDetails.fullName,email:billingDetails.email,phone:billingDetails.phone}:undefined
            }
            const shouldMock=!process.env.KHALTI_SECRET_KEY
            if(shouldMock){
                return res.status(201).json({payment,khalti:{pidx,payment_url:`${khaltiPayload.return_url}?pidx=${pidx}&purchase_order_id=${payment.transactionId}&transaction_id=mock-${pidx}&status=Completed`},mock:true})
            }
            try{
                const resp=await fetch("https://a.khalti.com/api/v2/epayment/initiate/",{
                    method:"POST",
                    headers:{"Authorization":`Key ${process.env.KHALTI_SECRET_KEY}`,"Content-Type":"application/json"},
                    body:JSON.stringify(khaltiPayload)
                })
                const data=await resp.json()
                if(data.pidx) payment.pidx=data.pidx
                payment.gatewayResponse=data
                await payment.save()
                return res.status(201).json({payment,khalti:data})
            }catch(e){
                return res.status(201).json({payment,khalti:{pidx,payment_url:khaltiPayload.return_url},mock:true,warning:'Khalti live failed, mock returned'})
            }
        }
        return res.status(400).json({message:'Unsupported provider'})
    }catch(err){console.log(err);res.status(500).json({message:'Error initiating payment'})}
}
exports.verifyEsewa=async(req,res)=>{
    try{
        const {oid,amt,refId,orderId}=req.body
        if(!oid||!amt) return res.status(400).json({message:'oid and amt required'})
        let payment=await Payment.findOne({transactionId:oid})
        if(!payment) payment=await Payment.findOne({pidx:oid})
        if(!payment) return res.status(404).json({message:'Payment not found'})
        const esewaVerifyUrl=process.env.ESEWA_VERIFY_URL||"https://rc-epay.esewa.com.np/api/epay/transaction/status/"
        let verified=false
        if(process.env.ESEWA_MERCHANT_CODE && refId){
            try{
                const vResp=await fetch(`${esewaVerifyUrl}?amt=${amt}&rid=${refId}&pid=${oid}&scd=${process.env.ESEWA_MERCHANT_CODE}`,{method:"GET"})
                const vData=await vResp.text()
                verified=vData.includes("Success")||vData.includes("success")
                payment.gatewayResponse={refId,verifyResponse:vData}
            }catch(e){payment.gatewayResponse={refId,verifyError:e.message}}
        } else {
            verified=true
            payment.gatewayResponse={refId,mock:true}
        }
        if(verified){
            payment.status='completed'
            payment.verifiedAt=new Date()
            await payment.save()
            if(payment.order){
                const order=await Order.findByIdAndUpdate(payment.order,{paymentStatus:'paid'},{new:true})
                if(order) await createInvoiceForOrder(order,payment)
            }
            return res.status(200).json({verified:true,payment,message:'eSewa payment verified'})
        } else {
            payment.status='failed'
            await payment.save()
            if(payment.order) await Order.findByIdAndUpdate(payment.order,{paymentStatus:'failed'})
            return res.status(400).json({verified:false,payment,message:'eSewa verification failed'})
        }
    }catch(err){console.log(err);res.status(500).json({message:'Error verifying eSewa payment'})}
}
exports.verifyKhalti=async(req,res)=>{
    try{
        const {pidx,orderId}=req.body
        if(!pidx) return res.status(400).json({message:'pidx required'})
        let payment=await Payment.findOne({pidx})
        if(!payment) payment=await Payment.findOne({transactionId:pidx})
        if(!payment) return res.status(404).json({message:'Payment not found'})
        let verified=false
        let gatewayData=null
        if(process.env.KHALTI_SECRET_KEY){
            try{
                const resp=await fetch("https://a.khalti.com/api/v2/epayment/lookup/",{
                    method:"POST",
                    headers:{"Authorization":`Key ${process.env.KHALTI_SECRET_KEY}`,"Content-Type":"application/json"},
                    body:JSON.stringify({pidx})
                })
                gatewayData=await resp.json()
                verified=gatewayData.status==='Completed'
                payment.gatewayResponse=gatewayData
            }catch(e){gatewayData={error:e.message};verified=pidx.startsWith('KHALTI-')}
        } else {
            verified=true
            gatewayData={mock:true,pidx,status:"Completed"}
            payment.gatewayResponse=gatewayData
        }
        if(verified){
            payment.status='completed'
            payment.verifiedAt=new Date()
            await payment.save()
            if(payment.order){
                const order=await Order.findByIdAndUpdate(payment.order,{paymentStatus:'paid'},{new:true})
                if(order) await createInvoiceForOrder(order,payment)
            }
            return res.status(200).json({verified:true,payment,message:'Khalti payment verified'})
        } else {
            payment.status='failed'
            await payment.save()
            if(payment.order) await Order.findByIdAndUpdate(payment.order,{paymentStatus:'failed'})
            return res.status(400).json({verified:false,payment,gatewayData,message:'Khalti verification failed'})
        }
    }catch(err){console.log(err);res.status(500).json({message:'Error verifying Khalti payment'})}
}
exports.getAll=async(req,res)=>{
    try{
        let skip=0,limit=0
        if(req.query.page && req.query.limit){const ps=parseInt(req.query.limit);const pg=parseInt(req.query.page);skip=ps*(pg-1);limit=ps}
        const total=await Payment.find({}).countDocuments()
        const results=await Payment.find({}).populate('order').populate('user','name email').skip(skip).limit(limit).sort({createdAt:-1}).exec()
        res.header("X-Total-Count",total)
        res.status(200).json(results)
    }catch(err){console.log(err);res.status(500).json({message:'Error fetching payments'})}
}
exports.getByUserId=async(req,res)=>{
    try{const {id}=req.params;const results=await Payment.find({user:id}).populate('order').sort({createdAt:-1});res.status(200).json(results)}catch(err){console.log(err);res.status(500).json({message:'Error fetching user payments'})}
}
exports.getById=async(req,res)=>{
    try{const payment=await Payment.findById(req.params.id).populate('order').populate('user','name email');if(!payment) return res.status(404).json({message:'Payment not found'});res.status(200).json(payment)}catch(err){console.log(err);res.status(500).json({message:'Error fetching payment'})}
}
exports.updateStatus=async(req,res)=>{
    try{const updated=await Payment.findByIdAndUpdate(req.params.id,req.body,{new:true});if(updated.order && req.body.status==='completed') await Order.findByIdAndUpdate(updated.order,{paymentStatus:'paid'});res.status(200).json(updated)}catch(err){console.log(err);res.status(500).json({message:'Error updating payment'})}
}
exports.createInvoiceForOrder=createInvoiceForOrder
