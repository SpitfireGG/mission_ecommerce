const { Schema, default: mongoose } = require("mongoose")
const Product=require("../models/Product")

exports.create=async(req,res)=>{
    try {
        const data={...req.body}
        const baseUrl=`${req.protocol}://${req.get('host')}`
        if(req.files && (req.files['thumbnail']||req.files['images'])){
            if(req.files['thumbnail'] && req.files['thumbnail'][0]) data.thumbnail=`${baseUrl}/uploads/products/${req.files['thumbnail'][0].filename}`
            if(req.files['images']){
                data.images=req.files['images'].map(f=>`${baseUrl}/uploads/products/${f.filename}`)
                if(data.thumbnail && !data.images.includes(data.thumbnail)) data.images.unshift(data.thumbnail)
            }
        } else if(req.files && Array.isArray(req.files) && req.files.length){
            // generic array fallback
        }
        if(typeof data.images==='string') try{data.images=JSON.parse(data.images)}catch{}
        if(data.price) data.price=Number(data.price)
        if(data.stockQuantity) data.stockQuantity=Number(data.stockQuantity)
        if(data.discountPercentage) data.discountPercentage=Number(data.discountPercentage)
        if(!data.thumbnail && data.images && data.images[0]) data.thumbnail=data.images[0]
        if(!data.images || !data.images.length) data.images=[data.thumbnail]
        const created=new Product(data)
        await created.save()
        const populated=await Product.findById(created._id).populate('brand').populate('category')
        res.status(201).json(populated||created)
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:'Error adding product, please trying again later'})
    }
}

exports.getAll = async (req, res) => {
    try {
        const filter={}
        const sort={}
        let skip=0
        let limit=0

        if(req.query.brand){
            filter.brand={$in:req.query.brand}
        }

        if(req.query.category){
            filter.category={$in:req.query.category}
        }

        if(req.query.search){
            const r=new RegExp(req.query.search,'i')
            filter.$or=[{title:r},{description:r}]
        }

        if(req.query.user){
            filter['isDeleted']=false
        }

        if(req.query.sort){
            sort[req.query.sort]=req.query.order?req.query.order==='asc'?1:-1:1
        }

        if(req.query.page && req.query.limit){

            const pageSize=req.query.limit
            const page=req.query.page

            skip=pageSize*(page-1)
            limit=pageSize
        }

        const totalDocs=await Product.find(filter).sort(sort).populate("brand").countDocuments().exec()
        const results=await Product.find(filter).sort(sort).populate("brand").skip(skip).limit(limit).exec()

        res.set("X-Total-Count",totalDocs)

        res.status(200).json(results)
    
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error fetching products, please try again later'})
    }
};

exports.getById=async(req,res)=>{
    try {
        const {id}=req.params
        const result=await Product.findById(id).populate("brand").populate("category")
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error getting product details, please try again later'})
    }
}

exports.updateById=async(req,res)=>{
    try {
        const {id}=req.params
        const updated=await Product.findByIdAndUpdate(id,req.body,{new:true})
        res.status(200).json(updated)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error updating product, please try again later'})
    }
}

exports.undeleteById=async(req,res)=>{
    try {
        const {id}=req.params
        const unDeleted=await Product.findByIdAndUpdate(id,{isDeleted:false},{new:true}).populate('brand')
        res.status(200).json(unDeleted)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error restoring product, please try again later'})
    }
}

exports.deleteById=async(req,res)=>{
    try {
        const {id}=req.params
        const deleted=await Product.findByIdAndUpdate(id,{isDeleted:true},{new:true}).populate("brand")
        res.status(200).json(deleted)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error deleting product, please try again later'})
    }
}


