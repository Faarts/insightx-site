/* ---------------- Hero: 3D globe made of text glyphs → unwraps into the section 2 map ----------------
   Three.js r160 (via the import map in index.html) + world-atlas land mask (topojson-client).
   Loaded as a classic deferred script with a dynamic import so it also runs when index.html is opened from disk. */
(async () => {
const THREE = await import('three');


const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- glyph atlas ---------------- */
// '0'..'9','A'..'F' first so hex = index 0..15 and binary = 0..1
const GLYPHS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-=*/<>|#%$&@:;.{}[]()_~^?!';
const COLS = 8, CELL = 64;
async function makeAtlas(){
  try { await document.fonts.load('500 40px "Geist Mono"'); } catch(e){}
  const c = document.createElement('canvas');
  c.width = c.height = COLS * CELL;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0,0,c.width,c.height);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '500 46px "Geist Mono", ui-monospace, Menlo, monospace';
  [...GLYPHS].forEach((ch,i)=>{
    const x = (i % COLS) * CELL + CELL/2, y = Math.floor(i / COLS) * CELL + CELL/2 + 2;
    g.fillText(ch, x, y);
  });
  const t = new THREE.CanvasTexture(c);
  t.flipY = false; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
  return t;
}

/* ---------------- land mask ---------------- */
const MW = 1024, MH = 512;
async function makeMask(){
  try{
    const topo = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json').then(r=>r.json());
    const land = topojson.feature(topo, topo.objects.land);
    const feats = land.features || [land];
    const c = document.createElement('canvas'); c.width = MW; c.height = MH;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0,0,MW,MH); g.fillStyle = '#fff';
    const X = lon => (lon + 180) / 360 * MW, Y = lat => (90 - lat) / 180 * MH;
    g.beginPath();
    for (const f of feats){
      const geo = f.geometry; if (!geo) continue;
      const polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
      for (const poly of polys) for (const ring of poly){
        ring.forEach(([lo,la],i)=> i ? g.lineTo(X(lo),Y(la)) : g.moveTo(X(lo),Y(la)));
        g.closePath();
      }
    }
    g.fill();
    return g.getImageData(0,0,MW,MH).data;
  }catch(e){ console.warn('land mask unavailable', e); return null; }
}
const isLand = (mask, lat, lon) => {
  if (!mask) return false;
  const x = Math.min(MW-1, Math.max(0, Math.floor((lon + 180) / 360 * MW)));
  const y = Math.min(MH-1, Math.max(0, Math.floor((90 - lat) / 180 * MH)));
  return mask[(y * MW + x) * 4] > 127;
};
const D2R = Math.PI/180;
const ll2v = (lat, lon, r=1) => new THREE.Vector3(
  r*Math.cos(lat*D2R)*Math.cos(lon*D2R), r*Math.sin(lat*D2R), -r*Math.cos(lat*D2R)*Math.sin(lon*D2R));
const v2ll = v => [Math.asin(Math.max(-1,Math.min(1,v.y))) / D2R, Math.atan2(-v.z, v.x) / D2R];

