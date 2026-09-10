const mongoose=require("mongoose")
const {Schema}=mongoose
const paymentSchema=new Schema({
    user:{type:Schema.Types.ObjectId,ref:"User",required:true},
    order:{type:Schema.Types.ObjectId,ref:"Order"},
    amount:{type:Number,required:true},
    provider:{type:String,enum:['COD','ESEWA','KHALTI','CARD','UPI'],required:true},
    status:{type:String,enum:['pending','initiated','completed','failed','refunded'],default:'pending'},
    transactionId:{type:String},
    pidx:{type:String},
    gatewayResponse:{type:Schema.Types.Mixed},
    refundId:{type:String},
    verifiedAt:{type:Date},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
},{versionKey:false})
paymentSchema.pre('save',function(next){this.updatedAt=Date.now();next()})
paymentSchema.pre('findOneAndUpdate',function(next){this.set({updatedAt:Date.now()});next()})
module.exports=mongoose.model("Payment",paymentSchema)
