import {FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Stack, Typography, useMediaQuery, useTheme, Box, Chip, Button, Paper, Card, CardContent, Divider } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProductsAsync, resetProductFetchStatus, selectProductFetchStatus, selectProductIsFilterOpen, selectProductTotalResults, selectProducts, toggleFilters } from '../ProductSlice'
import { ProductCard } from './ProductCard'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import { selectBrands } from '../../brands/BrandSlice'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { selectCategories } from '../../categories/CategoriesSlice'
import Pagination from '@mui/material/Pagination';
import { ITEMS_PER_PAGE } from '../../../constants'
import {createWishlistItemAsync, deleteWishlistItemByIdAsync, resetWishlistItemAddStatus, resetWishlistItemDeleteStatus, selectWishlistItemAddStatus, selectWishlistItemDeleteStatus, selectWishlistItems} from '../../wishlist/WishlistSlice'
import {selectLoggedInUser} from '../../auth/AuthSlice'
import {toast} from 'react-toastify'
import {banner1, banner2, banner3, banner4, loadingAnimation} from '../../../assets'
import { resetCartItemAddStatus, selectCartItemAddStatus } from '../../cart/CartSlice'
import { motion } from 'framer-motion'
import { ProductBanner } from './ProductBanner'
import { useNavigate } from 'react-router-dom'
import { axiosi } from '../../../config/axios'
import { formatNPR } from '../../../utils/currency'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import ClearIcon from '@mui/icons-material/Clear';
import Lottie from 'lottie-react'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CategoryIcon from '@mui/icons-material/Category';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BoltIcon from '@mui/icons-material/Bolt';


const sortOptions=[
    {name:"Price: low to high",sort:"price",order:"asc"},
    {name:"Price: high to low",sort:"price",order:"desc"},
]


const bannerImages=[banner1,banner3,banner2,banner4]