/* ---------------- renderer / scene ---------------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setClearColor(0x000000, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 4.4);

const tilt = new THREE.Group(); scene.add(tilt);
const globe = new THREE.Group(); tilt.add(globe);
tilt.rotation.x = 0.28; tilt.rotation.z = -0.12;

const U = {
  uTime:{value:0}, uScale:{value:1}, uPR:{value:1}, uAssemble:{value:0},
  uHover:{value:new THREE.Vector3(0,0,1)}, uHoverStr:{value:0},
  uRipple:{value:new THREE.Vector3(0,1,0)}, uRippleT:{value:99},
  uAtlas:{value:null}, uCols:{value:COLS}, uN:{value:GLYPHS.length},
  // full-page "unwrap" state
  uExpand:{value:0}, uSpin:{value:0}, uDepth:{value:4.4},
  uPlane:{value:new THREE.Vector4(0,0,1,1)},       // view-space centre xy + half extents of the viewport at globe depth
  uMouseV:{value:new THREE.Vector2(99,99)}, uHoverP:{value:0},
  uRippleV:{value:new THREE.Vector2(99,99)},
};

const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float hash(float n){return fract(sin(n)*43758.5453123);}
`;

/* aType: 0 = ocean (binary), 1 = land (mixed glyphs), 2 = fixed glyph ring, 3 = hex stream ring */
const glyphVert = /* glsl */`
uniform float uTime,uScale,uPR,uAssemble,uHoverStr,uRippleT,uN;
uniform float uExpand,uSpin,uDepth,uHoverP;
uniform vec3 uHover,uRipple;
uniform vec4 uPlane;
uniform vec2 uMouseV,uRippleV;
attribute float aSize,aSeed,aType,aGlyph,aBright;
attribute vec3 aScatter;
varying float vAlpha,vGlyph;
${NOISE}
const float PI = 3.14159265;
void main(){
  vec3 n = normalize(position);
  vec3 p = position;
  float h = 0., wave = 0., e = 0.;
  float a = clamp(uAssemble*1.5 - aSeed*.5, 0., 1.);
  a = a*a*(3.-2.*a);
  vec4 mv;

  if (aType < 1.5){
    /* --- sphere state --- */
    float disp = snoise(n*2.1 + vec3(0.,0.,uTime*.14)) * .028;
    h = smoothstep(.62, 0., distance(n, uHover)) * uHoverStr;
    disp += h * (.20 + .08*sin(aSeed*40. + uTime*4.));
    float rd = acos(clamp(dot(n, uRipple), -1., 1.));
    wave = exp(-pow((rd - uRippleT*1.9)*5., 2.)) * exp(-uRippleT*.9);
    disp += wave * .22;
    p = mix(aScatter, n * (length(position) + disp), a);
    vec4 mvS = modelViewMatrix * vec4(p, 1.);
    vec3 wn = normalize(normalMatrix * n);
    float facing = dot(wn, normalize(-mvS.xyz));
    float wy = (modelMatrix * vec4(n,0.)).y;
    float scan = exp(-pow((wy - sin(uTime*.35)*.95)*26., 2.));
    float alphaS = mix(.07, 1., smoothstep(-.25, .55, facing)) * min(1., aBright + h*.9 + wave + scan*.6);

    /* --- full-page state: the sphere unwraps into an equirectangular wall of text --- */
    float L = atan(-n.z, n.x);
    float u = mod(L + uSpin + PI*.5 + PI, 2.*PI) - PI;          // longitude facing the camera lands in the centre
    float lat = asin(clamp(n.y, -1., 1.));
    vec2 q = uPlane.xy + vec2(u/PI * uPlane.z * 1.04, lat/(PI*.5) * uPlane.w * 1.06);
    vec2 dm = q - uMouseV;
    float md = length(dm) / uPlane.w;
    float hp = smoothstep(.42, 0., md) * uHoverP;
    q += normalize(dm + 1e-4) * hp * .09 * uPlane.w;           // cursor parts the text like fluid
    float rdp = distance(q, uRippleV) / uPlane.w;
    float wp = exp(-pow((rdp - uRippleT*1.5)*5., 2.)) * exp(-uRippleT*.7);
    float flow = snoise(vec3(q*.8, uTime*.16));
    float z = flow*.22 + hp*.55 + wp*.45;
    q.y += snoise(vec3(q*.5 + 7., uTime*.1)) * .03;
    vec4 mvP = vec4(q, -uDepth + z, 1.);
    float alphaP = min(1., (aType > .5 ? .95 : .55) + hp*.9 + wp + max(flow,0.)*.25);

    /* --- morph, staggered outward from the point that was clicked --- */
    e = clamp(uExpand*1.5 - (rd/PI*.38 + aSeed*.12), 0., 1.);
    e = e*e*(3.-2.*e);
    mv = mix(mvS, mvP, e);
    mv.z += sin(e*PI) * (.35 + aSeed*.5);                     // bloom toward the viewer mid-flight
    h = mix(h, hp, e); wave = mix(wave, wp, e);
    vAlpha = mix(alphaS, alphaP, e);
  } else {
    p *= 1. + uExpand*2.2;                                    // rings fly off screen
    p = mix(aScatter, p, a);
    mv = modelViewMatrix * vec4(p, 1.);
    float cz = (modelViewMatrix * vec4(0.,0.,0.,1.)).z;
    vAlpha = mix(.16, 1., smoothstep(cz-.7, cz+.25, mv.z)) * aBright * (1. - uExpand);
  }
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(84., aSize * uScale * uPR / max(.2, -mv.z) * (1. + h*.7 + wave*.6) * (1. + e*.12));
  vAlpha *= a;

  float rate = (aType > .5 ? .45 : 1.1) * (.4 + aSeed) + h*16. + wave*24.;
  float tick = floor(uTime*rate + aSeed*137.);
  float r = hash(aSeed*91.7 + tick*1.618);
  if (aType < .5)      vGlyph = (h > .28 || wave > .3) ? floor(r*uN) : step(.5, r);   // hover decodes binary
  else if (aType < 1.5) vGlyph = floor(r*uN);
  else if (aType < 2.5) vGlyph = aGlyph;
  else                  vGlyph = floor(r*16.);
}`;
const glyphFrag = /* glsl */`
uniform sampler2D uAtlas; uniform float uCols;
varying float vAlpha,vGlyph;
void main(){
  float gi = floor(vGlyph + .5);
  vec2 cell = vec2(mod(gi, uCols), floor(gi / uCols));
  vec2 uv = (cell + gl_PointCoord) / uCols;
  float m = texture2D(uAtlas, uv).r;
  float a = m * vAlpha;
  if (a < .01) discard;
  gl_FragColor = vec4(vec3(1.), a);
}`;
const makeGlyphMat = () => new THREE.ShaderMaterial({
  uniforms: U, vertexShader: glyphVert, fragmentShader: glyphFrag,
  transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
});

