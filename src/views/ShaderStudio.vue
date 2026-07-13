<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const promptText = ref('')
const isGenerating = ref(false)
const errorMsg = ref('')
const showCode = ref(false)
const shaderCode = ref('')
const selectedTemplate = ref(0)

const templates = [
  { name: '水面波纹', prompt: 'A calm water surface with gentle ripples, blue and cyan tones',
    code: 'uniform float uTime;uniform float uSpeed;uniform float uScale;varying vec2 vUv;void main(){vec2 uv=vUv*uScale;float t=uTime*uSpeed;float w1=sin(uv.x*5.0+t)*0.04;float w2=sin(uv.y*6.0+t*0.7)*0.04;float w3=sin((uv.x+uv.y)*3.0+t*1.3)*0.03;vec2 d=uv+vec2(w1+w2,w2+w3);float depth=sin(d.x*4.0-t)*cos(d.y*4.0-t*0.6)*0.3+0.5;vec3 deep=vec3(0.0,0.08,0.2);vec3 shallow=vec3(0.0,0.6,0.7);vec3 foam=vec3(0.7,0.9,1.0);vec3 color=mix(deep,shallow,depth);float fl=smoothstep(0.48,0.52,abs(sin(d.x*10.0+d.y*8.0+t*0.5)));color=mix(color,foam,fl*0.3);color+=(1.0-length(uv-1.0)*0.6)*vec3(0.1,0.3,0.4);vec3 sp=vec3(1.0)*pow(max(0.0,sin(d.x*30.0+t*2.0)*sin(d.y*25.0+t*1.5)),30.0);color+=sp*0.5;gl_FragColor=vec4(color,1.0);}' },
  { name: '星云旋转', prompt: 'A colorful swirling nebula in deep space',
    code: 'uniform float uTime;uniform float uSpeed;uniform float uIntensity;varying vec2 vUv;void main(){vec2 uv=vUv-0.5;float t=uTime*uSpeed;float a=atan(uv.y,uv.x)+t;float r=length(uv)*3.0;float sw1=sin(a*3.0+r*2.0-t*0.5)*0.5+0.5;float sw2=cos(a*5.0-r*3.0+t*0.3)*0.5+0.5;float sw3=sin(a*2.0+r*4.0+t*0.7)*0.5+0.5;vec3 c1=vec3(0.8,0.2,0.6);vec3 c2=vec3(0.1,0.7,0.9);vec3 c3=vec3(0.4,0.1,0.8);vec3 color=mix(c1,c2,sw1);color=mix(color,c3,sw2*0.6);color=mix(color,vec3(0,0,0.1),1.0-r*0.3);color+=mix(c1,c2,sw3)*0.03/(r+0.05)*0.5;float stars=step(0.997,sin(uv.x*400.0+t*5.0)*sin(uv.y*400.0+t*3.0)*cos(t*0.5));color+=stars*1.5;gl_FragColor=vec4(color*1.2,1.0);}' },
  { name: '霓虹光效', prompt: 'Cyberpunk neon glow effect with pink and cyan edges',
    code: 'uniform float uTime;uniform float uSpeed;uniform float uGlow;varying vec2 vUv;void main(){vec2 uv=vUv;float t=uTime*uSpeed;vec2 p=uv*6.0;vec2 id=floor(p);vec2 f=fract(p)-0.5;float dist=length(f);float grid=smoothstep(0.45,0.48,dist);float pulse=sin(uTime*0.8+id.x*2.5+id.y*1.7)*0.5+0.5;float neon1=1.0-smoothstep(0.0,0.06,abs(f.x));float neon2=1.0-smoothstep(0.0,0.06,abs(f.y));float lines=max(neon1,neon2)*0.6;vec3 pink=vec3(1.0,0.1,0.6);vec3 cyan=vec3(0.0,1.0,0.8);vec3 purple=vec3(0.6,0.1,1.0);vec3 color=mix(pink,cyan,pulse);color=mix(color,purple,sin(t+id.x*3.0)*0.3+0.3);color*=grid+lines;float glow=exp(-dist*4.0)*uGlow*0.4*(1.0-grid);color+=glow*mix(pink,cyan,pulse);vec3 bg=vec3(0.02,0.01,0.04);color=mix(bg,color,0.2+grid*0.8+glow*0.5);gl_FragColor=vec4(color,1.0);}' },
  { name: '熔岩流动', prompt: 'Flowing molten lava texture, fiery red and orange colors',
    code: 'uniform float uTime;uniform float uSpeed;uniform float uIntensity;varying vec2 vUv;void main(){vec2 uv=vUv;float t=uTime*uSpeed;float n1=sin(uv.x*3.0-t)+sin(uv.y*4.0+t*0.7)+sin((uv.x+uv.y)*2.0+t*1.4);float n2=sin(uv.y*3.0-t*0.6)+cos(uv.x*5.0+t*0.9)+sin((uv.x-uv.y)*3.0+t*0.7);float n3=cos(uv.x*4.0-t*0.5)+sin(uv.y*3.5+t*1.1)+cos((uv.x+uv.y*2.0)*2.0-t*0.8);float flow=n1*0.5+n2*0.3+n3*0.2;flow=flow*0.3+0.6;vec3 dark=vec3(0.1,0.02,0.0);vec3 red=vec3(0.6,0.05,0.0);vec3 orange=vec3(1.0,0.3,0.0);vec3 yellow=vec3(1.0,0.8,0.1);vec3 white=vec3(1.0,0.95,0.7);vec3 color=dark;color=mix(color,red,smoothstep(0.1,0.4,flow));color=mix(color,orange,smoothstep(0.4,0.65,flow));color=mix(color,yellow,smoothstep(0.65,0.85,flow));color=mix(color,white,smoothstep(0.85,1.0,flow));float crack=sin(uv.x*15.0+n2*3.0)*sin(uv.y*12.0+n3*2.0);crack=smoothstep(0.9,0.95,abs(crack));color+=crack*vec3(0.8,0.5,0.0)*0.5;float ember=pow(max(0.0,sin(uv.x*50.0+t*3.0)*sin(uv.y*45.0-t*2.0)),20.0);color+=ember*orange*0.8;gl_FragColor=vec4(color,1.0);}' },
  { name: '万花筒', prompt: 'Symmetrical kaleidoscope pattern, vibrant multi-color mandala',
    code: 'uniform float uTime;uniform float uZoom;uniform float uRotation;varying vec2 vUv;void main(){vec2 uv=(vUv-0.5)*uZoom;float t=uTime*0.2;float a=atan(uv.y,uv.x)+t+uRotation;float r=length(uv);float segs=8.0;float ma=mod(a,6.2832/segs);ma=abs(ma-3.1416/segs);vec2 sp=vec2(cos(ma+floor(a*segs/6.2832)*(6.2832/segs))*r,sin(ma+floor(a*segs/6.2832)*(6.2832/segs))*r);float p1=sin(sp.x*4.0+t*0.5)*cos(sp.y*4.0+t*0.3);float p2=sin((sp.x+sp.y)*3.0-t*0.7)*cos((sp.x-sp.y)*3.0+t*0.5);float p3=sin(sp.x*6.0-t*0.4)*sin(sp.y*6.0+t*0.6);vec3 mg=vec3(1.0,0.1,0.6);vec3 cy=vec3(0.0,1.0,0.9);vec3 yl=vec3(1.0,0.9,0.1);vec3 pu=vec3(0.5,0.1,1.0);vec3 color=mix(mg,cy,p1*0.5+0.5);color=mix(color,yl,p2*0.4+0.3);color=mix(color,pu,p3*0.3+0.2);color=mix(color,vec3(1.0,0.5,0.0),(p1+p2+p3)*0.15);color*=1.0-r*0.4;gl_FragColor=vec4(color,1.0);}' },
  { name: '像素风', prompt: 'Retro pixel art style gradient, blocky color bands, nostalgic 8-bit',
    code: 'uniform float uTime;uniform float uSpeed;uniform float uPalette;varying vec2 vUv;void main(){float t=uTime*uSpeed;float px=20.0+10.0*sin(t*0.3);vec2 puv=floor(vUv*px)/px;vec3 pal[4];pal[0]=vec3(0.2,0.4,0.6);pal[1]=vec3(0.8,0.3,0.2);pal[2]=vec3(0.1,0.6,0.3);pal[3]=vec3(0.7,0.2,0.6);int idx=int(mod(uPalette,4.0));float palc=sin(puv.x*3.0+t)*0.5+0.5;palc=floor(palc*4.0)/4.0;vec3 color=pal[idx]+palc*0.4;float band=floor(puv.y*8.0+sin(t*0.5)*2.0)/8.0;color=mix(color,vec3(1.0),band*0.15);float dither=step(0.5,fract(sin(dot(vUv*1000.0,vec2(12.9898,78.233)))*43758.5453));if(band>0.3&&band<0.35)color+=dither*0.2;float scanlines=step(0.5,fract(vUv.y*px*1.5));color*=0.7+scanlines*0.3;color*=1.0-length(vUv-0.5)*0.4;gl_FragColor=vec4(color,1.0);}' },
]

