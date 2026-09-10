import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Chip, Stack, TextField, InputAdornment, useMediaQuery, useTheme, Divider, Box, Drawer } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserInfo } from '../../user/UserSlice';
import { selectCartItems } from '../../cart/CartSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import MenuIcon from '@mui/icons-material/Menu';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import { selectProductIsFilterOpen, toggleFilters, fetchProductsAsync } from '../../products/ProductSlice';
import { selectCategories } from '../../categories/CategoriesSlice';
import { selectBrands } from '../../brands/BrandSlice';
import { ITEMS_PER_PAGE } from '../../../constants';

export const Navbar=({isProductList=false})=> {
  const userInfo=useSelector(selectUserInfo)
  const cartItems=useSelector(selectCartItems)
  const navigate=useNavigate()
  const dispatch=useDispatch()
  const theme=useTheme()
  const is480=useMediaQuery(theme.breakpoints.down(480))
  const is900=useMediaQuery(theme.breakpoints.down(900))
  const is1200=useMediaQuery(theme.breakpoints.down(1200))
  const wishlistItems=useSelector(selectWishlistItems)
  const isProductFilterOpen=useSelector(selectProductIsFilterOpen)
  const categories=useSelector(selectCategories)
  const brands=useSelector(selectBrands)
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [catAnchor, setCatAnchor] = React.useState(null);
  const [brandAnchor, setBrandAnchor] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const handleOpenUserMenu = (e)=>setAnchorElUser(e.currentTarget);
  const handleCloseUserMenu = ()=>setAnchorElUser(null);
  const handleSearch = (e)=>{
    e.preventDefault();
    if(!search.trim()) return;
    dispatch(fetchProductsAsync({search:search.trim(), pagination:{page:1,limit:ITEMS_PER_PAGE}, user:true}))
    navigate('/')
  }
  const handleCategorySelect=(catId)=>{
    setCatAnchor(null)
    dispatch(fetchProductsAsync({category:[catId], pagination:{page:1,limit:ITEMS_PER_PAGE}, user:true}))
    navigate('/')
  }
  const handleBrandSelect=(brandId)=>{
    setBrandAnchor(null)
    dispatch(fetchProductsAsync({brand:[brandId], pagination:{page:1,limit:ITEMS_PER_PAGE}, user:true}))
    navigate('/')
  }
  const settings = [
    {name:"Home",to:"/"},
    {name:'Profile',to:"/profile"},
    {name:'My orders',to:"/orders"},
    {name:'Logout',to:"/logout"},
  ];
  return (
    <AppBar position="sticky" sx={{backgroundColor:"white",color:"text.primary",boxShadow:"0 1px 8px rgba(0,0,0,0.08)"}}>
      <Box sx={{bgcolor:"#1a1a1a",color:"white",py:0.6,px:2,display:{xs:'none',md:'flex'},justifyContent:"space-between",alignItems:"center"}}>
        <Stack direction="row" gap={2} alignItems="center">
          <Stack direction="row" gap={0.5} alignItems="center"><LocationOnIcon sx={{fontSize:14}}/><Typography variant="caption">Kathmandu, Nepal — Delivery all over Nepal</Typography></Stack>
          <Divider orientation="vertical" flexItem sx={{bgcolor:"rgba(255,255,255,0.2)"}}/>
          <Stack direction="row" gap={0.5} alignItems="center"><PhoneIcon sx={{fontSize:14}}/><Typography variant="caption">+977 980-1234567</Typography></Stack>
        </Stack>
        <Stack direction="row" gap={1} alignItems="center">
          <Chip label="🇳🇵 Mission Shop" size="small" sx={{bgcolor:"#60BB46",color:"white",height:18,fontSize:10,fontWeight:700}}/>
        </Stack>
      </Box>
      <Toolbar sx={{py:1,display:"flex",justifyContent:"space-between",gap:2,flexWrap:"wrap"}}>
        <Stack direction="row" alignItems="center" gap={1}>
          {is900 && <IconButton onClick={()=>setMobileOpen(!mobileOpen)}><MenuIcon/></IconButton>}
          <Typography variant="h6" component={Link} to="/" sx={{fontWeight:900,letterSpacing:"0.04em",color:"inherit",textDecoration:"none",fontSize:{xs:"1.1rem",md:"1.3rem"}}}>
            MISSION <Box component="span" sx={{color:theme.palette.primary.main}}>SHOP</Box>
          </Typography>
          {!is900 && <Chip label="Nepal's Own" size="small" variant="outlined" sx={{ml:1,height:20,fontSize:10}}/>}
        </Stack>
        <Box component="form" onSubmit={handleSearch} sx={{flex:1,maxWidth:600,mx:is900?0:2,display:"flex",gap:0,order:is900?3:2,width:is900?"100%":"auto"}}>
          <TextField fullWidth size="small" placeholder="Search products — e.g. jacket, perfume, watch..." value={search} onChange={(e)=>setSearch(e.target.value)}
            InputProps={{startAdornment:<InputAdornment position="start"><SearchIcon color="action"/></InputAdornment>, sx:{bgcolor:"#f5f5f5",borderRadius:"8px 0 0 8px","& fieldset":{borderColor:"#e0e0e0"}}}}/>
          <Button type="submit" variant="contained" sx={{borderRadius:"0 8px 8px 0",px:3,whiteSpace:"nowrap"}}>Search</Button>
        </Box>
        <Stack direction="row" gap={is480?0.5:1} alignItems="center" order={is900?2:3}>
          <Tooltip title="Wishlist"><Badge badgeContent={wishlistItems?.length||0} color="error"><IconButton component={Link} to="/wishlist"><FavoriteBorderIcon/></IconButton></Badge></Tooltip>
          <Tooltip title="Cart"><Badge badgeContent={cartItems?.length||0} color="error"><IconButton onClick={()=>navigate("/cart")}><ShoppingCartOutlinedIcon/></IconButton></Badge></Tooltip>
          {isProductList && <IconButton onClick={()=>dispatch(toggleFilters())}><TuneIcon sx={{color:isProductFilterOpen?"black":""}}/></IconButton>}
          <Divider orientation="vertical" flexItem sx={{mx:0.5,display:{xs:'none',sm:'block'}}} />
          <Tooltip title="Account"><IconButton onClick={handleOpenUserMenu} sx={{p:0}}><Avatar alt={userInfo?.name} src="null" sx={{width:32,height:32}}/></IconButton></Tooltip>
          <Menu anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleCloseUserMenu} sx={{mt:"45px"}} anchorOrigin={{vertical:'top',horizontal:'right'}} transformOrigin={{vertical:'top',horizontal:'right'}}>
            {settings.map(s=>(<MenuItem key={s.name} onClick={handleCloseUserMenu}><Typography component={Link} to={s.to} color="text.primary" sx={{textDecoration:"none"}}>{s.name}</Typography></MenuItem>))}
          </Menu>
          {!is480 && <Typography variant="body2" fontWeight={500} sx={{maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userInfo?.name?"Hi, "+userInfo.name.split(" ")[0]:""}</Typography>}
        </Stack>
      </Toolbar>
      <Divider sx={{display:{xs:'none',md:'block'}}} />
      <Toolbar sx={{minHeight:"48px !important",py:0,px:2,display:{xs:'none',md:'flex'},justifyContent:"space-between",bgcolor:"#fafafa",gap:2}}>
        <Stack direction="row" gap={1} alignItems="center">
          <Button variant="contained" size="small" onClick={(e)=>setCatAnchor(e.currentTarget)} endIcon={<Box sx={{fontSize:10}}>▼</Box>} sx={{borderRadius:2,textTransform:"none",fontWeight:700}}>Categories</Button>
          <Menu anchorEl={catAnchor} open={Boolean(catAnchor)} onClose={()=>setCatAnchor(null)}>
            <MenuItem onClick={()=>{setCatAnchor(null); dispatch(fetchProductsAsync({pagination:{page:1,limit:ITEMS_PER_PAGE},user:true})); navigate('/')}}>All Categories</MenuItem>
            {categories?.map(c=>(<MenuItem key={c._id} onClick={()=>handleCategorySelect(c._id)}>{c.name}</MenuItem>))}
          </Menu>
          <Button size="small" onClick={(e)=>setBrandAnchor(e.currentTarget)} sx={{textTransform:"none"}}>Brands ▾</Button>
          <Menu anchorEl={brandAnchor} open={Boolean(brandAnchor)} onClose={()=>setBrandAnchor(null)}>
            {brands?.slice(0,10).map(b=>(<MenuItem key={b._id} onClick={()=>handleBrandSelect(b._id)}>{b.name}</MenuItem>))}
          </Menu>
          <Divider orientation="vertical" flexItem />
          <Stack direction="row" gap={2} sx={{ml:1}}>
            <Typography component={Link} to="/" variant="body2" sx={{textDecoration:"none",color:"text.primary",fontWeight:500,":hover":{color:"primary.main"}}}>Home</Typography>
            <Typography component={Link} to="/orders" variant="body2" sx={{textDecoration:"none",color:"text.secondary"}}>My Orders</Typography>
            <Typography component={Link} to="/wishlist" variant="body2" sx={{textDecoration:"none",color:"text.secondary"}}>Wishlist</Typography>
          </Stack>
        </Stack>
        <Stack direction="row" gap={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">Free delivery Kathmandu Valley • 24h support</Typography>
          <Chip label="NPR • eSewa Khalti" size="small" variant="outlined" sx={{height:22}}/>
        </Stack>
      </Toolbar>
      <Drawer anchor="left" open={mobileOpen} onClose={()=>setMobileOpen(false)}>
        <Box sx={{width:260,p:2}} role="presentation">
          <Typography fontWeight={900} mb={2}>MISSION SHOP</Typography>
          <Stack gap={1}>
            <Typography fontWeight={600} variant="body2">Categories</Typography>
            {categories?.slice(0,12).map(c=>(<Button key={c._id} size="small" sx={{justifyContent:"flex-start",textTransform:"none"}} onClick={()=>{handleCategorySelect(c._id); setMobileOpen(false)}}>{c.name}</Button>))}
            <Divider sx={{my:1}}/>
            <Typography fontWeight={600} variant="body2">Brands</Typography>
            {brands?.slice(0,8).map(b=>(<Button key={b._id} size="small" sx={{justifyContent:"flex-start",textTransform:"none"}} onClick={()=>{handleBrandSelect(b._id); setMobileOpen(false)}}>{b.name}</Button>))}
          </Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}