const lineVert = /* glsl */`
uniform float uTime,uAssemble,uBase,uExpand;
attribute float aT,aPhase,aSpeed;
varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.);
  gl_Position = projectionMatrix * mv;
  float head = fract(uTime*aSpeed + aPhase)*1.7 - .35;
  float tail = smoothstep(.32, 0., head - aT) * step(aT, head);
  vec3 wn = normalize(normalMatrix * normalize(position));
  float facing = dot(wn, normalize(-mv.xyz));
  vA = (uBase + tail*.85) * mix(.12, 1., smoothstep(-.3, .35, facing)) * smoothstep(.6, 1., uAssemble) * (1. - smoothstep(0., .35, uExpand));
}`;
const lineFrag = `varying float vA; void main(){ gl_FragColor = vec4(1.,1.,1.,vA); }`;
const makeLineMat = base => new THREE.ShaderMaterial({
  uniforms:{ ...U, uBase:{value:base} }, vertexShader:lineVert, fragmentShader:lineFrag,
  transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
});

function rndScatter(arr, i){
  const v = new THREE.Vector3().randomDirection().multiplyScalar(2.5 + Math.random()*4.5);
  arr[i*3]=v.x; arr[i*3+1]=v.y; arr[i*3+2]=v.z;
}

function buildGlobePoints(mask){
  const N = 30000, golden = Math.PI * (3 - Math.sqrt(5));
  const pos=[], size=[], seed=[], type=[], bright=[];
  for (let i=0;i<N;i++){
    const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y*y), th = i * golden;
    const v = new THREE.Vector3(Math.cos(th)*r, y, Math.sin(th)*r);
    const [lat, lon] = v2ll(v);
    const land = isLand(mask, lat, lon);
    if (land){
      pos.push(v.x,v.y,v.z); size.push(.03 + Math.random()*.008); type.push(1); bright.push(.95);
    } else if (Math.random() < (mask ? .3 : .5)){
      pos.push(v.x,v.y,v.z); size.push(.024 + Math.random()*.006); type.push(0); bright.push(.34 + Math.random()*.12);
    } else continue;
    seed.push(Math.random());
  }
  const count = seed.length, g = new THREE.BufferGeometry(), sc = new Float32Array(count*3);
  for (let i=0;i<count;i++) rndScatter(sc,i);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('aScatter', new THREE.BufferAttribute(sc,3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(size,1));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed,1));
  g.setAttribute('aType', new THREE.Float32BufferAttribute(type,1));
  g.setAttribute('aGlyph', new THREE.Float32BufferAttribute(new Float32Array(count),1));
  g.setAttribute('aBright', new THREE.Float32BufferAttribute(bright,1));
  return { points:new THREE.Points(g, makeGlyphMat()), count };
}