let scene: THREE.Scene | null = null; let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null; let mesh: THREE.Mesh | null = null
let animId: number | null = null
let currentUniforms: Record<string, THREE.IUniform> = {}
interface PU { name: string; min: number; max: number; step: number; dv: number }
const uniformList = ref<PU[]>([])

function initScene() {
  if (!canvasRef.value) return
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0a14)
  camera = new THREE.PerspectiveCamera(60, 640/480, 0.1, 100); camera.position.z = 2
  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true })
  renderer.setSize(640, 480); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  animate()
}
function getU(code: string) {
  const u: Record<string, THREE.IUniform> = {}; const re = /uniform\s+(float|vec[234])\s+(\w+)\s*;/g; let m
  while ((m = re.exec(code)) !== null) {
    const n = m[2]; const t = m[1]
    if (t === 'float') u[n] = { value: 0.0 }
    else if (t === 'vec2') u[n] = { value: new THREE.Vector2(0, 0) }
    else if (t === 'vec3') u[n] = { value: new THREE.Vector3(0, 0, 0) }
    else u[n] = { value: 0.0 }
  }
  u.uTime = { value: 0 };
  u.u_resolution = { value: new THREE.Vector2(640, 480) };
  // Set reasonable defaults for uniforms
  [["uSpeed",1.0],["uScale",1.0],["uIntensity",1.0],["uGlow",1.0],["uZoom",1.0],["uRotation",0.0],["uPalette",0.0]].forEach(function(nv){if(!u[nv[0]])u[nv[0]]={value:nv[1]}});
  return u
}
function parseU(code: string): PU[] {
  const r: PU[] = []; const re = /uniform\s+float\s+(\w+)\s*;?\s*\/\/\s*@slider\s*\(?\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)?\s*,?\s*([\d.-]*)/g; let m
  while ((m = re.exec(code)) !== null) {
    const n = m[1]; const mi = parseFloat(m[2]); const ma = parseFloat(m[3]); const s = parseFloat(m[4]); let d = parseFloat(m[5])
    if (isNaN(d)) { d = (mi + ma) / 2 }; r.push({ name: n, min: mi, max: ma, step: s, dv: d })
  }
  return r
}
function renderShader(code: string) {
  errorMsg.value = ''
  const vs = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}'
  const u = getU(code); currentUniforms = u; if (currentUniforms.u_resolution) currentUniforms.u_resolution.value = new THREE.Vector2(640, 480); const pu = parseU(code); uniformList.value = pu
  for (const p of pu) { if (!u[p.name]) u[p.name] = { value: p.dv }; else u[p.name].value = p.dv }
  if (mesh && scene) { scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); mesh = null }
  if (!scene || !renderer) return
  try {
    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: code, uniforms: u, depthWrite: true, depthTest: true, side: THREE.DoubleSide })
    mesh = new THREE.Mesh(geo, mat); scene.add(mesh)
  } catch (e: any) { errorMsg.value = 'Shader error: ' + e.message }
  shaderCode.value = code; showCode.value = true
}
function loadTemplate(idx: number) { selectedTemplate.value = idx; promptText.value = templates[idx].prompt; renderShader(templates[idx].code) }
async function generateShader() {
  if (!promptText.value.trim() || isGenerating.value) return
  isGenerating.value = true; errorMsg.value = ''
  try {
    const r = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: promptText.value }) })
    if (!r.ok) throw new Error('API error: ' + r.status)
    const d = await r.json()
    if (!d || !d.shaderCode) throw new Error('Invalid response')
    let code = d.shaderCode
    if (!code.includes('void main()')) code = 'uniform float uTime;varying vec2 vUv;void main(){' + code + '}'
    renderShader(code)
  } catch (e: any) { errorMsg.value = 'Failed: ' + e.message } finally { isGenerating.value = false }
}
function hl(code: string): string {
  let h = code.replace(/&/g,'&amp;').replace(/</g,'&lt;')
  const ps = [{c:'kw',r:/\b(attribute|const|uniform|varying|void|return|if|else|for|while)\b/g},{c:'type',r:/\b(float|int|bool|vec[234])\b/g},{c:'num',r:/\b\d+\.?\d*([eE][+-]?\d+)?\b/g},{c:'fn',r:/\b(sin|cos|pow|abs|floor|ceil|fract|mod|min|max|clamp|mix|step|smoothstep|length|dot)\b/g},{c:'cm',r:/\/\/.*/g}]
  for (const p of ps) h = h.replace(p.r, '<span class=hl-'+p.c+'>$&</span>'); return h
}
function animate() {
  animId = requestAnimationFrame(animate)
  var t=performance.now()*0.001;if(currentUniforms.uTime)currentUniforms.uTime.value=t;if(currentUniforms.u_time)currentUniforms.u_time.value=t;if(currentUniforms.u_resolution)currentUniforms.u_resolution.value.set(640,480)
  if (mesh && renderer && scene && camera) renderer.render(scene, camera)
}
onMounted(() => { initScene(); loadTemplate(0) })
onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  if (mesh && scene) { scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose() }
  renderer?.dispose()
})
</script>
<template>
  <div class="studio">
    <div class="panel-left">
      <div class="section-label">Shader Templates</div>
      <div class="template-grid">
        <button v-for="(t,i) in templates" :key="i" :class="['tmpl-btn',{active:selectedTemplate===i}]" @click="loadTemplate(i)">{{ t.name }}</button>
      </div>
      <div class="section-label">Generate</div>
      <textarea v-model="promptText" class="prompt-input" placeholder="Describe the shader effect..."></textarea>
      <button class="generate-btn" :disabled="isGenerating||!promptText.trim()" @click="generateShader">
        <span v-if="isGenerating" class="spinner"></span><span v-else>Generate</span>
      </button>
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div v-if="uniformList.length" class="section-label">Uniforms</div>
      <div class="uniforms">
        <div v-for="u in uniformList" :key="u.name" class="uniform-row">
          <div class="uniform-label"><span>{{ u.name.replace(/^u_?/,'') }}</span><span class="uni-val">{{ ((currentUniforms[u.name]?.value as number)||0).toFixed(u.step>=0.1?1:2) }}</span></div>
          <input type="range" :min="u.min" :max="u.max" :step="u.step" :value="(currentUniforms[u.name]?.value as number)||0" @input="(e)=>{if(currentUniforms[u.name]){const v=parseFloat((e.target as HTMLInputElement).value);currentUniforms[u.name].value=v}}" />
        </div>
      </div>
    </div>
    <div class="panel-right">
      <div class="canvas-wrap"><canvas ref="canvasRef"></canvas></div>
      <div v-if="showCode&&shaderCode" class="code-panel">
        <div class="code-header"><span>Shader Code ({{ shaderCode.length }} chars)</span><button class="copy-btn" @click="navigator.clipboard.writeText(shaderCode)">Copy</button></div>
        <pre class="code-body"><code v-html="hl(shaderCode)"></code></pre>
      </div>
    </div>
  </div>
