const mongoose=require('mongoose')
const s=new mongoose.Schema({actor:{type:String,required:true},action:{type:String,required:true},entity:{type:String},entityId:{type:String},meta:{type:mongoose.Schema.Types.Mixed},createdAt:{type:Date,default:Date.now}},{versionKey:false})
module.exports=mongoose.model('Audit',s)
