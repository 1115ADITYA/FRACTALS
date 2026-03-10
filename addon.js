/* ═══════════════════════════════════════════════════════
   ADDON.JS
   → Paste ALL of this at the very BOTTOM of your app.js
   → Do NOT remove anything from app.js
═══════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════
   FEATURE 1 — FRACTAL GENERATOR SIDE PANEL
════════════════════════════════════════════════ */
(function () {
  const panel  = document.getElementById('fg-panel');
  const toggle = document.getElementById('fg-toggle');
  const navBtn = document.getElementById('fg-nav-btn');
  const close  = document.getElementById('fg-close');
  const canvas = document.getElementById('fg-canvas');
  const ctx    = canvas.getContext('2d');
  const progress = document.getElementById('fg-progress');
  const status   = document.getElementById('fg-status');

  let currentType    = 'mandelbrot';
  let currentPalette = 'gold';
  let maxIter  = 80;
  let juliaC   = { r: -0.70, i: 0.19 };
  let sierpDepth = 6;
  let zoom     = { xmin: -2.5, xmax: 1, ymin: -1.25, ymax: 1.25 };
  let isRendering = false;

  function resizeCanvas() {
    const wrap = document.getElementById('fg-canvas-wrap');
    canvas.width  = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
  }

  function openPanel() {
    panel.classList.add('open');
    setTimeout(() => { resizeCanvas(); renderCurrent(); }, 100);
  }

  toggle.addEventListener('click', openPanel);
  if (navBtn) navBtn.addEventListener('click', e => { e.preventDefault(); openPanel(); });
  close.addEventListener('click', () => panel.classList.remove('open'));

  /* ── Type tabs ── */
  document.querySelectorAll('.fg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.fg-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentType = tab.dataset.type;
      document.getElementById('julia-cr-row').style.display   = currentType === 'julia'      ? 'flex' : 'none';
      document.getElementById('julia-ci-row').style.display   = currentType === 'julia'      ? 'flex' : 'none';
      document.getElementById('sierp-depth-row').style.display= currentType === 'sierpinski' ? 'flex' : 'none';
      zoom = { xmin: -2.5, xmax: 1, ymin: -1.25, ymax: 1.25 };
      renderCurrent();
    });
  });

  /* ── Sliders ── */
  document.getElementById('fg-iter').addEventListener('input', function () {
    maxIter = +this.value;
    document.getElementById('iter-val').textContent = maxIter;
  });
  document.getElementById('fg-cr').addEventListener('input', function () {
    juliaC.r = this.value / 100;
    document.getElementById('cr-val').textContent = juliaC.r.toFixed(2);
  });
  document.getElementById('fg-ci').addEventListener('input', function () {
    juliaC.i = this.value / 100;
    document.getElementById('ci-val').textContent = juliaC.i.toFixed(2);
  });
  document.getElementById('fg-depth').addEventListener('input', function () {
    sierpDepth = +this.value;
    document.getElementById('depth-val').textContent = sierpDepth;
  });

  /* ── Color palettes ── */
  const palettes = {
    gold:   t => [Math.floor(212*t+50*(1-t)), Math.floor(175*t+10*(1-t)), Math.floor(55*t)],
    cyan:   t => [Math.floor(100*t), Math.floor(180*t+50*(1-t)), Math.floor(255*t)],
    purple: t => [Math.floor(123*t+20*(1-t)), Math.floor(47*t), Math.floor(255*t+100*(1-t))],
    fire:   t => [Math.floor(255*Math.min(1,t*2)), Math.floor(200*Math.max(0,t*2-1)), 0],
    ice:    t => [Math.floor(220*t+200*(1-t)), Math.floor(240*t+230*(1-t)), 255],
    matrix: t => [0, Math.floor(255*t+40*(1-t)), Math.floor(60*t)],
  };

  document.querySelectorAll('.fg-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fg-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPalette = btn.dataset.palette;
    });
  });

  document.getElementById('fg-render').addEventListener('click', () => {
    zoom = { xmin: -2.5, xmax: 1, ymin: -1.25, ymax: 1.25 };
    renderCurrent();
  });

  document.getElementById('fg-download').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `fractal-${currentType}-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  /* ── Click to zoom ── */
  canvas.addEventListener('click', e => {
    if (currentType === 'sierpinski') return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / canvas.width;
    const py = (e.clientY - rect.top)  / canvas.height;
    const cx = zoom.xmin + (zoom.xmax - zoom.xmin) * px;
    const cy = zoom.ymin + (zoom.ymax - zoom.ymin) * py;
    const dx = (zoom.xmax - zoom.xmin) * 0.2;
    const dy = (zoom.ymax - zoom.ymin) * 0.2;
    zoom = { xmin: cx-dx, xmax: cx+dx, ymin: cy-dy, ymax: cy+dy };
    renderCurrent();
  });

  /* ── Render dispatcher ── */
  function renderCurrent() {
    if (isRendering) return;
    if      (currentType === 'mandelbrot') renderMandelbrot();
    else if (currentType === 'julia')      renderJulia();
    else if (currentType === 'sierpinski') renderSierp();
    else if (currentType === 'burning')    renderBurning();
  }

  function renderMandelbrot() {
    isRendering = true; status.textContent = 'Rendering...';
    const W = canvas.width, H = canvas.height;
    const img = ctx.createImageData(W, H);
    const fn = palettes[currentPalette];
    let row = 0;
    function step() {
      for (let py = row; py < Math.min(row+8, H); py++) {
        for (let px = 0; px < W; px++) {
          const x0 = zoom.xmin + (zoom.xmax-zoom.xmin)*px/W;
          const y0 = zoom.ymin + (zoom.ymax-zoom.ymin)*py/H;
          let x=0, y=0, i=0;
          while (x*x+y*y<=4 && i<maxIter) { const xt=x*x-y*y+x0; y=2*x*y+y0; x=xt; i++; }
          const idx=(py*W+px)*4;
          if (i===maxIter) { img.data[idx]=img.data[idx+1]=img.data[idx+2]=0; }
          else { const [r,g,b]=fn(i/maxIter); img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; }
          img.data[idx+3]=255;
        }
      }
      row+=8; progress.style.width=(row/H*100)+'%';
      if (row<H) requestAnimationFrame(step);
      else { ctx.putImageData(img,0,0); status.textContent='Done · Click to zoom'; progress.style.width='0%'; isRendering=false; }
    }
    step();
  }

  function renderJulia() {
    isRendering = true; status.textContent = 'Rendering Julia Set...';
    const W = canvas.width, H = canvas.height;
    const img = ctx.createImageData(W, H);
    const fn = palettes[currentPalette];
    let row = 0;
    function step() {
      for (let py = row; py < Math.min(row+8, H); py++) {
        for (let px = 0; px < W; px++) {
          let zr = zoom.xmin+(zoom.xmax-zoom.xmin)*px/W;
          let zi = zoom.ymin+(zoom.ymax-zoom.ymin)*py/H;
          let i=0;
          while (zr*zr+zi*zi<=4 && i<maxIter) { const t=zr*zr-zi*zi+juliaC.r; zi=2*zr*zi+juliaC.i; zr=t; i++; }
          const idx=(py*W+px)*4;
          if (i===maxIter) { img.data[idx]=img.data[idx+1]=img.data[idx+2]=0; }
          else { const [r,g,b]=fn(i/maxIter); img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; }
          img.data[idx+3]=255;
        }
      }
      row+=8; progress.style.width=(row/H*100)+'%';
      if (row<H) requestAnimationFrame(step);
      else { ctx.putImageData(img,0,0); status.textContent='Done · Click to zoom'; progress.style.width='0%'; isRendering=false; }
    }
    step();
  }

  function renderSierp() {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    const [r,g,b]=palettes[currentPalette](0.7);
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    function tri(x1,y1,x2,y2,x3,y3,d) {
      if (d===0) { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill(); return; }
      const mx1=(x1+x2)/2,my1=(y1+y2)/2, mx2=(x2+x3)/2,my2=(y2+y3)/2, mx3=(x1+x3)/2,my3=(y1+y3)/2;
      tri(x1,y1,mx1,my1,mx3,my3,d-1); tri(mx1,my1,x2,y2,mx2,my2,d-1); tri(mx3,my3,mx2,my2,x3,y3,d-1);
    }
    const W=canvas.width,H=canvas.height,pad=20;
    tri(W/2,pad, pad,H-pad, W-pad,H-pad, sierpDepth);
    status.textContent=`Depth ${sierpDepth} · ${Math.pow(3,sierpDepth)} triangles`;
    isRendering=false;
  }

  function renderBurning() {
    isRendering=true; status.textContent='Rendering Burning Ship...';
    const W=canvas.width,H=canvas.height;
    const img=ctx.createImageData(W,H);
    const fn=palettes[currentPalette];
    let row=0;
    function step() {
      for (let py=row; py<Math.min(row+8,H); py++) {
        for (let px=0; px<W; px++) {
          const x0=-2.5+3.5*px/W, y0=-2+2.5*py/H;
          let x=0,y=0,i=0;
          while (x*x+y*y<=4&&i<maxIter) { const xt=x*x-y*y+x0; y=Math.abs(2*x*y)+y0; x=xt; i++; }
          const idx=(py*W+px)*4;
          if (i===maxIter) { img.data[idx]=img.data[idx+1]=img.data[idx+2]=0; }
          else { const [r,g,b]=fn(i/maxIter); img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; }
          img.data[idx+3]=255;
        }
      }
      row+=8; progress.style.width=(row/H*100)+'%';
      if (row<H) requestAnimationFrame(step);
      else { ctx.putImageData(img,0,0); status.textContent='Done · Click to zoom'; progress.style.width='0%'; isRendering=false; }
    }
    step();
  }
})();


/* ════════════════════════════════════════════════
   FEATURE 2 — 3D FRACTAL (Three.js)
════════════════════════════════════════════════ */
(function () {
  const wrap   = document.getElementById('three-canvas-wrap');
  const canvas = document.getElementById('three-canvas');
  if (!wrap || !canvas) return;

  const W = wrap.clientWidth || 400;
  canvas.width = W; canvas.height = W;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(W, W);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(3, 2.5, 3.5);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x111111));
  const goldLight = new THREE.PointLight(0xd4af37, 2, 20);
  goldLight.position.set(5, 5, 5);
  scene.add(goldLight);
  const neonLight = new THREE.PointLight(0x00e5ff, 1.5, 20);
  neonLight.position.set(-5, -3, 3);
  scene.add(neonLight);

  let currentMesh = null;
  let autoRotate  = true;

  /* ── Orbit + Zoom state ── */
  let isDragging = false, prevMouse = { x: 0, y: 0 };
  const DEFAULT_R = 5, MIN_R = 1.2, MAX_R = 14;
  let sph = { theta: 0.8, phi: 0.7, r: DEFAULT_R };

  function updateCamera() {
    camera.position.set(
      sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
      sph.r * Math.cos(sph.phi),
      sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
    );
    camera.lookAt(0, 0, 0);
  }

  function zoomBy(f) {
    sph.r = Math.max(MIN_R, Math.min(MAX_R, sph.r * f));
    updateCamera();
  }

  canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; autoRotate = false; });
  window.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    sph.theta -= (e.clientX - prevMouse.x) * 0.01;
    sph.phi    = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi - (e.clientY - prevMouse.y) * 0.01));
    prevMouse  = { x: e.clientX, y: e.clientY };
    updateCamera();
  });

  /* Scroll to zoom */
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? 1.12 : 0.89);
  }, { passive: false });

  /* +  −  ⊙ buttons */
  document.getElementById('three-zoom-in').addEventListener('click',    () => zoomBy(0.75));
  document.getElementById('three-zoom-out').addEventListener('click',   () => zoomBy(1.33));
  document.getElementById('three-zoom-reset').addEventListener('click', () => {
    sph = { theta: 0.8, phi: 0.7, r: DEFAULT_R };
    updateCamera();
    autoRotate = true;
  });

  /* ── Shape builders ── */
  function buildMenger(depth) {
    const positions = [];
    function sub(x, y, z, s, d) {
      if (d === 0) { positions.push({ x, y, z, s }); return; }
      const n = s / 3;
      for (let ix=-1; ix<=1; ix++) for (let iy=-1; iy<=1; iy++) for (let iz=-1; iz<=1; iz++) {
        if (!((ix===0&&iy===0)||(ix===0&&iz===0)||(iy===0&&iz===0)))
          sub(x+ix*n, y+iy*n, z+iz*n, n, d-1);
      }
    }
    sub(0, 0, 0, 1, depth);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({ color: 0xd4af37, emissive: 0x1a0f00, shininess: 80 });
    const mesh = new THREE.InstancedMesh(geo, mat, positions.length);
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(p.s * 0.95);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    return mesh;
  }

  function buildTree(depth) {
    const g   = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: 0xd4af37, emissive: 0x050200, shininess: 40 });
    function branch(x, y, z, ang, angZ, len, d) {
      if (d === 0 || len < 0.02) return;
      const geo  = new THREE.CylinderGeometry(len*0.08, len*0.12, len, 5);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x + Math.sin(angZ)*Math.cos(ang)*len/2, y + len/2, z + Math.sin(angZ)*Math.sin(ang)*len/2);
      mesh.rotation.z = angZ; mesh.rotation.y = ang;
      g.add(mesh);
      const nx = x+Math.sin(angZ)*Math.cos(ang)*len, ny = y+len, nz = z+Math.sin(angZ)*Math.sin(ang)*len;
      branch(nx,ny,nz, ang+0.5, angZ+0.4, len*0.7, d-1);
      branch(nx,ny,nz, ang-0.5, angZ-0.4, len*0.7, d-1);
      branch(nx,ny,nz, ang+0.8, angZ,     len*0.6, d-1);
    }
    branch(0,-1,0,0,0,1.2,depth);
    return g;
  }

  function buildTetra(depth) {
    const pts = [];
    function sub(v0,v1,v2,v3,d) {
      if (d===0) { pts.push({v0,v1,v2,v3}); return; }
      const m01=v0.clone().add(v1).multiplyScalar(.5), m02=v0.clone().add(v2).multiplyScalar(.5),
            m03=v0.clone().add(v3).multiplyScalar(.5), m12=v1.clone().add(v2).multiplyScalar(.5),
            m13=v1.clone().add(v3).multiplyScalar(.5), m23=v2.clone().add(v3).multiplyScalar(.5);
      sub(v0,m01,m02,m03,d-1); sub(m01,v1,m12,m13,d-1);
      sub(m02,m12,v2,m23,d-1); sub(m03,m13,m23,v3,d-1);
    }
    const r=1.2;
    sub(new THREE.Vector3(0,r,0), new THREE.Vector3(-r,-r*.6,r*.6),
        new THREE.Vector3(r,-r*.6,r*.6), new THREE.Vector3(0,-r*.6,-r), depth);
    const g   = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: 0x00e5ff, emissive: 0x000811, shininess: 120, transparent: true, opacity: 0.9 });
    pts.forEach(p => {
      const v = new Float32Array([
        p.v0.x,p.v0.y,p.v0.z, p.v1.x,p.v1.y,p.v1.z, p.v2.x,p.v2.y,p.v2.z,
        p.v0.x,p.v0.y,p.v0.z, p.v2.x,p.v2.y,p.v2.z, p.v3.x,p.v3.y,p.v3.z,
        p.v0.x,p.v0.y,p.v0.z, p.v3.x,p.v3.y,p.v3.z, p.v1.x,p.v1.y,p.v1.z,
        p.v1.x,p.v1.y,p.v1.z, p.v3.x,p.v3.y,p.v3.z, p.v2.x,p.v2.y,p.v2.z,
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, mat));
    });
    return g;
  }

  function loadShape(type) {
    if (currentMesh) scene.remove(currentMesh);
    if      (type==='menger') currentMesh = buildMenger(2);
    else if (type==='tree')   currentMesh = buildTree(7);
    else if (type==='tetra')  currentMesh = buildTetra(4);
    scene.add(currentMesh);
  }

  loadShape('menger');

  document.querySelectorAll('.three-ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.three-ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadShape(btn.dataset.shape);
      autoRotate = true;
    });
  });

  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    if (autoRotate && currentMesh) currentMesh.rotation.y += 0.005;
    goldLight.intensity = 2 + Math.sin(t) * 0.5;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const nw = wrap.clientWidth;
    renderer.setSize(nw, nw);
    camera.updateProjectionMatrix();
  });
})();


/* ════════════════════════════════════════════════
   FEATURE 3 — GOLDEN RATIO COMPOSITION TOOL
════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('comp-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const PHI = 1.6180339887;
  let W = canvas.width, H = canvas.height;
  let overlayOpacity = 0.7;
  let uploadedImage  = null;
  let isDrawing      = false;
  let drawPoints     = [];
  const overlays = { spiral:true, grid:false, thirds:false, fib:false, rect:false };

  function render() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#050810'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(212,175,55,0.04)';
    for (let x=20; x<W; x+=30) for (let y=20; y<H; y+=30) { ctx.beginPath(); ctx.arc(x,y,1,0,Math.PI*2); ctx.fill(); }

    if (uploadedImage) {
      ctx.save(); ctx.globalAlpha=0.85;
      const sc=Math.min(W/uploadedImage.width, H/uploadedImage.height);
      const iw=uploadedImage.width*sc, ih=uploadedImage.height*sc;
      ctx.drawImage(uploadedImage,(W-iw)/2,(H-ih)/2,iw,ih);
      ctx.restore();
    }
    if (drawPoints.length>1) {
      ctx.beginPath(); ctx.strokeStyle='rgba(212,175,55,0.6)'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.moveTo(drawPoints[0].x,drawPoints[0].y);
      drawPoints.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke();
    }

    const a = overlayOpacity;
    if (overlays.spiral) {
      ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle='rgba(212,175,55,0.85)'; ctx.lineWidth=1.5; ctx.beginPath();
      for (let t=0; t<5.5*Math.PI; t+=0.02) {
        const r=4*Math.pow(PHI,t/Math.PI), x=W*0.62+r*Math.cos(t), y=H*0.38+r*Math.sin(t);
        if (t===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
      ctx.fillStyle='rgba(212,175,55,0.8)'; ctx.beginPath(); ctx.arc(W*0.62,H*0.38,4,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    if (overlays.grid) {
      ctx.save(); ctx.globalAlpha=a*0.6; ctx.strokeStyle='rgba(212,175,55,0.7)'; ctx.lineWidth=1;
      const gx=W/PHI, gy=H/PHI;
      ctx.beginPath();
      ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.moveTo(W-gx,0); ctx.lineTo(W-gx,H);
      ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.moveTo(0,H-gy); ctx.lineTo(W,H-gy);
      ctx.stroke(); ctx.restore();
    }
    if (overlays.thirds) {
      ctx.save(); ctx.globalAlpha=a*0.5; ctx.strokeStyle='rgba(0,229,255,0.7)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath();
      ctx.moveTo(W/3,0); ctx.lineTo(W/3,H); ctx.moveTo(W*2/3,0); ctx.lineTo(W*2/3,H);
      ctx.moveTo(0,H/3); ctx.lineTo(W,H/3); ctx.moveTo(0,H*2/3); ctx.lineTo(W,H*2/3);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(0,229,255,0.8)';
      [[W/3,H/3],[W*2/3,H/3],[W/3,H*2/3],[W*2/3,H*2/3]].forEach(([x,y])=>{ ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill(); });
      ctx.restore();
    }
    if (overlays.fib) {
      ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='rgba(123,47,255,0.9)'; ctx.strokeStyle='rgba(123,47,255,0.5)'; ctx.lineWidth=1;
      const fibs=[1,1,2,3,5,8,13,21,34,55,89,144], sf=Math.min(W,H)/150;
      const dx=[1,0,-1,0], dy=[0,1,0,-1]; let cx=W/2, cy=H/2, dir=0;
      fibs.slice(0,8).forEach(f=>{
        const px=cx+dx[dir%4]*f*sf, py=cy+dy[dir%4]*f*sf;
        ctx.beginPath(); ctx.arc(px,py,Math.max(2,f*sf*0.15),0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
        cx=px; cy=py; dir++;
      });
      ctx.restore();
    }
    if (overlays.rect) {
      ctx.save(); ctx.globalAlpha=a*0.5; ctx.strokeStyle='rgba(240,207,110,0.8)'; ctx.lineWidth=1.5;
      const rw=W*0.7, rh=rw/PHI, rx=(W-rw)/2, ry=(H-rh)/2;
      ctx.strokeRect(rx,ry,rw,rh); ctx.strokeStyle='rgba(240,207,110,0.4)';
      ctx.strokeRect(rx,ry,rh,rh); ctx.strokeRect(rx+rh,ry,rw-rh,rh);
      ctx.font='10px DM Mono,monospace'; ctx.fillStyle='rgba(212,175,55,0.6)'; ctx.fillText('φ',rx+rw/2-5,ry-8);
      ctx.restore();
    }
  }

  /* drawing */
  canvas.addEventListener('mousedown', e => {
    isDrawing=true; const r=canvas.getBoundingClientRect(), sx=canvas.width/r.width, sy=canvas.height/r.height;
    drawPoints=[{x:(e.clientX-r.left)*sx, y:(e.clientY-r.top)*sy}];
  });
  canvas.addEventListener('mousemove', e => {
    if (!isDrawing) return; const r=canvas.getBoundingClientRect(), sx=canvas.width/r.width, sy=canvas.height/r.height;
    drawPoints.push({x:(e.clientX-r.left)*sx, y:(e.clientY-r.top)*sy}); render();
  });
  window.addEventListener('mouseup', ()=>{ isDrawing=false; });

  document.getElementById('comp-clear').addEventListener('click', ()=>{ drawPoints=[]; uploadedImage=null; render(); updateAnalysis(); });
  document.getElementById('ov-opacity').addEventListener('input', function(){ overlayOpacity=this.value/100; document.getElementById('ov-opacity-val').textContent=this.value+'%'; render(); });
  ['spiral','grid','thirds','fib','rect'].forEach(k=>{
    document.getElementById('ov-'+k).addEventListener('change', function(){ overlays[k]=this.checked; render(); updateAnalysis(); });
  });
  document.getElementById('comp-file').addEventListener('change', function(){
    if (!this.files[0]) return;
    const img=new Image(); img.onload=()=>{ uploadedImage=img; render(); updateAnalysis(); };
    img.src=URL.createObjectURL(this.files[0]);
  });
  document.getElementById('comp-save').addEventListener('click', ()=>{
    const a=document.createElement('a'); a.download='composition-'+Date.now()+'.png'; a.href=canvas.toDataURL(); a.click();
  });

  function updateAnalysis() {
    const el=document.getElementById('comp-analysis');
    const active=Object.entries(overlays).filter(([,v])=>v).map(([k])=>k);
    if (!active.length) { el.innerHTML='<strong>No overlays active.</strong><br>Enable overlays to compare your composition.'; return; }
    const tips={
      spiral:'Golden Spiral: place your subject at the <strong>eye</strong> of the spiral for maximum visual pull.',
      grid:'Golden Grid: vertical/horizontal lines divide frame at ratio <strong>1:φ</strong>.',
      thirds:'Rule of Thirds: simplified φ guide. <strong>Nolan</strong> prefers the golden spiral for precision.',
      fib:'Fibonacci Points: each dot is a <strong>φ-weighted</strong> visual focus position.',
      rect:'Phi Rectangle: aspect ratio <strong>φ:1</strong> — the most pleasing proportion.'
    };
    el.innerHTML=active.map(k=>`· ${tips[k]}`).join('<br><br>')+(uploadedImage?'<br><br><strong style="color:var(--neon)">Image loaded. Check alignment!</strong>':'');
  }

  render();
})();


/* ════════════════════════════════════════════════
   FEATURE 4 — MATH QUIZ
════════════════════════════════════════════════ */
(function () {
  const QS = [
    { q:"Who coined the term 'fractal' in 1975?", opts:["Carl Sagan","Benoît Mandelbrot","Leonhard Euler","Isaac Newton"], ans:1, exp:"Mandelbrot coined it from Latin 'fractus' (broken) — shapes with infinite detail at every scale." },
    { q:"What is the Golden Ratio φ approximately equal to?", opts:["1.414","1.732","1.618","2.302"], ans:2, exp:"φ ≈ 1.618033... Appears when (a+b)/a = a/b. Known since ancient Greece." },
    { q:"In Interstellar, Gargantua was computed using:", opts:["Artists painted it","Real relativistic ray-tracing","Only fractal algorithms","Stock footage"], ans:1, exp:"Physicist Kip Thorne provided equations. The rendering revealed accretion disk structures never seen before." },
    { q:"Which sequence converges to φ as ratio of successive terms?", opts:["Pascal's Triangle","Fibonacci Sequence","Prime Numbers","Lucas Numbers"], ans:1, exp:"1,1,2,3,5,8,13… 89/55 ≈ 1.6181. Converges to φ = 1.618." },
    { q:"The Mandelbrot set iterates which equation?", opts:["z = z + c","z = z² + c","z = z³ + c","z = z² × c"], ans:1, exp:"z(n+1) = z(n)² + c. For each complex c, check if iterating stays bounded." },
    { q:"In Avatar, what generated Pandora's forests?", opts:["Bezier Curves","L-system algorithms","NURBS","Voronoi Diagrams"], ans:1, exp:"L-systems use rewriting rules to generate self-similar branching — exactly how real trees grow." },
    { q:"The Sierpiński Triangle has fractal dimension:", opts:["1.0","1.585","2.0","2.727"], ans:1, exp:"Hausdorff dimension = log(3)/log(2) ≈ 1.585 — between 1D and 2D." },
    { q:"2001: A Space Odyssey was released in:", opts:["1965","1968","1971","1973"], ans:1, exp:"Released 1968. Kubrick applied golden ratio proportions to HAL's eye, monolith, and every major shot." },
    { q:"Which fractal property means zooming reveals the same pattern?", opts:["Iteration","Self-similarity","Convergence","Bifurcation"], ans:1, exp:"Self-similarity: a fractal looks the same at every scale — its defining property." },
    { q:"The golden ratio formula is:", opts:["(a+b)/a = a/b","a/b = b/a","(a+b) = φ","a × b = φ"], ans:0, exp:"(a+b)/a = a/b = φ. The whole relates to the larger part as the larger to the smaller." },
  ];

  if (!document.getElementById('quiz-question')) return;

  let cur=0, score=0, answered=false;
  let shuffled=[...QS].sort(()=>Math.random()-0.5);

  function loadQ() {
    if (cur>=shuffled.length) { showEnd(); return; }
    answered=false;
    const q=shuffled[cur];
    document.getElementById('quiz-q-num').textContent=`Question ${cur+1} of ${shuffled.length}`;
    document.getElementById('quiz-question').textContent=q.q;
    document.getElementById('quiz-progress').style.width=(cur/shuffled.length*100)+'%';
    document.getElementById('quiz-feedback').className='quiz-feedback';
    document.getElementById('quiz-next').className='quiz-next-btn';
    const opts=document.getElementById('quiz-options');
    opts.innerHTML='';
    q.opts.forEach((opt,i)=>{
      const btn=document.createElement('button');
      btn.className='quiz-option'; btn.textContent=opt;
      btn.addEventListener('click',()=>pick(i));
      opts.appendChild(btn);
    });
  }

  function pick(idx) {
    if (answered) return; answered=true;
    const q=shuffled[cur];
    document.querySelectorAll('.quiz-option').forEach((b,i)=>{
      b.disabled=true;
      if (i===q.ans) b.classList.add('correct');
      else if (i===idx) b.classList.add('wrong');
    });
    if (idx===q.ans) score++;
    document.getElementById('score-display').textContent=score;
    const fb=document.getElementById('quiz-feedback');
    fb.className='quiz-feedback show '+(idx===q.ans?'correct':'wrong');
    fb.textContent=(idx===q.ans?'✓ Correct! ':'✗ Not quite. ')+q.exp;
    document.getElementById('quiz-next').className='quiz-next-btn show';
  }

  function showEnd() {
    document.getElementById('quiz-body').style.display='none';
    document.getElementById('quiz-footer').style.display='none';
    document.getElementById('quiz-end').className='quiz-end show';
    document.getElementById('quiz-end-score').textContent=`${score}/${shuffled.length}`;
    const pct=score/shuffled.length;
    document.getElementById('quiz-end-msg').textContent=
      pct>=0.9?"Outstanding! You think like a mathematician. φ is in your DNA.":
      pct>=0.7?"Excellent! You understand the deep link between maths and cinema.":
      pct>=0.5?"Good work! Keep exploring — fractals and phi run deeper than you think.":
               "A beginning! Every great mathematician started with curiosity.";
    document.getElementById('quiz-progress').style.width='100%';
  }

  document.getElementById('quiz-next').addEventListener('click',()=>{ cur++; document.getElementById('quiz-body').style.display='block'; loadQ(); });
  document.getElementById('quiz-restart').addEventListener('click',()=>{
    cur=0; score=0; shuffled=[...QS].sort(()=>Math.random()-0.5);
    document.getElementById('score-display').textContent=0;
    document.getElementById('quiz-body').style.display='block';
    document.getElementById('quiz-end').className='quiz-end';
    document.getElementById('quiz-footer').style.display='';
    loadQ();
  });

  loadQ();
})();