</template>
<style scoped>
.studio{display:flex;height:100%}.panel-left{width:310px;min-width:310px;padding:14px;background:#12121f;border-right:1px solid #2a2a40;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
.section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#555570;margin-top:4px}
.template-grid{display:flex;flex-wrap:wrap;gap:5px}
.tmpl-btn{padding:4px 10px;border:1px solid #2a2a40;border-radius:5px;background:#1a1a2e;color:#8888aa;font-size:12px;cursor:pointer;transition:all .2s;font-family:inherit}
.tmpl-btn:hover{border-color:#6c5ce7;color:#e0e0e8}.tmpl-btn.active{background:#6c5ce7;color:#fff;border-color:#6c5ce7}
.prompt-input{width:100%;min-height:70px;padding:8px 10px;border:1px solid #2a2a40;border-radius:6px;background:#0e0e1a;color:#e0e0e8;font-size:12px;font-family:inherit;line-height:1.5;resize:vertical;outline:none}
.prompt-input:focus{border-color:#6c5ce7;box-shadow:0 0 0 2px rgba(108,92,231,0.2)}
.generate-btn{width:100%;padding:8px;border:none;border-radius:6px;background:linear-gradient(135deg,#6c5ce7,#00cec9);color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.generate-btn:hover:not(:disabled){box-shadow:0 0 20px rgba(108,92,231,0.3)}
.generate-btn:disabled{opacity:.5;cursor:not-allowed}
.spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
.error-msg{padding:6px 10px;border-radius:5px;background:rgba(255,60,60,0.1);border:1px solid rgba(255,60,60,0.2);color:#ff6b6b;font-size:12px}
.uniforms{display:flex;flex-direction:column;gap:6px}
.uniform-row{display:flex;flex-direction:column;gap:2px}
.uniform-label{display:flex;justify-content:space-between;font-size:11px;color:#8888aa;font-family:"JetBrains Mono",monospace}
.uni-val{color:#00cec9}
.uniform-row input[type=range]{-webkit-appearance:none;width:100%;height:3px;border-radius:2px;background:#2a2a40;outline:none}
.uniform-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:linear-gradient(135deg,#6c5ce7,#00cec9);border:2px solid #12121f;cursor:pointer}
.panel-right{flex:1;display:flex;flex-direction:column;background:#0a0a14}
.canvas-wrap{flex:1;display:flex;align-items:center;justify-content:center}
.canvas-wrap canvas{width:100%;height:100%}
.code-panel{border-top:1px solid #2a2a40;max-height:180px;overflow:hidden}
.code-header{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#12121f;font-size:11px;color:#555570}
.copy-btn{padding:3px 8px;border:1px solid #2a2a40;border-radius:4px;background:#1a1a2e;color:#8888aa;font-size:11px;cursor:pointer;font-family:inherit}
.copy-btn:hover{border-color:#6c5ce7;color:#e0e0e8}
.code-body{margin:0;padding:10px;background:#0e0e1a;overflow:auto;max-height:140px;font-family:"JetBrains Mono",monospace;font-size:11px;line-height:1.5}
.code-body :deep(.hl-kw){color:#c792ea}
.code-body :deep(.hl-type){color:#82aaff}
.code-body :deep(.hl-num){color:#f78c6c}
.code-body :deep(.hl-fn){color:#ffcb6b}
.code-body :deep(.hl-cm){color:#546e7a;font-style:italic}
</style>
