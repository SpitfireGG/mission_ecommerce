const multer=require('multer')
const path=require('path')
const fs=require('fs')
const dir=path.join(__dirname,'../uploads/products')
if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
const storage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,dir),
  filename:(req,file,cb)=>{
    const ext=path.extname(file.originalname)
    cb(null,Date.now()+'-'+Math.round(Math.random()*1e9)+ext)
  }
})
const fileFilter=(req,file,cb)=>{
  if(file.mimetype.startsWith('image/')) cb(null,true)
  else cb(new Error('Only images allowed'),false)
}
module.exports=multer({storage,fileFilter,limits:{fileSize:5*1024*1024}})
