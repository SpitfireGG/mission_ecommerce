// @ts-nocheck
'use client';
import { useEffect, useState, useRef } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const LS_TOKEN='mission_admin_token', LS_BASIC='mission_admin_basic';
function authHeaders(){
  const token=typeof window!=='undefined'?localStorage.getItem(LS_TOKEN):null;
  const basic=typeof window!=='undefined'?localStorage.getItem(LS_BASIC):null;
  const h:any={'Content-Type':'application/json'};
  if(basic) h['Authorization']='Basic '+basic;
  else if(token) h['Authorization']='Bearer '+token;
  return h;
}
async function api(path, opts:any={}){
  const res=await fetch(path,{...opts, headers:{...authHeaders(), ...(opts.headers||{})}});
  if(res.status===401) throw new Error('Unauthorized');
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||data.message||'Request failed');
  return data;
}
function isAuthed(){ if(typeof window==='undefined') return false; return !!localStorage.getItem(LS_BASIC) || !!localStorage.getItem(LS_TOKEN); }
export default function AdminPage(){
  const [authed,setAuthed]=useState(false);
  const [hash,setHash]=useState('dashboard');
  const [user,setUser]=useState('admin');
  const [pass,setPass]=useState('helloWorld@123');
  const [err,setErr]=useState('');
  const [stats,setStats]=useState<any>(null);
  const [orders,setOrders]=useState<any[]>([]);
  const [products,setProducts]=useState<any[]>([]);
  const [audit,setAudit]=useState<any[]>([]);
  const [coupons,setCoupons]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [prodSearch,setProdSearch]=useState('');
  const [prodFilter,setProdFilter]=useState('');
  const [orderSearch,setOrderSearch]=useState('');
  const [orderFilter,setOrderFilter]=useState('');
  const [showProdModal,setShowProdModal]=useState(false);
  const [editProd,setEditProd]=useState<any>(null);
  const [form,setForm]=useState({title:'', category:'', price:'', compareAt:'', stock:'0', rating:'5', images:'', sizes:'', description:''});
  const [detailUuid,setDetailUuid]=useState<string|null>(null);
  const [detailOrder,setDetailOrder]=useState<any>(null);
  const [repFrom,setRepFrom]=useState('');
  const [repTo,setRepTo]=useState('');
  const [repData,setRepData]=useState<any>(null);
  const [couponForm,setCouponForm]=useState({code:'', type:'percent', value:'10', minAmount:'1000'});
  const [collapsed,setCollapsed]=useState(false);
  const [globalSearch,setGlobalSearch]=useState('');
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    setAuthed(isAuthed());
    const c=localStorage.getItem('mission_sidebar_collapsed')==='1';
    setCollapsed(c);
    const h=location.hash||'#/dashboard';
    setHash(h.replace('#/','').split('?')[0]||'dashboard');
    const onHash=()=> setHash((location.hash||'#/dashboard').replace('#/','').split('?')[0]||'dashboard');
    window.addEventListener('hashchange', onHash);
    return()=> window.removeEventListener('hashchange', onHash);
  },[]);
  const loadAll=async()=>{
    setLoading(true);
    try{
      const [s,o,p,a,c]=await Promise.all([
        api(`${API}/api/admin/stats`).catch(()=>null),
        api(`${API}/api/admin/orders`).catch(()=>[]),
        api(`${API}/api/admin/products`).catch(()=>[]),
        api(`${API}/api/admin/audit`).catch(()=>[]),
        api(`${API}/api/admin/coupons`).catch(()=>[]),
      ]);
      setStats(s); setOrders(Array.isArray(o)?o:[]); setProducts(Array.isArray(p)?p:[]); setAudit(Array.isArray(a)?a:[]); setCoupons(Array.isArray(c)?c:[]);
    }catch(e:any){ setErr(e.message); }
    setLoading(false);
  };
  useEffect(()=>{ if(authed) loadAll(); },[authed]);
  useEffect(()=>{
    if(hash==='dashboard' && stats?.trend && canvasRef.current){
      const c=canvasRef.current; const ctx=c.getContext('2d'); if(!ctx) return;
      const W=c.width, H=c.height, pad=28;
      ctx.clearRect(0,0,W,H);
      const trend=stats.trend;
      const max=Math.max(1,...trend.map((t:any)=>t.count));
      ctx.strokeStyle='oklch(0.885 0.005 106)'; ctx.lineWidth=1;
      for(let i=0;i<5;i++){ const y=pad+(H-pad*2)*(i/4); ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke(); }
      ctx.strokeStyle='oklch(0.333 0.051 201)'; ctx.lineWidth=2; ctx.beginPath();
      trend.forEach((t:any,i:number)=>{
        const x=pad+(W-pad*2)*(i/(trend.length-1||1));
        const y=H-pad-(H-pad*2)*(t.count/max);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }); ctx.stroke();
      trend.forEach((t:any,i:number)=>{
        const x=pad+(W-pad*2)*(i/(trend.length-1||1));
        const y=H-pad-(H-pad*2)*(t.count/max);
        ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle='oklch(0.333 0.051 201)'; ctx.fill();
        ctx.fillStyle='oklch(0.53 0.008 200)'; ctx.font='10px system-ui'; ctx.fillText(t.day.slice(0,3), x-10, H-6); ctx.fillStyle='oklch(0.333 0.051 201)';
      });
    }
  },[stats,hash]);
  const login=async(e:any)=>{
    e.preventDefault();
    try{
      const r=await fetch(`${API}/api/admin/login`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:user,password:pass})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Login failed');
      localStorage.setItem(LS_TOKEN,d.token||'');
      localStorage.setItem(LS_BASIC,d.basic||'');
      setAuthed(true); setErr(''); location.hash='#/dashboard';
    }catch(e:any){ setErr(e.message==='Failed to fetch'?'Backend not reachable at '+API: e.message); }
  };
  const logout=()=>{ localStorage.removeItem(LS_TOKEN); localStorage.removeItem(LS_BASIC); setAuthed(false); location.hash='#/login'; };
  const toggleSidebar=()=>{
    const v=!collapsed;
    setCollapsed(v); localStorage.setItem('mission_sidebar_collapsed', v?'1':'0');
  };
  const openCreate=()=>{
    setEditProd(null); setForm({title:'', category:'', price:'', compareAt:'', stock:'0', rating:'5', images:'', sizes:'', description:''}); setShowProdModal(true);
  };
  const openEdit=(p:any)=>{
    setEditProd(p); setForm({title:p.title||'', category:p.category||'', price: String(p.price||''), compareAt: String(p.compareAt||''), stock: String(p.stock||0), rating: String(p.rating||5), images:(p.images||[]).join(', '), sizes:(p.sizes||[]).join(', '), description:p.description||''}); setShowProdModal(true);
  };
  const submitProduct=async(e:any)=>{
    e.preventDefault();
    const payload:any={
      title: form.title,
      category: form.category,
      price: Number(form.price),
      compareAt: form.compareAt?Number(form.compareAt):null,
      stock: Number(form.stock),
      rating: Number(form.rating),
      images: form.images.split(',').map((s:string)=>s.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map((s:string)=>s.trim()).filter(Boolean),
      description: form.description,
      badge: 'new', reorderLevel: 5
    };
    if(payload.sizes.length===0) payload.sizes=null;
    try{
      if(editProd) await api(`${API}/api/admin/products/${editProd.id}`,{method:'PUT', body:JSON.stringify(payload)});
      else await api(`${API}/api/admin/products`,{method:'POST', body:JSON.stringify(payload)});
      setShowProdModal(false); loadAll();
    }catch(e:any){ alert(e.message); }
  };
  const deleteProduct=async(id:string)=>{
    if(!confirm('Delete this product?')) return;
    try{ await api(`${API}/api/admin/products/${id}`,{method:'DELETE'}); loadAll(); }catch(e:any){ alert(e.message); }
  };
  const updateOrderStatus=async(uuid:string, status:string)=>{
    try{ await api(`${API}/api/admin/orders/${uuid}`,{method:'PATCH', headers:{'X-Admin-User':'admin'}, body:JSON.stringify({status})}); loadAll(); if(detailUuid===uuid){ const o=await api(`${API}/api/admin/orders/${uuid}`); setDetailOrder(o); } }catch(e:any){ alert(e.message); }
  };
  const createCoupon=async(e:any)=>{
    e.preventDefault();
    try{
      await api(`${API}/api/admin/coupons`,{method:'POST', body:JSON.stringify({code:couponForm.code.toUpperCase(), type:couponForm.type, value:Number(couponForm.value), minAmount:Number(couponForm.minAmount), active:true})});
      setCouponForm({code:'', type:'percent', value:'10', minAmount:'1000'}); loadAll();
    }catch(e:any){ alert(e.message); }
  };
  const runReport=async()=>{
    try{
      const q=new URLSearchParams(); if(repFrom) q.set('from',repFrom); if(repTo) q.set('to',repTo);
      const d=await api(`${API}/api/admin/reports/sales?${q.toString()}`);
      setRepData(d);
    }catch(e:any){ alert(e.message); }
  };
  const exportCsv=()=>{
    const q=new URLSearchParams(); if(repFrom) q.set('from',repFrom); if(repTo) q.set('to',repTo);
    const h=authHeaders();
    fetch(`${API}/api/admin/reports/sales.csv?${q.toString()}`,{headers:{'Authorization': h['Authorization']||''}}).then(r=>r.blob()).then(b=>{
      const url=URL.createObjectURL(b); const a=document.createElement('a'); a.href=url; a.download='sales.csv'; a.click();
    });
  };
  const filteredProducts=products.filter(p=>{
    const q=prodSearch.toLowerCase()||globalSearch.toLowerCase();
    const mQ=!q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    let mC=true;
    if(prodFilter==='low') mC=p.stock<=5;
    else if(prodFilter) mC=p.category===prodFilter;
    return mQ && mC;
  });
  const filteredOrders=orders.filter(o=>{
    const q=(orderSearch||globalSearch).toLowerCase();
    const mQ=!q || String(o.orderNumber).includes(q) || o.customer?.name?.toLowerCase().includes(q) || o.transactionUuid.toLowerCase().includes(q);
    let mF=true;
    if(orderFilter) mF=o.status===orderFilter || o.paymentStatus===orderFilter;
    return mQ && mF;
  });
  const billingOrders=orders.filter(o=> o.paymentStatus==='PAID');
  const customersMap:any={};
  orders.forEach(o=>{
    const k=o.customer?.phone||o.customer?.email||o.transactionUuid;
    if(!customersMap[k]) customersMap[k]={name:o.customer?.name||'—', phone:o.customer?.phone||'', email:o.customer?.email||'', orders:0, spent:0};
    customersMap[k].orders+=1; customersMap[k].spent+=Number(o.totalAmount||0);
  });
  const customers=Object.values(customersMap).sort((a:any,b:any)=>b.spent-a.spent);
  if(!authed){
    return (
      <div className="login-wrap">
        <form className="login-card" onSubmit={login}>
          <div style={{width:40,height:40,borderRadius:10,background:'var(--primary)',color:'var(--primary-foreground)',display:'grid',placeItems:'center',fontWeight:700}}>A</div>
          <h1 style={{marginTop:14}}>Welcome back</h1>
          <p>Sign in to <b>Mission Shop</b> admin. Use <code>admin / helloWorld@123</code> or <code>demo@gmail.com</code> for demo.</p>
          {err && <div style={{marginTop:12,padding:10,borderRadius:10,background:'color-mix(in oklab,var(--destructive) 10%,transparent)',color:'var(--destructive)',fontSize:12}}>{err}</div>}
          <div className="field"><label>Username</label><input value={user} onChange={e=>setUser(e.target.value)} required placeholder="admin"/></div>
          <div className="field"><label>Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} required placeholder="••••••••"/></div>
          <button className="btn" style={{width:'100%',marginTop:18}} type="submit">Sign in</button>
          <div style={{marginTop:12,fontSize:11,color:'var(--muted-foreground)'}}>All APIs • Products, Orders, Billing, Reports, Audit • Port 4000</div>
        </form>
      </div>
    );
  }
  const nav=[
    {label:'Dashboard', hash:'#/dashboard', id:'dashboard', icon:'◧'},
    {label:'Products', hash:'#/products', id:'products', icon:'◨', subs:[{label:'All Products',hash:'#/products'},{label:'Add New', action:openCreate}]},
    {label:'Orders', hash:'#/orders', id:'orders', icon:'≡'},
    {label:'Billing', hash:'#/billing', id:'billing', icon:'₨'},
    {label:'Customers', hash:'#/customers', id:'customers', icon:'◐'},
    {label:'Coupons', hash:'#/coupons', id:'coupons', icon:'🏷'},
    {label:'Reports', hash:'#/reports', id:'reports', icon:'▭'},
    {label:'Audit Log', hash:'#/audit', id:'audit', icon:'≡'},
    {label:'Settings', hash:'#/settings', id:'settings', icon:'⚙'},
  ];
  const isActive=(id:string)=> hash===id || (id==='billing' && hash==='billing');
  return (
    <div className="shell">
      <aside className={`sidebar ${collapsed?'collapsed':''}`} id="sidebar">
        <div className="sidebar-head">
          <div className="logo">SN</div>
          <div className="brand-text"><div className="t1">Mission Shop</div><div className="t2">Nepal • Management console</div></div>
          <button className="icon-btn" onClick={toggleSidebar} style={{marginLeft:'auto',width:28,height:28}}>☰</button>
        </div>
        <nav className="nav">
          <div className="nav-group"><div className="nav-label">Main</div>
            {nav.map(n=>{
              const active=isActive(n.id);
              return (
                <div key={n.id}>
                  <a className={`nav-item ${active?'active':''}`} href={n.hash} onClick={(e)=>{ if(n.id==='products' && n.subs?.[1]?.action){} setHash(n.id); }}>
                    <span style={{width:16,height:16,display:'grid',placeItems:'center'}}>{n.icon}</span>
                    <span>{n.label}</span>
                  </a>
                  {n.subs && (
                    <div className={`nav-sub ${active?'open':''}`}>
                      {n.subs.map((s:any)=> s.action ? <a key={s.label} className="sub-item" onClick={s.action} style={{cursor:'pointer'}}>{s.label}</a> : <a key={s.label} className={`sub-item ${location.hash===s.hash?'active':''}`} href={s.hash}>{s.label}</a>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="nav-group"><div className="nav-label">System</div>
            <a className="nav-item" href="#" onClick={(e)=>{e.preventDefault(); logout();}}><span>⎋</span><span>Sign out</span></a>
          </div>
        </nav>
      </aside>
      <div className="main">
        <header className="header">
          <button className="icon-btn" onClick={toggleSidebar}>☰</button>
          <label className="search"><input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} placeholder="Search products, orders…"/><span style={{position:'absolute',left:10, display:'grid',placeItems:'center'}}>⌕</span></label>
          <div className="h-actions">
            <button className="icon-btn" title="Toggle theme" onClick={()=> document.documentElement.classList.toggle('dark')}>◐</button>
            <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:8,borderLeft:'1px solid var(--border)'}}>
              <div className="avatar">AD</div>
              <div style={{lineHeight:1.1}}><div style={{fontSize:12,fontWeight:600}}>Admin</div><div style={{fontSize:11,color:'var(--muted-foreground)'}}>Mission Shop Store</div></div>
            </div>
          </div>
        </header>
        <div className="breadcrumb"><a href="#/dashboard">Home</a><span>/</span><span style={{color:'var(--foreground)'}}>{hash}</span><span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}><span className="live-dot"></span> <span style={{fontSize:11,color:'var(--muted-foreground)'}}>Live • {loading?'Loading...':'Ready'}</span></span></div>
        <div className="content" id="content">
          {hash==='dashboard' && stats && (
            <>
              <section style={{borderBottom:'1px solid var(--border)',padding:'18px 0 20px'}}>
                <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><h1 style={{fontSize:20,fontWeight:600,letterSpacing:-.02}}>Needs attention</h1><span style={{fontSize:12,color:'var(--muted-foreground)'}}>Updated {new Date().toLocaleTimeString()}</span></div>
                <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)'}}>
                  <a href="#/orders" style={{background:'var(--background)',padding:'12px 16px'}}><div style={{fontSize:30,fontWeight:700,color:stats.pendingOrders>0?'var(--primary)':'var(--muted-foreground)'}}>{stats.pendingOrders}</div><div style={{fontSize:12,color:'var(--muted-foreground)'}}>Orders awaiting fulfilment</div></a>
                  <a href="#/products" style={{background:'var(--background)',padding:'12px 16px'}}><div style={{fontSize:30,fontWeight:700,color:stats.lowStock>0?'var(--status-alert)':'var(--muted-foreground)'}}>{stats.lowStock}</div><div style={{fontSize:12,color:'var(--muted-foreground)'}}>Products low on stock (≤5) • {(stats.lowStockProducts||[]).slice(0,3).map((p:any)=>`${p.title} (${p.stock})`).join(' • ')}</div></a>
                  <a href="#/billing" style={{background:'var(--background)',padding:'12px 16px'}}><div style={{fontSize:30,fontWeight:700}}>{stats.unpaid}</div><div style={{fontSize:12,color:'var(--muted-foreground)'}}>Unpaid orders • Billing pending</div></a>
                </div>
              </section>
              <section className="kpis" style={{marginTop:16}}>
                <div className="kpi"><div className="label">Orders</div><div className="value">{stats.totalOrders}</div><div className="sub">{stats.paidOrders} paid • {stats.pendingOrders} pending</div></div>
                <div className="kpi"><div className="label">Revenue (paid)</div><div className="value">Rs. {(stats.totalRevenue||0).toLocaleString('en-IN')}</div><div className="sub">Total settled • NPR</div></div>
                <div className="kpi"><div className="label">Products</div><div className="value">{stats.totalProducts}</div><div className="sub">{stats.categories} categories</div></div>
                <div className="kpi"><div className="label">Avg order</div><div className="value">Rs. {stats.avgOrder?Math.round(stats.avgOrder).toLocaleString('en-IN'):'—'}</div><div className="sub">Paid orders only</div></div>
              </section>
              <section className="grid2" style={{marginTop:16}}>
                <div className="card"><div className="card-head"><h2>Last 7 days — orders</h2><span style={{fontSize:11,color:'var(--muted-foreground)'}}>{stats.trend?.map((t:any)=>t.count).join(' • ')}</span></div><div className="chart"><canvas ref={canvasRef} width={600} height={180}></canvas></div></div>
                <div className="card"><div className="card-head"><h2>Mix by category</h2></div><div style={{padding:14}}>{stats.mix?.map((m:any,i:number)=><div key={m.name} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}><span style={{display:'flex',gap:8,alignItems:'center'}}><span style={{width:8,height:8,borderRadius:99,background:`var(--chart-${(i%5)+1})`}}></span> {m.name}</span><span style={{color:'var(--muted-foreground)'}}>{m.count} ({Math.round(m.count/stats.totalProducts*100)}%)</span></div>)}</div></div>
              </section>
            </>
          )}
          {hash==='products' && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12,flexWrap:'wrap'}}>
                <h1 style={{fontSize:18,fontWeight:600}}>Products</h1>
                <div className="toolbar"><input className="input" value={prodSearch} onChange={e=>setProdSearch(e.target.value)} placeholder="Search title or category"/><select className="select" value={prodFilter} onChange={e=>setProdFilter(e.target.value)}><option value="">All categories</option>{[...new Set(products.map(p=>p.category))].map(c=> <option key={c} value={c}>{c}</option>)}<option value="low">Low stock</option></select><button className="btn" onClick={openCreate}>+ Add product</button></div>
              </div>
              <div className="card"><div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>
                {filteredProducts.map(p=>(
                  <tr key={p.id}><td><div style={{display:'flex',gap:10,alignItems:'center'}}><img src={p.images?.[0]||''} style={{width:40,height:40,objectFit:'cover',borderRadius:8,border:'1px solid var(--border)'}} onError={(e:any)=>e.target.style.display='none'}/><div><div style={{fontWeight:500}}>{p.title}</div><div style={{fontSize:11,color:'var(--muted-foreground)'}}>{p.id} • {p.slug}</div></div></div></td><td>{p.category}</td><td>Rs. {Number(p.price).toLocaleString('en-IN')}</td><td>{p.stock}</td><td><span className={`badge ${p.stock===0?'badge-pending':p.stock<=5?'badge-draft':'badge-live'}`}>{p.stock===0?'Out':p.stock<=5?'Low':'In stock'}</span></td><td style={{whiteSpace:'nowrap'}}><button className="btn btn-ghost" style={{height:32,padding:'0 10px'}} onClick={()=>openEdit(p)}>Edit</button> <button className="btn btn-ghost" style={{height:32,padding:'0 10px',color:'var(--destructive)'}} onClick={()=>deleteProduct(p.id)}>Delete</button></td></tr>
                ))}
                {filteredProducts.length===0 && <tr><td colSpan={6}><div className="empty">No products</div></td></tr>}
              </tbody></table></div></div>
            </>
          )}
          {hash==='orders' && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12,flexWrap:'wrap'}}>
                <h1 style={{fontSize:18,fontWeight:600}}>Orders</h1>
                <div className="toolbar"><input className="input" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Search order # or customer"/><select className="select" value={orderFilter} onChange={e=>setOrderFilter(e.target.value)}><option value="">All</option><option>Pending</option><option>Dispatched</option><option>Out for delivery</option><option>Cancelled</option><option value="PAID">Paid</option></select></div>
              </div>
              <div className="card"><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Fulfilment</th><th></th></tr></thead><tbody>
                {filteredOrders.map(o=>(
                  <tr key={o.transactionUuid}><td><div style={{fontWeight:600}}>#{o.orderNumber}</div><div style={{fontSize:11,color:'var(--muted-foreground)'}}>{o.transactionUuid.slice(0,16)}… • {new Date(o.createdAt).toLocaleDateString()}</div></td><td><div>{o.customer?.name||'—'}</div><div style={{fontSize:11,color:'var(--muted-foreground)'}}>{o.customer?.phone||''}</div></td><td>Rs. {Number(o.totalAmount).toLocaleString('en-IN')}</td><td><span className={`badge ${o.paymentStatus==='PAID'?'badge-paid':'badge-pending'}`}>{o.paymentStatus}</span><div style={{fontSize:11,color:'var(--muted-foreground)'}}>{o.method}</div></td><td><select value={o.status} onChange={e=>updateOrderStatus(o.transactionUuid, e.target.value)} className="select" style={{height:32}}><option>Pending</option><option>Dispatched</option><option>Out for delivery</option><option>Cancelled</option></select></td><td><button className="btn btn-ghost" style={{height:32}} onClick={()=>{ setDetailUuid(o.transactionUuid); setDetailOrder(o); setHash('order-detail'); }}>View</button></td></tr>
                ))}
                {filteredOrders.length===0 && <tr><td colSpan={6}><div className="empty">No orders yet — place a test checkout to populate.</div></td></tr>}
              </tbody></table></div></div>
            </>
          )}
          {hash==='billing' && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <h1 style={{fontSize:18,fontWeight:600}}>Billing • Paid Orders</h1>
                <div style={{fontSize:12,color:'var(--muted-foreground)'}}>Total collected: Rs. {billingOrders.reduce((s,o)=>s+Number(o.totalAmount),0).toLocaleString('en-IN')} • {billingOrders.length} invoices</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12, marginBottom:16}}>
                <div className="kpi"><div className="label">Paid invoices</div><div className="value">{billingOrders.length}</div><div className="sub">Settled via eSewa/Khalti/Dummy</div></div>
                <div className="kpi"><div className="label">Revenue</div><div className="value">Rs. {billingOrders.reduce((s,o)=>s+Number(o.totalAmount),0).toLocaleString('en-IN')}</div><div className="sub">NPR • after discounts</div></div>
                <div className="kpi"><div className="label">Avg paid</div><div className="value">Rs. {billingOrders.length? Math.round(billingOrders.reduce((s,o)=>s+Number(o.totalAmount),0)/billingOrders.length).toLocaleString('en-IN'):'—'}</div><div className="sub">Per order</div></div>
              </div>
              <div className="card"><div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Customer & Billing</th><th>Date paid</th><th>Method</th><th>Amount</th><th></th></tr></thead><tbody>
                {billingOrders.map(o=>(
                  <tr key={o.transactionUuid}><td><div style={{fontWeight:600}}>INV-#{o.orderNumber}</div><div style={{fontSize:11,color:'var(--muted-foreground)'}}>{o.transactionUuid.slice(0,12)}</div></td><td><div>{o.customer?.name}</div><div style={{fontSize:11,color:'var(--muted-foreground)'}}>{o.customer?.email} • {o.customer?.phone}</div><div style={{fontSize:11,color:'var(--muted-foreground)'}}>{o.customer?.address} {o.customer?.city}</div></td><td style={{fontSize:12}}>{new Date(o.createdAt).toLocaleDateString()} <div style={{fontSize:11,color:'var(--muted-foreground)'}}>{o.paymentRef||'no ref'}</div></td><td><span className="badge badge-paid">{o.method}</span></td><td style={{fontWeight:600}}>Rs. {Number(o.totalAmount).toLocaleString('en-IN')}</td><td><a className="btn btn-ghost" style={{height:32}} href={`/invoice/${o.transactionUuid}`} target="_blank">Invoice</a> <a className="btn btn-ghost" style={{height:32}} href={`/label/${o.transactionUuid}`} target="_blank">Label</a></td></tr>
                ))}
                {billingOrders.length===0 && <tr><td colSpan={6}><div className="empty">No paid invoices yet. Checkout with dummy gateway to test.</div></td></tr>}
              </tbody></table></div></div>
            </>
          )}
          {hash==='order-detail' && detailOrder && (
            <div>
              <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}><button className="btn btn-ghost" onClick={()=>setHash('orders')}>← Back</button><h1 style={{fontSize:18,fontWeight:600}}>Order #{detailOrder.orderNumber}</h1><span className={`badge ${detailOrder.paymentStatus==='PAID'?'badge-paid':'badge-pending'}`}>{detailOrder.paymentStatus}</span><span className="badge">{detailOrder.status}</span></div>
              <div className="grid2">
                <div className="card"><div className="card-head"><h2>Items • Rs. {Number(detailOrder.totalAmount).toLocaleString('en-IN')}</h2></div><div className="table-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>{(detailOrder.lines||[]).map((l:any,i:number)=><tr key={i}><td>{l.title} {l.size?`(${l.size})`:''}</td><td>{l.qty}</td><td>Rs. {Number(l.lineTotal).toLocaleString('en-IN')}</td></tr>)}<tr><td colSpan={2} style={{textAlign:'right',color:'var(--muted-foreground)'}}>Subtotal</td><td>Rs. {Number(detailOrder.subtotal).toLocaleString('en-IN')}</td></tr><tr><td colSpan={2} style={{textAlign:'right',color:'var(--muted-foreground)'}}>Delivery</td><td>Rs. {Number(detailOrder.deliveryCharge).toLocaleString('en-IN')}</td></tr><tr><td colSpan={2} style={{textAlign:'right',color:'var(--muted-foreground)'}}>VAT (13%)</td><td>Rs. {Number(detailOrder.vat||0).toLocaleString('en-IN')}</td></tr><tr><td colSpan={2} style={{textAlign:'right',fontWeight:600}}>Total</td><td style={{fontWeight:600}}>Rs. {Number(detailOrder.totalAmount).toLocaleString('en-IN')}</td></tr></tbody></table></div></div>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="card"><div className="card-head"><h2>Customer & Billing</h2></div><div style={{padding:14,fontSize:13,lineHeight:1.7}}><div><b>{detailOrder.customer?.name||'—'}</b></div><div>{detailOrder.customer?.email||''}</div><div>{detailOrder.customer?.phone||''}</div><div>{detailOrder.customer?.address||''} {detailOrder.customer?.city||''} {detailOrder.customer?.state||''} {detailOrder.customer?.postcode||''}</div><div style={{marginTop:8, fontSize:11, color:'var(--muted-foreground)'}}>IP: {detailOrder.customerIp||'—'} • {detailOrder.method} • {detailOrder.couponCode?`Coupon ${detailOrder.couponCode} (-Rs.${detailOrder.discountAmount})`:''}</div></div></div>
                  <div className="card"><div className="card-head"><h2>Fulfilment & Billing</h2></div><div style={{padding:14,display:'flex',gap:8,flexWrap:'wrap'}}><select value={detailOrder.status} onChange={e=>updateOrderStatus(detailOrder.transactionUuid, e.target.value)} className="select"><option>Pending</option><option>Dispatched</option><option>Out for delivery</option><option>Cancelled</option></select><a className="btn btn-ghost" href={`/invoice/${detailOrder.transactionUuid}`} target="_blank">Invoice</a><a className="btn btn-ghost" href={`/label/${detailOrder.transactionUuid}`} target="_blank">Label</a></div><div style={{padding:'0 14px 14px',fontSize:11,color:'var(--muted-foreground)'}}>Created {new Date(detailOrder.createdAt).toLocaleString()} • Ref: {detailOrder.paymentRef||'—'} • Gateway: {detailOrder.gatewayStatus||detailOrder.paymentStatus}</div></div>
                </div>
              </div>
            </div>
          )}
          {hash==='customers' && (
            <><h1 style={{fontSize:18,fontWeight:600,marginBottom:12}}>Customers <span style={{fontWeight:400,color:'var(--muted-foreground)',fontSize:13}}>({customers.length})</span></h1><div className="card"><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Billing total</th></tr></thead><tbody>{customers.map((c:any,i:number)=><tr key={i}><td>{c.name}</td><td><div style={{fontSize:12}}>{c.phone}</div><div style={{fontSize:11,color:'var(--muted-foreground)'}}>{c.email}</div></td><td>{c.orders}</td><td>Rs. {c.spent.toLocaleString('en-IN')}</td></tr>)} {customers.length===0 && <tr><td colSpan={4}><div className="empty">No customers yet</div></td></tr>}</tbody></table></div></div></>
          )}
          {hash==='coupons' && (
            <><h1 style={{fontSize:18,fontWeight:600}}>Coupons & Billing</h1>
              <div style={{display:'grid',gridTemplateColumns:'360px 1fr', gap:16, marginTop:12}}>
                <div className="card"><div className="card-head"><h2>Create coupon</h2></div><form onSubmit={createCoupon} style={{padding:14, display:'flex', flexDirection:'column', gap:10}}>
                  <div className="field" style={{marginTop:0}}><label>Code</label><input value={couponForm.code} onChange={e=>setCouponForm({...couponForm, code:e.target.value})} placeholder="WELCOME20" required style={{textTransform:'uppercase'}}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <div className="field" style={{marginTop:0}}><label>Type</label><select value={couponForm.type} onChange={e=>setCouponForm({...couponForm, type:e.target.value})}><option value="percent">Percent %</option><option value="flat">Flat NPR</option></select></div>
                    <div className="field" style={{marginTop:0}}><label>Value</label><input type="number" value={couponForm.value} onChange={e=>setCouponForm({...couponForm, value:e.target.value})} required/></div>
                  </div>
                  <div className="field" style={{marginTop:0}}><label>Min amount NPR</label><input type="number" value={couponForm.minAmount} onChange={e=>setCouponForm({...couponForm, minAmount:e.target.value})}/></div>
                  <button className="btn" type="submit">Create</button>
                </form></div>
                <div className="card"><div className="card-head"><h2>Active coupons</h2><span style={{fontSize:11,color:'var(--muted-foreground)'}}>{coupons.length} codes</span></div><div className="table-wrap"><table><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Active</th></tr></thead><tbody>{coupons.map((c:any)=><tr key={c.id}><td style={{fontWeight:600}}>{c.code}</td><td>{c.type}</td><td>{c.type==='percent'?`${c.value}%`:`Rs. ${c.value}`}</td><td>Rs. {c.minAmount}</td><td><span className={`badge ${c.active?'badge-live':'badge-draft'}`}>{c.active?'Active':'Off'}</span></td></tr>)}{coupons.length===0 && <tr><td colSpan={5}><div className="empty">No coupons</div></td></tr>}</tbody></table></div></div>
              </div>
            </>
          )}
          {hash==='reports' && (
            <><h1 style={{fontSize:18,fontWeight:600}}>Sales Reports & Billing</h1>
              <div className="card" style={{marginTop:12,padding:16}}>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'end'}}>
                  <div className="field" style={{marginTop:0}}><label>From</label><input type="date" value={repFrom} onChange={e=>setRepFrom(e.target.value)}/></div>
                  <div className="field" style={{marginTop:0}}><label>To</label><input type="date" value={repTo} onChange={e=>setRepTo(e.target.value)}/></div>
                  <button className="btn" onClick={runReport}>Run</button>
                  <button className="btn btn-ghost" onClick={exportCsv}>Export CSV</button>
                </div>
                {repData && <div style={{marginTop:16, display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}><div className="kpi"><div className="label">Revenue</div><div className="value">Rs. {Number(repData.revenue||0).toLocaleString('en-IN')}</div></div><div className="kpi"><div className="label">Orders</div><div className="value">{repData.totalOrders}</div></div><div className="kpi"><div className="label">Avg</div><div className="value">Rs. {repData.totalOrders?Math.round(repData.revenue/repData.totalOrders):0}</div></div></div>}
                {repData && <div style={{marginTop:12,fontSize:12, padding:12, background:'var(--muted)', borderRadius:8}}><div>By payment: {JSON.stringify(repData.byPayment)}</div><div style={{marginTop:6}}>By day: {JSON.stringify(repData.byDay)}</div><div style={{marginTop:6}}>Invoices: {repData.orders?.length||0} billing records</div></div>}
              </div>
            </>
          )}
          {hash==='audit' && (
            <><h1 style={{fontSize:18,fontWeight:600}}>Audit Log <span style={{fontWeight:400,color:'var(--muted-foreground)',fontSize:13}}>({audit.length})</span></h1>
              <div className="card" style={{marginTop:12}}><div className="table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>{audit.map((l:any,i:number)=><tr key={i}><td style={{whiteSpace:'nowrap',fontSize:12}}>{new Date(l.createdAt).toLocaleString()}</td><td>{l.actor}</td><td><span className="badge">{l.action}</span></td><td>{l.entity} {l.entityId?.slice(0,8)}</td><td style={{fontSize:12,color:'var(--muted-foreground)', maxWidth:300, overflow:'hidden', textOverflow:'ellipsis'}}>{JSON.stringify(l.meta||{}).slice(0,120)}</td></tr>)}{audit.length===0 && <tr><td colSpan={5}><div className="empty">No actions yet — update an order status to generate.</div></td></tr>}</tbody></table></div></div>
            </>
          )}
          {hash==='settings' && (
            <><h1 style={{fontSize:18,fontWeight:600}}>Settings & Billing config</h1>
              <div className="card" style={{marginTop:12}}><div style={{padding:16}}><div style={{fontWeight:500}}>Store • Mission Shop</div><div style={{fontSize:12,color:'var(--muted-foreground)', marginTop:6}}>Manage billing, tax, shipping. APIs: <code>{API}/api/admin/*</code> → MongoDB • Auth: admin/demo@gmail.com • ENV: PORT=8000 • Mission APIs: /products, /orders, /payments, /invoices</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14}}>
                  <div className="field" style={{marginTop:0}}><label>Delivery charge NPR</label><input value="100" readOnly/></div>
                  <div className="field" style={{marginTop:0}}><label>Currency</label><input value="NPR Rs." readOnly/></div>
                </div>
                <div style={{marginTop:14,display:'flex',gap:8}}><a className="btn btn-ghost" href="/" target="_blank">View storefront</a><a className="btn btn-ghost" href="/track" target="_blank">Track order</a><a className="btn btn-ghost" href="http://localhost:4000/admin/" target="_blank">Legacy admin (vanilla)</a><button className="btn btn-ghost" onClick={()=>{ localStorage.clear(); location.hash='#/dashboard'; location.reload(); }}>Clear local auth</button></div>
              </div></div>
            </>
          )}
        </div>
      </div>
      {showProdModal && (
        <div className="modal-backdrop open" onClick={(e)=>{ if(e.target===e.currentTarget) setShowProdModal(false); }}>
          <div className="modal">
            <h3 style={{fontWeight:600,marginBottom:12}}>{editProd?'Edit product':'Add product — billing will auto-calc'}</h3>
            <form onSubmit={submitProduct} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="form-grid">
                <div className="field" style={{marginTop:0}}><label>Title *</label><input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required placeholder="e.g. Mens Winter Jacket"/></div>
                <div className="field" style={{marginTop:0}}><label>Category *</label><input value={form.category} onChange={e=>setForm({...form, category:e.target.value})} required placeholder="jacket"/></div>
                <div className="field" style={{marginTop:0}}><label>Price NPR *</label><input type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} required/></div>
                <div className="field" style={{marginTop:0}}><label>Compare at</label><input type="number" value={form.compareAt} onChange={e=>setForm({...form, compareAt:e.target.value})}/></div>
                <div className="field" style={{marginTop:0}}><label>Stock *</label><input type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/></div>
                <div className="field" style={{marginTop:0}}><label>Rating</label><select value={form.rating} onChange={e=>setForm({...form, rating:e.target.value})}><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>
              </div>
              <div className="field" style={{marginTop:0}}><label>Images (comma URLs)</label><input value={form.images} onChange={e=>setForm({...form, images:e.target.value})} placeholder="/assets/images/products/1.jpg, /assets/images/products/2.jpg"/></div>
              <div className="field" style={{marginTop:0}}><label>Sizes (comma, empty if none)</label><input value={form.sizes} onChange={e=>setForm({...form, sizes:e.target.value})} placeholder="S, M, L, XL"/></div>
              <div className="field" style={{marginTop:0}}><label>Description</label><textarea rows={3} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Premium handwoven…"/></div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><button type="button" className="btn btn-ghost" onClick={()=>setShowProdModal(false)}>Cancel</button><button className="btn" type="submit">{editProd?'Save changes':'Create product'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
