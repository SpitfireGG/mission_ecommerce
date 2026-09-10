const mongoose=require("mongoose")
const {Schema}=mongoose

const orderSchema=new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    item:{
        type:[Schema.Types.Mixed],
        required:true
    },
    address:{
        type:[Schema.Types.Mixed],
        required:true
    },
    status:{
        type:String,
        enum:['Pending','Dispatched','Out for delivery','Cancelled'],
        default:'Pending'
    },
    paymentMode:{
        type:String,
        enum:['COD','UPI','CARD','ESEWA','KHALTI'],
        required:true
    },
    paymentStatus:{
        type:String,
        enum:['pending','paid','failed','refunded'],
        default:'pending'
    },
    payment:{type:Schema.Types.ObjectId,ref:"Payment"},
    invoice:{type:Schema.Types.ObjectId,ref:"Invoice"},
    billingDetails:{type:Schema.Types.Mixed},
    total:{
        type:Number,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
},{versionKey:false})

module.exports=mongoose.model("Order",orderSchema)