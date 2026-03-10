const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursorTrail');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  setTimeout(() => {
    trail.style.left = e.clientX + 'px';
    trail.style.top = e.clientY + 'px';
  }, 80);
});

// ── Background canvas fractal doodle ──
(function() {
  const c = document.getElementById('fractal-canvas');
  const ctx = c.getContext('2d');
  c.width = window.innerWidth; c.height = window.innerHeight;
  function drawSierp(x, y, size, depth) {
    if (depth === 0) { ctx.fillRect(x, y, 2, 2); return; }
    const h = size * Math.sqrt(3) / 2;
    drawSierp(x, y + h/2, size/2, depth-1);
    drawSierp(x + size/2, y + h/2, size/2, depth-1);
    drawSierp(x + size/4, y - h/2 + h/2, size/2, depth-1);
  }
  ctx.fillStyle = 'rgba(212,175,55,0.6)';
  for(let i=0;i<6;i++) drawSierp(Math.random()*c.width, Math.random()*c.height, 80+Math.random()*120, 4);
  ctx.fillStyle = 'rgba(0,229,255,0.4)';
  for(let i=0;i<4;i++) drawSierp(Math.random()*c.width, Math.random()*c.height, 60+Math.random()*80, 3);
})();

// ── Mandelbrot renderer ──
function renderMandelbrot(canvas, maxIter, colorFn) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const img = ctx.createImageData(W, H);
  const xmin=-2.5, xmax=1, ymin=-1.25, ymax=1.25;
  for(let px=0;px<W;px++) for(let py=0;py<H;py++){
    let x0 = xmin + (xmax-xmin)*px/W;
    let y0 = ymin + (ymax-ymin)*py/H;
    let x=0,y=0,i=0;
    while(x*x+y*y<=4 && i<maxIter){let xt=x*x-y*y+x0; y=2*x*y+y0; x=xt; i++;}
    const idx=(py*W+px)*4;
    const [r,g,b] = i===maxIter?[0,0,0]:colorFn(i,maxIter);
    img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; img.data[idx+3]=255;
  }
  ctx.putImageData(img,0,0);
}

function goldColor(i, max) {
  const t = i/max;
  return [Math.floor(212*t + 80*(1-t)), Math.floor(175*t + 20*(1-t)), Math.floor(55*t)];
}
function cyanColor(i, max) {
  const t = i/max;
  return [Math.floor(0 + 100*t), Math.floor(229*t), Math.floor(255*t)];
}

// Main mandelbrot section
const mb = document.getElementById('mandelbrot');
setTimeout(() => renderMandelbrot(mb, 80, goldColor), 300);

// ── Julia Set renderer ──
function renderJulia(canvas, cr, ci, colorFn) {
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height, maxIter=80;
  const img=ctx.createImageData(W,H);
  for(let px=0;px<W;px++) for(let py=0;py<H;py++){
    let zr=-2+4*px/W, zi=-2+4*py/H, i=0;
    while(zr*zr+zi*zi<=4&&i<maxIter){let t=zr*zr-zi*zi+cr; zi=2*zr*zi+ci; zr=t; i++;}
    const idx=(py*W+px)*4;
    const [r,g,b]=i===maxIter?[0,0,0]:colorFn(i,maxIter);
    img.data[idx]=r;img.data[idx+1]=g;img.data[idx+2]=b;img.data[idx+3]=255;
  }
  ctx.putImageData(img,0,0);
}

// ── Golden spiral canvas ──
function drawGoldenSpiral(canvas) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#04060d';
  ctx.fillRect(0,0,W,H);
  // draw spiral
  ctx.beginPath();
  ctx.strokeStyle='rgba(212,175,55,0.8)';
  ctx.lineWidth=2;
  for(let t=0;t<6*Math.PI;t+=0.01){
    const r=5*Math.pow(1.618,t/Math.PI);
    const x=W/2+r*Math.cos(t), y=H/2+r*Math.sin(t);
    if(t===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
  // golden rectangles overlay
  ctx.strokeStyle='rgba(212,175,55,0.2)';
  ctx.lineWidth=1;
  let x=80,y=60,w=W-160,h=H-120;
  for(let i=0;i<8;i++){
    ctx.strokeRect(x,y,w,h);
    if(w>h){x+=h; w-=h;}else{y+=w; h-=w;}
  }
}

// ── Fibonacci swirl ──
function drawFibSwirl(canvas) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#04060d';
  ctx.fillRect(0,0,W,H);
  const fibs=[1,1,2,3,5,8,13,21,34,55,89,144];
  const scale=3;
  let x=W/2,y=H/2,dir=0;
  const dx=[1,0,-1,0],dy=[0,1,0,-1];
  const cols=['rgba(212,175,55,0.7)','rgba(0,229,255,0.5)','rgba(123,47,255,0.5)','rgba(212,175,55,0.4)'];
  let cx=x,cy=y;
  fibs.forEach((f,i)=>{
    const size=f*scale*2;
    ctx.strokeStyle=cols[i%4];
    ctx.lineWidth=1.5;
    ctx.beginPath();
    const startA=(dir%4===0?Math.PI:dir%4===1?1.5*Math.PI:dir%4===2?0:0.5*Math.PI);
    ctx.arc(cx,cy,f*scale,startA,startA+Math.PI/2);
    ctx.stroke();
    cx+=dx[dir%4]*f*scale; cy+=dy[dir%4]*f*scale;
    dir++;
  });
}

// ── Slide canvases ──
function initSlides() {
  const s1=document.getElementById('slide1-canvas');
  s1.width=s1.parentElement.offsetWidth; s1.height=500;
  renderMandelbrot(s1,100,goldColor);

  const s2=document.getElementById('slide2-canvas');
  s2.width=s2.parentElement.offsetWidth; s2.height=500;
  drawGoldenSpiral(s2);

  const s3=document.getElementById('slide3-canvas');
  s3.width=s3.parentElement.offsetWidth; s3.height=500;
  renderJulia(s3,-0.7269,0.1889,cyanColor);

  const s4=document.getElementById('slide4-canvas');
  s4.width=s4.parentElement.offsetWidth; s4.height=500;
  drawFibSwirl(s4);
}
setTimeout(initSlides,500);

// ── Slider ──
let current=0;
const slidesEl=document.getElementById('slides');
const dots=document.querySelectorAll('.dot');
function goTo(n){
  current=(n+4)%4;
  slidesEl.style.transform=`translateX(-${current*100}%)`;
  dots.forEach((d,i)=>d.classList.toggle('active',i===current));
}
document.getElementById('prevBtn').onclick=()=>goTo(current-1);
document.getElementById('nextBtn').onclick=()=>goTo(current+1);
dots.forEach((d,i)=>d.onclick=()=>goTo(i));
setInterval(()=>goTo(current+1),6000);

// ── Scroll reveal ──
const observer=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{if(e.isIntersecting) e.target.classList.add('visible');});
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// ── Parallax subtle ──
window.addEventListener('scroll',()=>{
  const y=window.scrollY;
  document.querySelector('.spiral-svg').style.transform=`translate(-50%,-50%) rotate(${y*0.02}deg)`;
});