const bcrypt=require('bcryptjs')
const User=require('../models/User')
const Product=require('../models/Product')
const Order=require('../models/Order')
const Category=require('../models/Category')
const Brand=require('../models/Brand')
const Invoice=require('../models/Invoice')
const Coupon=require('../models/Coupon')
const Audit=require('../models/Audit')
const {sanitizeUser}=require('../utils/SanitizeUser')
const {generateToken}=require('../utils/GenerateToken')
const logAudit=async(actor,action,entity,entityId,meta)=>{ try{ await new Audit({actor,action,entity,entityId:String(entityId||''),meta}).save()}catch{}}
exports.login=async(req,res)=>{
  try{
    const {username,password,email}=req.body
    const loginEmail=(username && username.includes('@')?username: email || (username==='admin'?'demo@gmail.com':username))
    const pass=password
    let user=await User.findOne({email:loginEmail})
    if(!user && username==='admin') user=await User.findOne({email:'demo@gmail.com'})
    if(!user) return res.status(401).json({error:'Invalid credentials'})
    let ok=await bcrypt.compare(pass,user.password)
    if(!ok) return res.status(401).json({error:'Invalid credentials'})
    if(!user.isAdmin) return res.status(403).json({error:'Not an admin'})
    const secure=sanitizeUser(user)
    const token=generateToken(secure)
    res.cookie('token',token,{sameSite:process.env.PRODUCTION==='true'?'None':'Lax',httpOnly:true,secure:process.env.PRODUCTION==='true',maxAge:parseInt(process.env.COOKIE_EXPIRATION_DAYS||'30')*24*60*60*1000})
    const basic=Buffer.from(`${loginEmail}:${pass}`).toString('base64')
    await logAudit(user.email,'LOGIN','auth',user._id,{loginEmail})
    res.json({token,basic,user:secure})
  }catch(e){ console.log(e); res.status(500).json({error:'Login failed'})}
}
exports.stats=async(req,res)=>{
  try{
    const [totalOrders,totalProducts,totalCategories,paidOrders,pendingOrders,lowStock] = await Promise.all([
      Order.countDocuments(), Product.countDocuments(), Category.countDocuments(),
      Order.countDocuments({paymentStatus:'paid'}), Order.countDocuments({status:'Pending'}),
      Product.countDocuments({stockQuantity:{$lte:5}})
    ])
    const invoices=await Invoice.find({paymentStatus:'paid'})
    const totalRevenue=invoices.reduce((s,i)=>s+i.total,0) || (await Order.aggregate([{$match:{paymentStatus:'paid'}},{$group:{_id:null,total:{$sum:"$total"}}}]))[0]?.total || 0
    const last7=[]
    for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const start=new Date(d.setHours(0,0,0,0)); const end=new Date(d.setHours(23,59,59,999)); const count=await Order.countDocuments({createdAt:{$gte:start,$lte:end}}); last7.push({day:d.toLocaleDateString('en-US',{weekday:'short'}),count})}
    const cats=await Category.find()
    const prods=await Product.find().populate('category')
    const mixMap={}
    prods.forEach(p=>{ const n=p.category?.name||'Uncategorized'; mixMap[n]=(mixMap[n]||0)+1})
    const mix=Object.entries(mixMap).map(([name,count])=>({name,count}))
    const lowStockProducts=await Product.find({stockQuantity:{$lte:5}}).limit(5).select('title stockQuantity')
    const unpaid=await Order.countDocuments({paymentStatus:{$ne:'paid'}})
    const avgOrder=paidOrders? totalRevenue/paidOrders : 0
    res.json({totalOrders,totalProducts,categories:Object.keys(mixMap).length,totalCategories,paidOrders,pendingOrders,lowStock,lowStockProducts:lowStockProducts.map(p=>({title:p.title,stock:p.stockQuantity})),totalRevenue,unpaid,avgOrder,trend:last7,mix})
  }catch(e){ console.log(e); res.status(500).json({error:'Stats failed'})}
}
const mapProduct=p=>({id:String(p._id),title:p.title,category:p.category?.name||String(p.category),slug:p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),price:p.price,compareAt:p.price?Math.round(p.price*1.2):null,stock:p.stockQuantity,rating:4.5,images:p.images||[p.thumbnail],sizes:null,description:p.description,thumbnail:p.thumbnail,brand:p.brand})
exports.products=async(req,res)=>{
  try{
    const prods=await Product.find().populate('category').populate('brand').sort({createdAt:-1})
    res.json(prods.map(mapProduct))
  }catch(e){ console.log(e); res.status(500).json({error:'Failed'})}
}
exports.createProduct=async(req,res)=>{
  try{
    const b=req.body
    const catName=b.category
    let cat=await Category.findOne({name:catName})
    if(!cat && catName) cat=await new Category({name:catName}).save()
    let brand=await Brand.findOne({name:b.brand||'Generic'})
    if(!brand) brand=await new Brand({name:b.brand||'Generic'}).save()
    let thumbnail=b.images?.[0]||b.thumbnail
    let images=b.images||[]
    if(req.files && req.files['thumbnail']) thumbnail=`${req.protocol}://${req.get('host')}/uploads/products/${req.files['thumbnail'][0].filename}`
    if(req.files && req.files['images']) images=req.files['images'].map(f=>`${req.protocol}://${req.get('host')}/uploads/products/${f.filename}`)
    if(!images.length && thumbnail) images=[thumbnail]
    const p=await new Product({title:b.title,description:b.description||b.title,price:Number(b.price),stockQuantity:Number(b.stock||b.stockQuantity||0),category:cat?._id,brand:brand._id,thumbnail:thumbnail||'https://via.placeholder.com/400',images:images.length?images:[thumbnail],discountPercentage:0}).save()
    await logAudit(req.headers['x-admin-user']||'admin','CREATE','product',p._id,b)
    res.status(201).json(mapProduct(await p.populate('category').then(x=>x.populate('brand'))))
  }catch(e){ console.log(e); res.status(500).json({error:e.message})}
}
exports.updateProduct=async(req,res)=>{
  try{
    const b=req.body
    let cat
    if(b.category){ cat=await Category.findOne({name:b.category}); if(!cat) cat=await new Category({name:b.category}).save() }
    let brand
    if(b.brand){ brand=await Brand.findOne({name:b.brand}); if(!brand) brand=await new Brand({name:b.brand}).save()}
    const upd={}
    if(b.title) upd.title=b.title
    if(b.description) upd.description=b.description
    if(b.price) upd.price=Number(b.price)
    if(b.stock!==undefined) upd.stockQuantity=Number(b.stock)
    if(b.stockQuantity!==undefined) upd.stockQuantity=Number(b.stockQuantity)
    if(cat) upd.category=cat._id
    if(brand) upd.brand=brand._id
    if(b.images) upd.images=b.images
    if(b.thumbnail) upd.thumbnail=b.thumbnail
    const p=await Product.findByIdAndUpdate(req.params.id,upd,{new:true}).populate('category').populate('brand')
    await logAudit(req.headers['x-admin-user']||'admin','UPDATE','product',req.params.id,b)
    res.json(mapProduct(p))
  }catch(e){ console.log(e); res.status(500).json({error:'Update failed'})}
}
exports.deleteProduct=async(req,res)=>{
  try{
    await Product.findByIdAndUpdate(req.params.id,{isDeleted:true})
    await logAudit(req.headers['x-admin-user']||'admin','DELETE','product',req.params.id,{})
    res.json({ok:true})
  }catch(e){ res.status(500).json({error:'Delete failed'})}
}
const mapOrder=o=>{
  const cust=o.user && typeof o.user==='object'? {name:o.user.name,email:o.user.email,phone:o.billingDetails?.phone||o.address?.[0]?.phoneNumber||'',address:o.billingDetails?.street||o.address?.[0]?.street||'',city:o.billingDetails?.city||o.address?.[0]?.city||'',state:o.billingDetails?.state||o.address?.[0]?.state||'',postcode:String(o.billingDetails?.postalCode||o.address?.[0]?.postalCode||'')} : {name:o.billingDetails?.fullName||'Guest',email:o.billingDetails?.email||'',phone:o.billingDetails?.phone||'',address:o.billingDetails?.street||'',city:o.billingDetails?.city||''}
  return {transactionUuid:String(o._id),orderNumber:String(o._id).slice(-6).toUpperCase(),customer:cust,totalAmount:o.total,subtotal:o.total-10.55,deliveryCharge:5.55,paymentStatus:(o.paymentStatus==='paid'?'PAID':(o.paymentStatus||'PENDING').toUpperCase()),method:o.paymentMode, status:(o.status||'Pending').toUpperCase(),createdAt:o.createdAt,paymentRef:o.payment?.toString()||'',gatewayStatus:o.paymentStatus,couponCode:null,discountAmount:0,customerIp:'',lines:(o.item||[]).map(it=>({title:it.product?.title||it.title||'Product',qty:it.quantity,lineTotal:(it.product?.price||0)*it.quantity,size:null}))}
}
exports.orders=async(req,res)=>{
  try{
    const orders=await Order.find().populate('user','name email').populate('payment').sort({createdAt:-1}).limit(200)
    res.json(orders.map(mapOrder))
  }catch(e){ console.log(e); res.status(500).json({error:'Failed'})}
}
exports.orderById=async(req,res)=>{
  try{
    const o=await Order.findById(req.params.uuid).populate('user','name email')
    if(!o) return res.status(404).json({error:'Not found'})
    res.json(mapOrder(o))
  }catch(e){ res.status(500).json({error:'Failed'})}
}
exports.updateOrder=async(req,res)=>{
  try{
    const o=await Order.findByIdAndUpdate(req.params.uuid,{status:req.body.status},{new:true})
    await logAudit(req.headers['x-admin-user']||'admin','UPDATE_ORDER','order',req.params.uuid,req.body)
    res.json({ok:true,order:o?mapOrder(o):null})
  }catch(e){ res.status(500).json({error:'Failed'})}
}
exports.coupons=async(req,res)=>{ try{ const c=await Coupon.find().sort({createdAt:-1}); res.json(c.map(x=>({id:String(x._id),code:x.code,type:x.type,value:x.value,minAmount:x.minAmount,active:x.active})))}catch(e){res.json([])}}
exports.createCoupon=async(req,res)=>{
  try{ const c=await new Coupon({code:req.body.code.toUpperCase(),type:req.body.type,value:Number(req.body.value),minAmount:Number(req.body.minAmount||0),active:req.body.active!==false}).save(); await logAudit(req.headers['x-admin-user']||'admin','CREATE','coupon',c._id,req.body); res.status(201).json({id:String(c._id),code:c.code,type:c.type,value:c.value,minAmount:c.minAmount,active:c.active})}catch(e){ res.status(400).json({error:e.message})}
}
exports.audit=async(req,res)=>{ try{ const a=await Audit.find().sort({createdAt:-1}).limit(100); res.json(a)}catch{ res.json([])}}
exports.reports=async(req,res)=>{
  try{
    const from=req.query.from?new Date(req.query.from):new Date(Date.now()-30*24*60*60*1000)
    const to=req.query.to?new Date(req.query.to):new Date()
    const orders=await Order.find({createdAt:{$gte:from,$lte:to},paymentStatus:'paid'})
    const revenue=orders.reduce((s,o)=>s+o.total,0)
    const byPayment={}
    orders.forEach(o=>{ byPayment[o.paymentMode]=(byPayment[o.paymentMode]||0)+o.total })
    const byDay={}
    orders.forEach(o=>{ const d=new Date(o.createdAt).toISOString().slice(0,10); byDay[d]=(byDay[d]||0)+o.total })
    res.json({revenue,totalOrders:orders.length,byPayment,byDay,orders})
  }catch(e){ res.status(500).json({error:'Report failed'})}
}
exports.reportsCsv=async(req,res)=>{
  try{
    const from=req.query.from?new Date(req.query.from):new Date(Date.now()-30*24*60*60*1000)
    const to=req.query.to?new Date(req.query.to):new Date()
    const orders=await Order.find({createdAt:{$gte:from,$lte:to}})
    let csv='orderNumber,totalAmount,paymentStatus,method,createdAt\n'
    orders.forEach(o=>{ csv+=`${String(o._id).slice(-6)},${o.total},${o.paymentStatus},${o.paymentMode},${o.createdAt.toISOString()}\n`})
    res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename=sales.csv'); res.send(csv)
  }catch(e){ res.status(500).send('error')}
}
