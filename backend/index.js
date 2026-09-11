require("dotenv").config()
const express=require('express')
const cors=require('cors')
const morgan=require("morgan")
const cookieParser=require("cookie-parser")
const authRoutes=require("./routes/Auth")
const productRoutes=require("./routes/Product")
const orderRoutes=require("./routes/Order")
const cartRoutes=require("./routes/Cart")
const brandRoutes=require("./routes/Brand")
const categoryRoutes=require("./routes/Category")
const userRoutes=require("./routes/User")
const addressRoutes=require('./routes/Address')
const reviewRoutes=require("./routes/Review")
const wishlistRoutes=require("./routes/Wishlist")
const paymentRoutes=require("./routes/Payment")
const invoiceRoutes=require("./routes/Invoice")
const adminRoutes=require("./routes/Admin")
const path=require('path')
const { connectToDB } = require("./database/db")


// server init
const server=express()

// database connection
connectToDB()


// Storefront on 3000; admin console on 3003 (3001 kept for older setups).
const allowedOrigins=[process.env.ORIGIN,process.env.ADMIN_ORIGIN,"http://localhost:3000","http://localhost:3001","http://localhost:3003"].filter(Boolean)
// middlewares
server.use(cors({origin:function(origin,cb){if(!origin || allowedOrigins.includes(origin)) return cb(null,true); return cb(new Error('CORS not allowed by server: '+origin))},credentials:true,exposedHeaders:['X-Total-Count'],methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS']}))
server.use(express.json({limit:'10mb'}))
server.use(express.urlencoded({extended:true,limit:'10mb'}))
server.use(cookieParser())
server.use(morgan("tiny"))
server.use('/uploads',express.static(path.join(__dirname,'uploads')))

// routeMiddleware
server.use("/auth",authRoutes)
server.use("/users",userRoutes)
server.use("/products",productRoutes)
server.use("/orders",orderRoutes)
server.use("/cart",cartRoutes)
server.use("/brands",brandRoutes)
server.use("/categories",categoryRoutes)
server.use("/address",addressRoutes)
server.use("/reviews",reviewRoutes)
server.use("/wishlist",wishlistRoutes)
server.use("/payments",paymentRoutes)
server.use("/invoices",invoiceRoutes)
server.use("/api/admin",adminRoutes)



server.get("/",(req,res)=>{
    res.status(200).json({message:'running'})
})

server.listen(8000,()=>{
    console.log('server [STARTED] ~ http://localhost:8000');
})