function buildTextRing(text, radius, spacing, kind, size, bright){
  const circ = Math.PI*2*radius, n = Math.floor(circ/spacing);
  let s = ''; while (s.length < n) s += text;
  const pos=[], gl=[], seed=[], type=[], sz=[], br=[];
  for (let i=0;i<n;i++){
    const ch = s[i]; if (ch === ' ') continue;
    const a = i/n * Math.PI*2;
    pos.push(Math.cos(a)*radius, 0, -Math.sin(a)*radius);
    gl.push(Math.max(0, GLYPHS.indexOf(ch))); seed.push(Math.random());
    type.push(kind); sz.push(size); br.push(bright);
  }
  const c = seed.length, g = new THREE.BufferGeometry(), sc = new Float32Array(c*3);
  for (let i=0;i<c;i++) rndScatter(sc,i);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('aScatter', new THREE.BufferAttribute(sc,3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(sz,1));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed,1));
  g.setAttribute('aType', new THREE.Float32BufferAttribute(type,1));
  g.setAttribute('aGlyph', new THREE.Float32BufferAttribute(gl,1));
  g.setAttribute('aBright', new THREE.Float32BufferAttribute(br,1));
  return new THREE.Points(g, makeGlyphMat());
}

function buildGraticule(){
  const pos=[], t=[], ph=[], sp=[], R=1.0, seg=160;
  const push = (a,b)=>{ pos.push(a.x,a.y,a.z,b.x,b.y,b.z); t.push(2,2); ph.push(0,0); sp.push(0,0); };
  for (let lat=-75; lat<=75; lat+=15) for (let i=0;i<seg;i++)
    push(ll2v(lat, i/seg*360-180, R), ll2v(lat, (i+1)/seg*360-180, R));
  for (let lon=-180; lon<180; lon+=15) for (let i=0;i<seg/2;i++)
    push(ll2v(i/(seg/2)*180-90, lon, R), ll2v((i+1)/(seg/2)*180-90, lon, R));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(t,1));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph,1));
  g.setAttribute('aSpeed', new THREE.Float32BufferAttribute(sp,1));
  return new THREE.LineSegments(g, makeLineMat(.055));
}

function buildArcs(nodes){
  const pos=[], t=[], ph=[], sp=[], seg=72;
  const pairs = [];
  for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) if (Math.random() < .55) pairs.push([nodes[i], nodes[j]]);
  for (const [A,B] of pairs){
    const a = ll2v(A[0],A[1]), b = ll2v(B[0],B[1]);
    const ang = a.angleTo(b), phase = Math.random(), speed = .12 + Math.random()*.18;
    let prev = null;
    for (let k=0;k<=seg;k++){
      const s = k/seg;
      const v = new THREE.Vector3().copy(a).lerp(b, s).normalize()
        .multiplyScalar(1 + Math.sin(Math.PI*s) * ang * .22);
      // slerp-ish via normalized lerp is fine for these spans
      if (prev){ pos.push(prev.x,prev.y,prev.z,v.x,v.y,v.z); t.push((k-1)/seg, s); ph.push(phase,phase); sp.push(speed,speed); }
      prev = v;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(t,1));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph,1));
  g.setAttribute('aSpeed', new THREE.Float32BufferAttribute(sp,1));
  return new THREE.LineSegments(g, makeLineMat(.05));
}

