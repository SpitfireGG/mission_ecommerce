const express=require('express')
const productController=require("../controllers/Product")
const upload=require("../middleware/upload")
const router=express.Router()

router
    .post("/",upload.fields([{name:'thumbnail',maxCount:1},{name:'images',maxCount:5}]),productController.create)
    .post("/upload",upload.fields([{name:'thumbnail',maxCount:1},{name:'images',maxCount:5}]),(req,res)=>{
        const base=`${req.protocol}://${req.get('host')}`
        const out={}
        if(req.files['thumbnail']) out.thumbnail=`${base}/uploads/products/${req.files['thumbnail'][0].filename}`
        if(req.files['images']) out.images=req.files['images'].map(f=>`${base}/uploads/products/${f.filename}`)
        res.json(out)
    })
    .get("/",productController.getAll)
    .get("/:id",productController.getById)
    .patch("/:id",productController.updateById)
    .patch("/undelete/:id",productController.undeleteById)
    .delete("/:id",productController.deleteById)

module.exports=router