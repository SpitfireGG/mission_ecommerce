const mongoose=require('mongoose')
const s=new mongoose.Schema({code:{type:String,unique:true,required:true},type:{type:String,enum:['percent','flat'],required:true},value:{type:Number,required:true},minAmount:{type:Number,default:0},active:{type:Boolean,default:true},createdAt:{type:Date,default:Date.now}},{versionKey:false})
module.exports=mongoose.model('Coupon',s)