const CITIES = [
  ['JKT', -6.21, 106.85], ['TYO', 35.68, 139.69], ['NYC', 40.71, -74.0], ['LDN', 51.51, -0.13],
  ['LOS', 6.52, 3.38], ['SAO', -23.55, -46.63], ['SIN', 1.35, 103.82], ['SFO', 37.77, -122.42],
  ['DXB', 25.20, 55.27], ['SYD', -33.87, 151.21],
];

/* ---------------- HTML callouts ---------------- */
const labelsEl = document.getElementById('labels');
const fmtLL = (lat, lon) => `${Math.abs(lat).toFixed(2)}°${lat<0?'S':'N'} ${Math.abs(lon).toFixed(2)}°${lon<0?'W':'E'}`;
const labels = CITIES.slice(0,6).map(([code,lat,lon])=>{
  const el = document.createElement('div'); el.className='lbl';
  el.innerHTML = `<span class="ln"></span><span class="dot"></span><div class="tag"><b>${code}</b> ${fmtLL(lat,lon)}<br><i>signals <span class="n">${(Math.random()*9000+1000|0).toLocaleString('en-US')}</span></i></div>`;
  labelsEl.appendChild(el);
  return { el, n:el.querySelector('.n'), v:ll2v(lat,lon,1.02), c:+el.querySelector('.n').textContent.replace(/,/g,'') };
});

/* ---------------- build ---------------- */
const [atlas, mask] = await Promise.all([makeAtlas(), makeMask()]);
U.uAtlas.value = atlas;
const { points:globePts, count } = buildGlobePoints(mask);
globe.add(buildGraticule());
globe.add(buildArcs(CITIES.map(c=>[c[1],c[2]])));
globe.add(globePts);

const ring1 = buildTextRing('INSIGHTX AI · AI RESEARCH · INTELLIGENT AGENTS · DATA ANALYTICS · MONITORING · '.replace(/·/g,':'), 1.34, .042, 2, .036, .85);
const ring2 = buildTextRing('3F2A 0110 9C 1101 E7 0010 B4D1 01 ', 1.58, .034, 3, .026, .38);
const ringA = new THREE.Group(); ringA.rotation.set(.42, 0, -.28); ringA.add(ring1); scene.add(ringA);
const ringB = new THREE.Group(); ringB.rotation.set(-.3, 0, .5); ringB.add(ring2); scene.add(ringB);

/* ---------------- layout ---------------- */
let W=0, H=0, mobile=false;
function resize(){
  W = innerWidth; H = innerHeight; mobile = W < 900;
  const pr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
  camera.aspect = W/H;
  // size the globe from the viewport: radius in px -> camera distance
  const R = mobile ? Math.min(W*.36, H*.24) : Math.min(H*.33, W*.23);
  camera.position.z = H / (2 * Math.tan(camera.fov*D2R/2) * R);
  // shift the globe right on desktop, up on mobile — keeps perspective centred on the sphere
  if (mobile) camera.setViewOffset(W, H, 0, H*.17, W, H);
  else camera.setViewOffset(W, H, -W*.2, H*.02, W, H);
  camera.updateProjectionMatrix();
  U.uPR.value = pr;
  U.uScale.value = (H/2) / Math.tan(camera.fov*D2R/2);
  U.uDepth.value = camera.position.z;
  const c0 = toView(-1,-1), c1 = toView(1,1);
  U.uPlane.value.set((c0.x+c1.x)/2, (c0.y+c1.y)/2, (c1.x-c0.x)/2, (c1.y-c0.y)/2);
}
// NDC -> view-space xy on the plane through the globe centre (camera looks straight down -z)
function toView(x, y){
  camera.updateMatrixWorld();
  const v = new THREE.Vector3(x, y, .5).unproject(camera).sub(camera.position);
  const k = -camera.position.z / v.z;
  return new THREE.Vector2(camera.position.x + v.x*k, camera.position.y + v.y*k);
}
addEventListener('resize', resize); resize();