export const ProductList = () => {
    const [filters,setFilters]=useState({})
    const [page,setPage]=useState(1)
    const [sort,setSort]=useState(null)
    // Best current discounts, straight from the catalogue.
    const navigate=useNavigate()
    const [deals,setDeals]=useState([])
    useEffect(()=>{
        let live=true
        axiosi.get('/products?sort=discountPercentage&order=desc&limit=6&user=true')
            .then(r=>{ if(live) setDeals(Array.isArray(r.data)?r.data:(r.data?.data||[])) })
            .catch(()=>{})
        return ()=>{live=false}
    },[])

    const theme=useTheme()

    const is1200=useMediaQuery(theme.breakpoints.down(1200))
    const is800=useMediaQuery(theme.breakpoints.down(800))
    const is700=useMediaQuery(theme.breakpoints.down(700))
    const is600=useMediaQuery(theme.breakpoints.down(600))
    const is500=useMediaQuery(theme.breakpoints.down(500))
    const is488=useMediaQuery(theme.breakpoints.down(488))

    const brands=useSelector(selectBrands)
    const categories=useSelector(selectCategories)
    const products=useSelector(selectProducts)
    const totalResults=useSelector(selectProductTotalResults)
    const loggedInUser=useSelector(selectLoggedInUser)

    const productFetchStatus=useSelector(selectProductFetchStatus)

    const wishlistItems=useSelector(selectWishlistItems)
    const wishlistItemAddStatus=useSelector(selectWishlistItemAddStatus)
    const wishlistItemDeleteStatus=useSelector(selectWishlistItemDeleteStatus)

    const cartItemAddStatus=useSelector(selectCartItemAddStatus)

    const isProductFilterOpen=useSelector(selectProductIsFilterOpen)

    const dispatch=useDispatch()

    const handleBrandFilters=(e)=>{

        const filterSet=new Set(filters.brand)

        if(e.target.checked){filterSet.add(e.target.value)}
        else{filterSet.delete(e.target.value)}

        const filterArray = Array.from(filterSet);
        setFilters({...filters,brand:filterArray})
    }

    const handleCategoryFilters=(e)=>{
        const filterSet=new Set(filters.category)

        if(e.target.checked){filterSet.add(e.target.value)}
        else{filterSet.delete(e.target.value)}

        const filterArray = Array.from(filterSet);
        setFilters({...filters,category:filterArray})
    }

    useEffect(()=>{
        window.scrollTo({
            top:0,
            behavior:"instant"
        })
    },[])

    useEffect(()=>{
        setPage(1)
    },[totalResults])


    useEffect(()=>{
        const finalFilters={...filters}

        finalFilters['pagination']={page:page,limit:ITEMS_PER_PAGE}
        finalFilters['sort']=sort

        if(!loggedInUser?.isAdmin){
            finalFilters['user']=true
        }

        dispatch(fetchProductsAsync(finalFilters))
        
    },[filters,page,sort])


    const handleAddRemoveFromWishlist=(e,productId)=>{
        if(e.target.checked){
            const data={user:loggedInUser?._id,product:productId}
            dispatch(createWishlistItemAsync(data))
        }

        else if(!e.target.checked){
            const index=wishlistItems.findIndex((item)=>item.product._id===productId)
            dispatch(deleteWishlistItemByIdAsync(wishlistItems[index]._id));
        }
    }

    useEffect(()=>{
        if(wishlistItemAddStatus==='fulfilled'){
            toast.success("Product added to wishlist")
        }
        else if(wishlistItemAddStatus==='rejected'){
            toast.error("Error adding product to wishlist, please try again later")
        }

    },[wishlistItemAddStatus])

    useEffect(()=>{
        if(wishlistItemDeleteStatus==='fulfilled'){
            toast.success("Product removed from wishlist")
        }
        else if(wishlistItemDeleteStatus==='rejected'){
            toast.error("Error removing product from wishlist, please try again later")
        }
    },[wishlistItemDeleteStatus])

    useEffect(()=>{
        if(cartItemAddStatus==='fulfilled'){
            toast.success("Product added to cart")
        }
        else if(cartItemAddStatus==='rejected'){
            toast.error("Error adding product to cart, please try again later")
        }
        
    },[cartItemAddStatus])

    useEffect(()=>{
        if(productFetchStatus==='rejected'){
            toast.error("Error fetching products, please try again later")
        }
    },[productFetchStatus])

    useEffect(()=>{
        return ()=>{
            dispatch(resetProductFetchStatus())
            dispatch(resetWishlistItemAddStatus())
            dispatch(resetWishlistItemDeleteStatus())
            dispatch(resetCartItemAddStatus())
        }
    },[])


    const handleFilterClose=()=>{
        dispatch(toggleFilters())
    }

  return (
    <>
    {/* filters side bar */}

    {
        productFetchStatus==='pending'?
        <Stack width={is500?"35vh":'25rem'} height={'calc(100vh - 4rem)'} justifyContent={'center'} marginRight={'auto'} marginLeft={'auto'}>
            <Lottie animationData={loadingAnimation}/>
        </Stack>
        :
        <>
        <motion.div style={{position:"fixed",backgroundColor:"white",height:"100vh",padding:'1rem',overflowY:"scroll",width:is500?"100vw":"30rem",zIndex:500}}  variants={{show:{left:0},hide:{left:-500}}} initial={'hide'} transition={{ease:"easeInOut",duration:.7,type:"spring"}} animate={isProductFilterOpen===true?"show":"hide"}>

            {/* fitlers section */}
            <Stack mb={'5rem'}  sx={{scrollBehavior:"smooth",overflowY:"scroll"}}>

                    
                        <Typography variant='h4'>New Arrivals</Typography>


                            <IconButton onClick={handleFilterClose} style={{position:"absolute",top:15,right:15}}>
                                <motion.div whileHover={{scale:1.1}} whileTap={{scale:0.9}}>
                                    <ClearIcon fontSize='medium'/>
                                </motion.div>
                            </IconButton>


                    <Stack rowGap={2} mt={4} >
                        <Typography sx={{cursor:"pointer"}} variant='body2'>Totes</Typography>
                        <Typography sx={{cursor:"pointer"}} variant='body2'>Backpacks</Typography>
                        <Typography sx={{cursor:"pointer"}} variant='body2'>Travel Bags</Typography>
                        <Typography sx={{cursor:"pointer"}} variant='body2'>Hip Bags</Typography>
                        <Typography sx={{cursor:"pointer"}} variant='body2'>Laptop Sleeves</Typography>
                    </Stack>

                    {/* brand filters */}
                    <Stack mt={2}>
                        <Accordion>
                            <AccordionSummary expandIcon={<AddIcon />}  aria-controls="brand-filters" id="brand-filters" >
                                    <Typography>Brands</Typography>
                            </AccordionSummary>

                            <AccordionDetails sx={{p:0}}>
                                <FormGroup onChange={handleBrandFilters}>
                                    {
                                        brands?.map((brand)=>(
                                            <motion.div style={{width:"fit-content"}} whileHover={{x:5}} whileTap={{scale:0.9}}>
                                                <FormControlLabel sx={{ml:1}} control={<Checkbox whileHover={{scale:1.1}} />} label={brand.name} value={brand._id} />
                                            </motion.div>
                                        ))
                                    }
                                </FormGroup>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>

                    {/* category filters */}
                    <Stack mt={2}>
                        <Accordion>
                            <AccordionSummary expandIcon={<AddIcon />}  aria-controls="brand-filters" id="brand-filters" >
                                    <Typography>Category</Typography>
                            </AccordionSummary>

                            <AccordionDetails sx={{p:0}}>
                                <FormGroup onChange={handleCategoryFilters}>
                                    {
                                        categories?.map((category)=>(
                                            <motion.div style={{width:"fit-content"}} whileHover={{x:5}} whileTap={{scale:0.9}}>
                                                <FormControlLabel sx={{ml:1}} control={<Checkbox whileHover={{scale:1.1}} />} label={category.name} value={category._id} />
                                            </motion.div>
                                        ))
                                    }
                                </FormGroup>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
            </Stack>

        </motion.div>
        
        <Stack mb={'3rem'}>
            

                {/* hero section */}
                <Box sx={{width:"100%",minHeight:"108vh",bgcolor:"#ffffff",borderBottom:"1px solid #ececec",display:"flex",alignItems:"center",position:"relative",overflow:"hidden",py:{xs:4,md:6}}}>
                    <Stack direction={{xs:"column",md:"row"}} alignItems="center" justifyContent="space-between" width="100%" maxWidth={1480} mx="auto" p={{xs:3,md:8}} gap={6} sx={{position:"relative",zIndex:1}}>
                        <Stack gap={3} maxWidth={620}>
                            <Typography variant="h1" sx={{fontWeight:900,lineHeight:0.9,color:"#000000",fontSize:{xs:"2.4rem",sm:"3.2rem",md:"4.2rem"},letterSpacing:"-0.04em"}}>Shop Smart.<br/><Box component="span" sx={{color:"#000000"}}>Shop Mission.</Box></Typography>
                            <Typography variant="body1" sx={{color:"#7D7D7D",fontSize:{xs:16,md:19},lineHeight:1.7,maxWidth:560}}>Handpicked fashion, tech & beauty — delivered across Nepal with <b style={{color:"#000000"}}>eSewa, Khalti & COD</b>. Authentic products, fast delivery, 24h support.</Typography>
                            <Stack direction="row" gap={1.8} mt={0.5} flexWrap="wrap">
                                <Button variant="contained" size="large" endIcon={<ArrowForwardIcon/>} onClick={()=>window.scrollTo({top:window.innerHeight,behavior:"smooth"})} sx={{borderRadius:2,px:4,py:1.6,fontSize:"1.05rem",fontWeight:800,textTransform:"none",bgcolor:"#000000",":hover":{bgcolor:"#1f2937"}}}>Shop Now</Button>
                                <Button variant="outlined" size="large" onClick={()=>dispatch(toggleFilters())} sx={{borderRadius:2,px:4,py:1.6,fontSize:"1.05rem",color:"#000000",borderColor:"#d1d5db",":hover":{borderColor:"#000000",bgcolor:"#F5F5F5"},textTransform:"none",fontWeight:700}}>Explore Filters</Button>
                            </Stack>
                            <Stack direction="row" gap={4} mt={1.5}>
                                <Stack><Typography variant="h5" color="#000000" fontWeight={900}>50k+</Typography><Typography variant="caption" sx={{color:"#7D7D7D",fontSize:13}}>Happy Nepalis</Typography></Stack>
                                <Divider orientation="vertical" flexItem sx={{bgcolor:"#e5e7eb"}}/>
                                <Stack><Typography variant="h5" color="#000000" fontWeight={900}>4.8★</Typography><Typography variant="caption" sx={{color:"#7D7D7D",fontSize:13}}>5000+ Reviews</Typography></Stack>
                                <Divider orientation="vertical" flexItem sx={{bgcolor:"#e5e7eb"}}/>
                                <Stack><Typography variant="h5" color="#000000" fontWeight={900}>All Nepal</Typography><Typography variant="caption" sx={{color:"#7D7D7D",fontSize:13}}>Delivery</Typography></Stack>
                            </Stack>
                        </Stack>
                        <Box sx={{display:{xs:"none",md:"block"},width:640,height:500,position:"relative",flexShrink:0}}>
                            <Box sx={{position:"absolute",inset:0,borderRadius:4,overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.10)",border:"1px solid #e5e7eb"}}>
                                <ProductBanner images={bannerImages}/>
                            </Box>
                            <Paper sx={{position:"absolute",bottom:-16,left:-16,p:1.8,borderRadius:3,display:"flex",gap:1.8,alignItems:"center",boxShadow:4,border:"1px solid #e5e7eb"}}>
                                <Box sx={{width:56,height:56,borderRadius:2.5,bgcolor:"#F5F5F5",border:"1px solid #E6E6E6",display:"flex",alignItems:"center",justifyContent:"center"}}><LocalMallIcon sx={{color:"#000000",fontSize:28}}/></Box>
                                <Stack><Typography variant="body1" fontWeight={800} color="#000000" fontSize={15}>Free Delivery</Typography><Typography variant="caption" color="text.secondary" fontSize={13}>Orders above NPR 2000</Typography></Stack>
                            </Paper>
                        </Box>
                    </Stack>
                </Box>
                <Stack sx={{px:{xs:2,md:4},py:3,bgcolor:"#fff",borderRadius:3,mx:{xs:1,md:2},mt:2,boxShadow:"0 4px 20px rgba(0,0,0,0.04)",border:"1px solid #f0f0f0"}} alignItems="center" textAlign="center" gap={1}>
                    <Chip icon={<LocalMallIcon/>} label="Curated for Nepal" size="small" color="success" variant="outlined"/>
                    <Typography variant="h4" fontWeight={900} sx={{letterSpacing:"-0.02em"}}>Discover Products — Handpicked for You</Typography>
                    <Typography variant="body2" color="text.secondary" maxWidth={640}>From Kathmandu street style to Himalayan treks — everything you need, one tap away. Filter by category, brand or search instantly.</Typography>
                </Stack>
                {/* categories cards */}
                <Stack sx={{px:{xs:2,md:4},py:2}} gap={2}>
                    <Stack direction="row" alignItems="center" gap={1} justifyContent="space-between">
                        <Stack direction="row" gap={1} alignItems="center"><CategoryIcon color="primary"/><Typography variant="h6" fontWeight={800}>Shop by Category</Typography><Chip label={`${categories?.length||0} collections`} size="small" variant="outlined"/></Stack>
                        <Button size="small" sx={{textTransform:"none"}} onClick={()=>setFilters({})}>Clear filters</Button>
                    </Stack>
                    <Grid container spacing={1.5}>
                        {(categories?.length?categories:[{name:"Fashion",_id:"fashion"},{name:"Electronics",_id:"electronics"},{name:"Beauty",_id:"beauty"},{name:"Sports",_id:"sports"},{name:"Home",_id:"home"},{name:"Watches",_id:"watches"}]).slice(0,6).map((cat,i)=>(
                            <Grid item xs={6} sm={4} md={2} key={cat._id}>
                                <Card onClick={()=>{const nv=new Set(filters.category); nv.add(cat._id); setFilters({...filters,category:[...nv]})}} sx={{cursor:"pointer",borderRadius:3,overflow:"hidden",height:112,bgcolor:"#fff",border:"1px solid #e5e7eb",color:"#000000",":hover":{boxShadow:"0 6px 20px rgba(0,0,0,0.07)",borderColor:"#d1d5db",transform:"translateY(-2px)"},transition:"all 0.18s"}}>
                                    <CardContent sx={{p:2,display:"flex",flexDirection:"column",justifyContent:"space-between",height:"100%"}}>
                                        <Box sx={{width:36,height:36,borderRadius:2,bgcolor:"#F5F5F5",border:"1px solid #E6E6E6",display:"flex",alignItems:"center",justifyContent:"center"}}><CategoryIcon sx={{fontSize:18,color:"#374151"}}/></Box>
                                        <Stack gap={0.3}>
                                            <Typography fontWeight={700} variant="body2" sx={{color:"#000000"}}>{cat.name}</Typography>
                                            <Typography variant="caption" sx={{color:"#7D7D7D"}}>Explore →</Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Stack>
                {/* popular + brands - clean, no borders */}
                <Stack sx={{px:{xs:2,md:4},py:1}} gap={2}>
                    <Stack direction="row" alignItems="center" gap={1}><WorkspacePremiumIcon sx={{color:"#000000"}}/><Typography variant="h6" fontWeight={800} color="#000000">Popular Now</Typography><Chip label="Trending" size="small" sx={{bgcolor:"#fef3c7",color:"#92400e",border:"1px solid #fde68a",fontWeight:700}}/><Box flex={1}/><Typography variant="caption" color="text.secondary">{products?.length||0} items</Typography></Stack>
                    <Grid container spacing={1.5}>
                        {products?.slice(0,4).map(p=>(
                            <Grid item xs={6} sm={3} key={p._id}>
                                <Box onClick={()=>window.location.href=`/product-details/${p._id}`} sx={{cursor:"pointer",borderRadius:3,overflow:"hidden",border:"1px solid #E6E6E6",bgcolor:"#fff",":hover":{boxShadow:"0 6px 20px rgba(0,0,0,0.06)",borderColor:"#e5e7eb"},transition:"0.2s"}}>
                                    <Box sx={{height:140,bgcolor:"#fcfcfc",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}><img src={p.thumbnail} alt={p.title} style={{width:"100%",height:"100%",objectFit:"contain"}}/></Box>
                                    <Box sx={{p:1.2}}><Typography variant="body2" fontWeight={700} noWrap color="#000000">{p.title}</Typography><Typography variant="caption" sx={{color:"#7D7D7D"}} noWrap>{p.brand?.name}</Typography><Typography variant="body2" fontWeight={800} color="#000000">Rs. {p.price}</Typography></Box>
                                </Box>
                            </Grid>
                        ))}
                        {!products?.length && <Typography variant="body2" color="text.secondary" sx={{p:2}}>No products yet — try changing filters</Typography>}
                    </Grid>
                </Stack>
                <Stack sx={{px:{xs:2,md:4},py:1}} gap={1.5}>
                    <Stack direction="row" alignItems="center" gap={1}><Box sx={{width:32,height:32,borderRadius:2,bgcolor:"#F5F5F5",border:"1px solid #E6E6E6",display:"flex",alignItems:"center",justifyContent:"center"}}><WorkspacePremiumIcon sx={{fontSize:18,color:"#000000"}}/></Box><Typography variant="h6" fontWeight={800} color="#000000">Top Brands</Typography><Chip label={`${brands?.length||8} brands`} size="small" variant="outlined" sx={{ml:"auto",height:20}}/><Typography variant="caption" sx={{color:"#7D7D7D",ml:1}}>Trusted by Nepalis — tap to filter</Typography></Stack>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {(brands?.length?brands:[{name:"Nike"},{name:"Apple"},{name:"Samsung"},{name:"Levi's"},{name:"Adidas"},{name:"Puma"},{name:"Sony"},{name:"Bata"}]).slice(0,8).map(b=>(
                            <Chip key={b.name||b._id} label={b.name} onClick={()=>{const nv=new Set(filters.brand); nv.add(b._id||b.name); setFilters({...filters,brand:[...nv]})}} sx={{bgcolor:"#fff",color:"#374151",border:"1px solid #e5e7eb",fontWeight:600,":hover":{bgcolor:"#F5F5F5",borderColor:"#d1d5db"},cursor:"pointer"}} size="small" variant="outlined"/>
                        ))}
                    </Stack>
                </Stack>

                {/* deals - real discounts from the catalogue */}
                {deals.length>0 && (
                <Stack sx={{px:{xs:2,md:0},mb:6}} gap={2}>
                    <Stack direction="row" alignItems="baseline" gap={1.5} sx={{borderBottom:'1px solid #E6E6E6',pb:1.5}}>
                        <Typography sx={{fontSize:22,fontWeight:600,color:'#000'}}>Deals this week</Typography>
                        <Typography sx={{fontSize:13,color:'#7D7D7D'}}>Biggest reductions in the shop right now</Typography>
                    </Stack>
                    <Box sx={{display:'grid',gridTemplateColumns:{xs:'repeat(2,1fr)',sm:'repeat(3,1fr)',lg:'repeat(6,1fr)'},gap:1.5}}>
                        {deals.map(d=>(
                            <Stack key={d._id} onClick={()=>navigate(`/product-details/${d._id}`)}
                                sx={{cursor:'pointer',border:'1px solid #E6E6E6',borderRadius:'4px',overflow:'hidden',
                                     transition:'border-color .18s ease','&:hover':{borderColor:'#000'}}}>
                                <Box sx={{position:'relative',bgcolor:'#F5F5F5',aspectRatio:'1/1'}}>
                                    <Box component="img" src={d.thumbnail} alt={d.title} loading="lazy"
                                        sx={{width:'100%',height:'100%',objectFit:'contain',p:2}}/>
                                    <Box sx={{position:'absolute',top:8,left:8,bgcolor:'#DB4444',color:'#fff',fontSize:11,fontWeight:600,px:.75,py:'2px',borderRadius:'3px'}}>
                                        -{Math.round(d.discountPercentage||0)}%
                                    </Box>
                                </Box>
                                <Stack sx={{p:1.25,gap:.25}}>
                                    <Typography sx={{fontSize:12.5,color:'#000',lineHeight:1.3,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',minHeight:'2.6em'}}>{d.title}</Typography>
                                    <Typography sx={{fontSize:13.5,fontWeight:700,color:'#DB4444'}}>{formatNPR(d.price)}</Typography>
                                </Stack>
                            </Stack>
                        ))}
                    </Box>
                </Stack>
                )}

                {/* what the shop promises - specific to delivering in Nepal */}
                <Box sx={{display:'grid',gridTemplateColumns:{xs:'repeat(2,1fr)',md:'repeat(4,1fr)'},
                          border:'1px solid #E6E6E6',borderRadius:'4px',mb:6,mx:{xs:2,md:0},overflow:'hidden'}}>
                    {[
                        {icon:<LocalShippingOutlinedIcon/>,head:'Rs. 100 inside the valley',sub:'Free over Rs. 5,000'},
                        {icon:<PaymentsOutlinedIcon/>,head:'eSewa & Khalti',sub:'Or pay cash on delivery'},
                        {icon:<AssignmentReturnOutlinedIcon/>,head:'7-day returns',sub:'Unworn, with the tag on'},
                        {icon:<SupportAgentOutlinedIcon/>,head:'Talk to a person',sub:'Sun–Fri, 10am to 6pm'},
                    ].map((f,i)=>(
                        <Stack key={i} direction="row" gap={1.5} alignItems="center"
                            sx={{p:2.5,borderRight:{md:i<3?'1px solid #E6E6E6':'none'},
                                 borderBottom:{xs:i<2?'1px solid #E6E6E6':'none',md:'none'},
                                 borderLeft:{xs:i%2===1?'1px solid #E6E6E6':'none',md:'none'}}}>
                            <Box sx={{color:'#000',display:'flex','& svg':{fontSize:26}}}>{f.icon}</Box>
                            <Stack>
                                <Typography sx={{fontSize:13.5,fontWeight:600,color:'#000',lineHeight:1.3}}>{f.head}</Typography>
                                <Typography sx={{fontSize:12,color:'#7D7D7D'}}>{f.sub}</Typography>
                            </Stack>
                        </Stack>
                    ))}
                </Box>

                {/* products - heading added */}
                <Stack rowGap={2} mt={3} sx={{px:{xs:2,md:4}}}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                        <Stack gap={0.5}>
                            <Typography variant="h5" fontWeight={900} sx={{color:"#000000",letterSpacing:"-0.02em"}}>All Products</Typography>
                            <Typography variant="body2" sx={{color:"#7D7D7D"}}>Handpicked for Nepal • {totalResults||products?.length||0} items • eSewa, Khalti & COD</Typography>
                        </Stack>
                    </Stack>
                    {/* sort options */}
                    <Stack flexDirection={'row'} mr={'2rem'} justifyContent={'flex-end'} alignItems={'center'} columnGap={5}>
                                        
                        <Stack alignSelf={'flex-end'} width={'12rem'}>
                            <FormControl fullWidth>
                                    <InputLabel id="sort-dropdown">Sort</InputLabel>
                                    <Select
                                        variant='standard'
                                        labelId="sort-dropdown"
                                        label="Sort"
                                        onChange={(e)=>setSort(e.target.value)}
                                        value={sort}
                                    >
                                        <MenuItem bgcolor='text.secondary' value={null}>Reset</MenuItem>
                                        {
                                            sortOptions.map((option)=>(
                                                <MenuItem key={option} value={option}>{option.name}</MenuItem>
                                            ))
                                        }
                                    </Select>
                            </FormControl>
                        </Stack>
                    
                    </Stack>

                    {/* product grid */}
                    {/* One responsive grid; the tiles size themselves to the column. */}
                    <Box sx={{
                        display:'grid',
                        gridTemplateColumns:{xs:'repeat(2,1fr)',sm:'repeat(3,1fr)',lg:'repeat(4,1fr)',xl:'repeat(5,1fr)'},
                        gap:{xs:1.5,sm:2},
                        alignItems:'stretch',
                    }}>
                        {
                            products.map((product)=>(
                                <ProductCard
                                    key={product._id}
                                    id={product._id}
                                    title={product.title}
                                    thumbnail={product.thumbnail}
                                    brand={product.brand?.name}
                                    price={product.price}
                                    stockQuantity={product.stockQuantity}
                                    discountPercentage={product.discountPercentage}
                                    handleAddRemoveFromWishlist={handleAddRemoveFromWishlist}/>
                            ))
                        }
                    </Box>
                    
                    {/* pagination */}
                    <Stack alignItems="center" rowGap={1.5} sx={{mt:5,pt:4,borderTop:'1px solid #E6E6E6'}}>
                        <Pagination
                            size={is488?'medium':'large'}
                            page={page}
                            onChange={(e,p)=>{setPage(p); window.scrollTo({top:0,behavior:'smooth'})}}
                            count={Math.ceil(totalResults/ITEMS_PER_PAGE)}
                            siblingCount={is488?0:1}
                            shape="rounded"
                            sx={{
                                '& .MuiPaginationItem-root':{
                                    borderRadius:'4px', fontWeight:500, color:'#000',
                                    border:'1px solid #E6E6E6',
                                    '&:hover':{borderColor:'#000',bgcolor:'transparent'},
                                },
                                '& .Mui-selected':{
                                    bgcolor:'#000 !important', color:'#fff', borderColor:'#000',
                                    '&:hover':{bgcolor:'#DB4444 !important',borderColor:'#DB4444'},
                                },
                            }}
                        />
                        <Typography sx={{fontSize:13,color:'#7D7D7D'}}>
                            {(page-1)*ITEMS_PER_PAGE+1}–{page*ITEMS_PER_PAGE>totalResults?totalResults:page*ITEMS_PER_PAGE} of {totalResults} products
                        </Typography>
                    </Stack>    
                
                </Stack>
                
        </Stack>
        </>
    }

    </>
  )
}
