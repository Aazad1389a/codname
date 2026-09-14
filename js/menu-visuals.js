const VISUALS={
  ready:false,
  init(){
    if(this.ready)return;
    this.ready=true;
    this.loadStyles();
    this.mountParticles();
    this.bindParallax();
  },
  loadStyles(){
    if(document.querySelector('link[data-codname-menu-visuals]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='./css/menu-visuals.css?v=1';
    link.dataset.codnameMenuVisuals='true';
    document.head.appendChild(link);
  },
  mountParticles(){
    const screen=document.querySelector('#screen-menu');
    if(!screen||screen.querySelector('.cn-menu-particles'))return;
    const hud=document.createElement('div');
    hud.className='cn-hud-grid';
    hud.setAttribute('aria-hidden','true');
    screen.prepend(hud);
    const layer=document.createElement('div');
    layer.className='cn-menu-particles';
    layer.setAttribute('aria-hidden','true');
    const count=window.innerWidth<700?14:26;
    for(let i=0;i<count;i++){
      const dot=document.createElement('i');
      dot.className='cn-particle';
      dot.style.left=`${Math.random()*100}%`;
      dot.style.bottom=`${-5+Math.random()*15}%`;
      dot.style.animationDuration=`${7+Math.random()*9}s`;
      dot.style.animationDelay=`${Math.random()*-10}s`;
      dot.style.opacity=`${0.2+Math.random()*0.5}`;
      layer.appendChild(dot);
    }
    screen.prepend(layer);
  },
  bindParallax(){
    const screen=document.querySelector('#screen-menu');
    const bg=screen?.querySelector('.menu-bg');
    if(!screen||!bg||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let raf=0;
    const move=(x,y)=>{
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{bg.style.transform=`scale(1.06) translate3d(${x*.45}px,${y*.28}px,0)`});
    };
    screen.addEventListener('pointermove',e=>{
      const r=screen.getBoundingClientRect();
      move((e.clientX-r.left-r.width/2)/18,(e.clientY-r.top-r.height/2)/18);
    },{passive:true});
    screen.addEventListener('pointerleave',()=>move(0,0),{passive:true});
  }
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>VISUALS.init(),{once:true});else VISUALS.init();
export default VISUALS;