/* ---------------- interaction ---------------- */
const ndc = new THREE.Vector2(9,9), ray = new THREE.Raycaster(), sphere = new THREE.Sphere(new THREE.Vector3(), 1);
const inv = new THREE.Matrix4(), hit = new THREE.Vector3(), hoverTarget = new THREE.Vector3(0,0,1);
let onGlobe = false, dragging = false, downX=0, downY=0, lastX=0, lastY=0, moved=0;
let spin = 0, spinVel = .0, tiltX = .28, tiltTarget = .28, parX = 0, parY = 0;
const AUTO = reduce ? .02 : .085; // rad/s
let expanded = false, expand = 0, grow = 1;
function setExpanded(on){
  expanded = on;
  document.body.classList.toggle('expanded', on);
}
const band = document.querySelector('.xp-band'), shadeEl = document.querySelector('.shade');
const s2 = document.getElementById('intro');
const heroFade = [...document.querySelectorAll('.hero .copy, .hero .hud-r, .hero .strip')];

function pick(){
  ray.setFromCamera(ndc, camera);
  inv.copy(globe.matrixWorld).invert();
  const r = ray.ray.clone().applyMatrix4(inv);
  return r.intersectSphere(sphere, hit) ? hit.clone().normalize() : null;
}
addEventListener('pointermove', e=>{
  ndc.set(e.clientX/W*2-1, -(e.clientY/H)*2+1);
  parX = ndc.x; parY = ndc.y;
  if (dragging){
    const dx = e.clientX-lastX, dy = e.clientY-lastY;
    spinVel = dx * .0055 * 60; tiltTarget = Math.max(-.6, Math.min(1.0, tiltTarget + dy*.004));
    moved += Math.abs(dx)+Math.abs(dy); lastX=e.clientX; lastY=e.clientY;
  }
});
canvas.addEventListener('pointerdown', e=>{
  ndc.set(e.clientX/W*2-1, -(e.clientY/H)*2+1);
  dragging = true; moved = 0; downX=lastX=e.clientX; downY=lastY=e.clientY;
  canvas.classList.add('grabbing'); canvas.setPointerCapture?.(e.pointerId);
});
addEventListener('pointerup', e=>{
  if (!dragging) return; dragging = false; canvas.classList.remove('grabbing');
  if (moved >= 6) return;
  if (expanded){ U.uRippleV.value.copy(toView(ndc.x, ndc.y)); U.uRippleT.value = 0; return; }   // pulse the map
  const p = pick();
  if (p){
    // clicking the globe pulses it and scrolls on to section 2, which unwraps it from that point
    U.uRipple.value.copy(p); U.uRippleT.value = 0;
    U.uRippleV.value.copy(toView(ndc.x, ndc.y));
    if (window.snapTo) window.snapTo(1); else s2.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
});
addEventListener('pointerleave', ()=>{ ndc.set(9,9); });
document.addEventListener('mouseleave', ()=>{ ndc.set(9,9); });

/* ---------------- HUD ---------------- */
const $lat = document.getElementById('h-lat'), $lon = document.getElementById('h-lon');
const $count = document.getElementById('h-count'), $src = document.getElementById('h-src'), $ins = document.getElementById('h-ins');
let dataCount = 4_812_330_912 + Math.floor(Math.random()*1e6), lastHud = 0;

/* ---------------- loop ---------------- */
const clock = new THREE.Clock(); let t = 0, assembleT = 0;
const tmp = new THREE.Vector3(), camDir = new THREE.Vector3();
function frame(){
  const dt = Math.min(clock.getDelta(), .05); t += dt;
  U.uTime.value = t;
  assembleT = Math.min(1, assembleT + dt/(reduce ? .01 : 2.8));
  U.uAssemble.value = 1 - Math.pow(1-assembleT, 3);
  U.uRippleT.value += dt;

  if (!dragging) spinVel += ((expanded ? AUTO*.45 : AUTO) - spinVel) * Math.min(1, dt*1.6);
  spin += spinVel * dt;
  globe.rotation.y = spin;
  U.uSpin.value = spin;
  // scroll-scrubbed: 0 at the top of the hero, 1 once section 2 fills the viewport
  const prog = Math.min(1, Math.max(0, scrollY / H));
  if (expand < .01 && prog < .01 && U.uRippleT.value > 3) U.uRipple.value.copy(globe.worldToLocal(camera.position.clone()).normalize());
  expand += (prog - expand) * Math.min(1, dt*5);
  if (Math.abs(expand - prog) < .0005) expand = prog;
  U.uExpand.value = expand;
  if ((expand > .5) !== expanded) setExpanded(expand > .5);
  band.style.opacity = Math.max(0, (expand - .25) / .75).toFixed(3);
  shadeEl.style.opacity = (1 - expand*.85).toFixed(3);
  const hf = Math.max(0, 1 - expand*2.2).toFixed(3);       // hero copy fades out before it slides under the fixed nav
  for (const el of heroFade) el.style.opacity = hf;
  grow += ((onGlobe && !expanded ? 1.12 : 1) - grow) * Math.min(1, dt*4);
  globe.scale.setScalar(grow);
  if (!dragging) tiltTarget += (.28 - tiltTarget) * dt * .5;
  tiltX += (tiltTarget - tiltX) * Math.min(1, dt*6);
  tilt.rotation.x = tiltX + parY*.06;
  tilt.rotation.y = parX*.08;
  ringA.children[0].rotation.y = t*.06;
  ringB.children[0].rotation.y = -t*.035;
  scene.updateMatrixWorld();

  const p = pick(); onGlobe = !!p;
  if (p) hoverTarget.copy(p);
  U.uHover.value.lerp(hoverTarget, Math.min(1, dt*9)).normalize();
  U.uHoverStr.value += ((onGlobe ? 1 : 0) - U.uHoverStr.value) * Math.min(1, dt*(onGlobe?5:2.5));
  const mouseIn = ndc.x < 2;
  if (mouseIn){ const mv = toView(ndc.x, ndc.y); U.uMouseV.value.lerp(mv, Math.min(1, dt*10)); }
  U.uHoverP.value += ((mouseIn ? 1 : 0) - U.uHoverP.value) * Math.min(1, dt*4);

  // callouts
  camera.getWorldPosition(camDir);
  for (const L of labels){
    tmp.copy(L.v).applyMatrix4(globe.matrixWorld);
    const facing = tmp.clone().normalize().dot(camDir.clone().sub(tmp).normalize());
    tmp.project(camera);
    const x = (tmp.x+1)/2*W, y = (1-tmp.y)/2*H;
    L.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    L.el.style.opacity = (facing > .35 && assembleT > .9 && expand < .05 && !expanded) ? 1 : 0;
  }

  if (t - lastHud > .08){
    lastHud = t;
    dataCount += Math.floor(180000 + Math.random()*90000);
    $count.textContent = dataCount.toLocaleString('en-US');
    $src.textContent = (12840 + Math.floor(Math.sin(t*.3)*40 + Math.random()*8)).toLocaleString('en-US');
    $ins.textContent = (380 + Math.floor(Math.random()*60) + (onGlobe ? 900 : 0)).toLocaleString('en-US');
    const hv = U.uHover.value;
    if (U.uHoverStr.value > .3){ const [la,lo] = v2ll(hv); $lat.textContent = `${Math.abs(la).toFixed(4)}°${la<0?'S':'N'}`; $lon.textContent = `${Math.abs(lo).toFixed(4)}°${lo<0?'W':'E'}`; }
    else { $lat.textContent = 'Scanning'; $lon.textContent = '— — — —'; }
    for (const L of labels){ L.c += Math.floor(Math.random()*7); L.n.textContent = L.c.toLocaleString('en-US'); }
  }

  canvas.style.cursor = dragging ? '' : (expanded ? 'crosshair' : (onGlobe ? 'pointer' : 'default'));
  if (scrollY < H * 2 + 2) renderer.render(scene, camera);     // section 3 fully covers the canvas past this point
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------------- headline decode ---------------- */
const SYM = '01#%&@<>/=+*';
function splitChars(el){
  const text = el.textContent; el.textContent = '';
  const words = text.split(' ');
  const chars = [];
  words.forEach((w,wi)=>{
    const wordEl = document.createElement('span'); wordEl.style.whiteSpace = 'nowrap'; wordEl.style.display='inline-block';
    for (const ch of w){ const s = document.createElement('span'); s.className='ch pre'; s.textContent = ch; wordEl.appendChild(s); chars.push(s); }
    el.appendChild(wordEl);
    if (wi < words.length-1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}
function decode(chars, set, delay, dur){
  const start = performance.now() + delay;
  const order = chars.map((c,i)=>i/chars.length*.75 + Math.random()*.25);
  function step(now){
    const p = (now - start) / dur;
    let done = true;
    chars.forEach((c,i)=>{
      const local = (p - order[i]*.7) / .3;
      if (local < 0){ done = false; return; }
      c.classList.remove('pre');
      if (local < 1){ done = false; c.classList.add('scr'); c.dataset.g = set[Math.random()*set.length|0]; }
      else c.classList.remove('scr');
    });
    if (!done) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const [noiseEl, senseEl] = document.querySelectorAll('[data-scramble]');
const noiseChars = splitChars(noiseEl), senseChars = splitChars(senseEl);
const caret = document.createElement('span'); caret.className='caret'; senseEl.appendChild(caret);
if (reduce){ [...noiseChars, ...senseChars].forEach(c=>c.classList.remove('pre')); }
else { decode(noiseChars, '01', 600, 1500); decode(senseChars, SYM, 2100, 1100); }

// section 2: decode the headline the first time it scrolls into view
const s2Lines = [...document.querySelectorAll('[data-scramble2]')].map(splitChars);
s2Lines.forEach(cs => { const last = cs[cs.length - 1]; if (last && last.textContent === '.') last.classList.add('dot'); });
if (reduce) s2Lines.flat().forEach(c=>c.classList.remove('pre'));
new IntersectionObserver((entries, io)=>{
  if (!entries.some(e=>e.isIntersecting)) return;
  document.getElementById('intro').classList.add('in');
  if (!reduce){ decode(s2Lines[0], '01', 150, 1200); decode(s2Lines[1], SYM, 900, 1100); }
  io.disconnect();
}, { threshold: .45 }).observe(document.getElementById('intro'));

// hovering the "noise" sentence turns it back into raw data for a moment
let noiseBusy = false;
noiseEl.addEventListener('pointerenter', ()=>{
  if (noiseBusy || reduce) return; noiseBusy = true;
  const pick = noiseChars.filter(()=>Math.random() < .55);
  const end = performance.now() + 700;
  (function f(now){
    pick.forEach(c=>{ if (now < end - Math.random()*500){ c.classList.add('scr'); c.dataset.g = Math.random()<.5?'0':'1'; } else c.classList.remove('scr'); });
    if (now < end) requestAnimationFrame(f); else { pick.forEach(c=>c.classList.remove('scr')); noiseBusy = false; }
  })(performance.now());
});
})();
