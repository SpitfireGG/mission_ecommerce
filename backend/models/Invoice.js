const mongoose=require("mongoose")
const {Schema}=mongoose
const invoiceSchema=new Schema({
    invoiceNumber:{type:String,unique:true,required:true},
    order:{type:Schema.Types.ObjectId,ref:"Order",required:true,unique:true},
    user:{type:Schema.Types.ObjectId,ref:"User",required:true},
    payment:{type:Schema.Types.ObjectId,ref:"Payment"},
    billingDetails:{
        fullName:{type:String,required:true},
        email:{type:String,required:true},
        phone:{type:String,required:true},
        street:{type:String,required:true},
        city:{type:String,required:true},
        state:{type:String,required:true},
        country:{type:String,required:true},
        postalCode:{type:String,required:true},
        panVat:{type:String}
    },
    items:{type:[Schema.Types.Mixed],required:true},
    subtotal:{type:Number,required:true},
    shipping:{type:Number,required:true},
    taxes:{type:Number,required:true},
    discount:{type:Number,default:0},
    total:{type:Number,required:true},
    paymentProvider:{type:String,enum:['COD','ESEWA','KHALTI','CARD','UPI'],required:true},
    paymentStatus:{type:String,enum:['pending','paid','failed','refunded'],default:'pending'},
    status:{type:String,enum:['draft','issued','paid','cancelled'],default:'issued'},
    issuedAt:{type:Date,default:Date.now},
    dueDate:{type:Date},
    notes:{type:String}
},{versionKey:false})
module.exports=mongoose.model("Invoice",invoiceSchema)
