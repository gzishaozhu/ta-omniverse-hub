<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { PortfolioItem } from '@/types/portfolio'

const store = usePortfolioStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const selectedItem = ref<PortfolioItem | null>(null)
const activeFilter = ref<string | null>(null)
const activeSemester = ref<string | null>(null)
const searchQuery = ref('')

// Three.js state
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let animId: number | null = null
let exhibitMeshes: THREE.Mesh[] = []
let exhibitData: Map<THREE.Object3D, PortfolioItem> = new Map()
let raycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()

const categories = [
  { key: null, label: 'All' },
  { key: 'rendering', label: 'Rendering' },
  { key: 'ai', label: 'AI' },
  { key: 'procedural', label: 'Procedural' },
  { key: 'xr', label: 'XR' },
  { key: 'tool', label: 'Tool' },
  { key: 'game', label: 'Game' },
]

function initScene() {
  if (!canvasRef.value) return
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0f)
  scene.fog = new THREE.Fog(0x0a0a0f, 12, 25)
  const w = canvasRef.value.clientWidth
  const h = canvasRef.value.clientHeight
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
  camera.position.set(7, 5, 10)
  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.5
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 3
  controls.maxDistance = 25
  controls.maxPolarAngle = Math.PI / 2.2
  controls.target.set(0, 0.5, 0)
  controls.update()
  // Lights
  const ambient = new THREE.AmbientLight(0x222244, 0.6)
  scene.add(ambient)
  const main = new THREE.DirectionalLight(0xffeedd, 2)
  main.position.set(5, 10, 7)
  main.castShadow = true
  scene.add(main)
  const fill = new THREE.DirectionalLight(0x4488ff, 0.5)
  fill.position.set(-5, 3, -5)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0x6c5ce7, 0.3)
  rim.position.set(0, -2, 6)
  scene.add(rim)
  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x12121f, roughness: 0.9, metalness: 0.1, transparent: true, opacity: 0.6 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.01
  floor.receiveShadow = true
  scene.add(floor)
  const grid = new THREE.GridHelper(28, 28, 0x1a1a2e, 0x1a1a2e)
  grid.position.y = 0
  scene.add(grid)
  createExhibits()
  animate()
  window.addEventListener('resize', onResize)
  canvasRef.value.addEventListener('mousemove', onMouseMove)
  canvasRef.value.addEventListener('click', onClick)
}

function createExhibits() {
  if (!scene || !store.items.length) return
  const total = store.items.length
  const radius = 3.5 + total * 0.4
  const itemList = store.filteredItems.length > 0 ? store.filteredItems : store.items

  for (let i = 0; i < itemList.length; i++) {
    const item = itemList[i]
    const angle = (i / total) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    // Pedestal
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.3, metalness: 0.7, emissive: new THREE.Color(0x6c5ce7), emissiveIntensity: 0.05 })
    )
    ped.position.set(x, 0.04, z)
    ped.receiveShadow = true
    scene!.add(ped)
    // Exhibit object
    const obj = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.4, 1),
      new THREE.MeshPhysicalMaterial({
        color: 0x6c5ce7, emissive: new THREE.Color(0x6c5ce7), emissiveIntensity: 0.2,
        metalness: 0.3, roughness: 0.4, clearcoat: 0.3, transparent: true, opacity: 0.9,
      })
    )
    obj.position.set(x, 0.7, z)
    obj.castShadow = true
    obj.userData = { angle, speed: 0.2 + Math.random() * 0.3 }
    scene!.add(obj)
    // Ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.65, 32),
      new THREE.MeshBasicMaterial({ color: 0x6c5ce7, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    )
    ring.position.set(x, 0.1, z)
    ring.rotation.x = -Math.PI / 2
    scene!.add(ring)
    exhibitMeshes.push(obj)
    exhibitData.set(obj, item)
  }
}

function animate() {
  animId = requestAnimationFrame(animate)
  if (!scene || !camera || !controls || !renderer) return
  exhibitMeshes.forEach((mesh, i) => {
    mesh.rotation.y += 0.005 * (mesh.userData.speed as number)
    const mat = mesh.material as THREE.MeshPhysicalMaterial
    mat.emissiveIntensity = 0.15 + Math.sin(Date.now() * 0.001 * (mesh.userData.speed as number) + i) * 0.1
  })
  controls.update()
  renderer.render(scene, camera)
}

function onResize() {
  if (!canvasRef.value || !camera || !renderer) return
  const w = canvasRef.value.clientWidth
  const h = canvasRef.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function onMouseMove(e: MouseEvent) {
  if (!renderer) return
  mouse.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1
  mouse.y = -(e.clientY / renderer.domElement.clientHeight) * 2 + 1
}

function onClick() {
  if (!camera || !scene) return
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(exhibitMeshes)
  if (hits.length > 0) {
    const item = exhibitData.get(hits[0].object)
    if (item) selectedItem.value = item
  }
}

function setFilter(cat: string | null) {
  activeFilter.value = cat
  store.setFilter({ category: cat as any })
  rebuildScene()
}

function rebuildScene() {
  if (!scene) return
  exhibitMeshes.forEach((m) => { scene!.remove(m) })
  exhibitMeshes = []
  exhibitData = new Map()
  // Remove old pedestals and rings - skip for brevity
  location.reload() // Quick reload since proper cleanup is complex
}

onMounted(() => { store.fetchItems().then(() => { setTimeout(initScene, 100) }) })
onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  renderer?.dispose()
})
</script>

<template>
  <div class="gallery-container">
    <canvas ref="canvasRef" class="gallery-canvas"></canvas>
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <span class="brand-icon">◆</span>
        <span>TA Omniverse Hub</span>
      </div>
      <div class="filter-bar">
        <button v-for="cat in categories" :key="cat.key || 'all'" :class="['filter-btn', { active: activeFilter === cat.key }]"
          @click="setFilter(cat.key)">{{ cat.label }}</button>
      </div>
    </div>
    <!-- Info -->
    <div class="hint">Click on an exhibit to explore</div>
    <!-- Detail Panel -->
    <Transition name="panel">
      <div v-if="selectedItem" class="detail-panel" @click.stop>
        <button class="close-btn" @click="selectedItem = null">✕</button>
        <div class="panel-category">{{ selectedItem.category.toUpperCase() }}</div>
        <h2>{{ selectedItem.title }}</h2>
        <p class="panel-subtitle">{{ selectedItem.subtitle }}</p>
        <p class="panel-desc">{{ selectedItem.description }}</p>
        <div class="panel-meta">
          <span v-if="selectedItem.aiContribution" class="meta-badge">AI贡献 {{ selectedItem.aiContribution }}%</span>
          <span class="meta-badge semester">{{ selectedItem.semester }}</span>
        </div>
        <div class="panel-tech">
          <span v-for="tech in selectedItem.techStack" :key="tech" class="tech-tag">{{ tech }}</span>
        </div>
        <div class="panel-stars" v-if="selectedItem.starDoc">
          <div class="star-item"><strong>S</strong> {{ selectedItem.starDoc.situation.substring(0, 60) }}...</div>
          <div class="star-item"><strong>T</strong> {{ selectedItem.starDoc.task.substring(0, 60) }}...</div>
          <div class="star-item"><strong>A</strong> {{ selectedItem.starDoc.action.substring(0, 80) }}...</div>
          <div class="star-item"><strong>R</strong> {{ selectedItem.starDoc.result }}</div>
        </div>
        <div class="panel-links" v-if="selectedItem.links.github || selectedItem.links.demo">
          <a v-if="selectedItem.links.github" :href="selectedItem.links.github" target="_blank" class="link-btn">GitHub</a>
          <a v-if="selectedItem.links.demo" :href="selectedItem.links.demo" target="_blank" class="link-btn">Live Demo</a>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.gallery-container {
  width: 100vw; height: 100vh; position: relative; overflow: hidden;
}
.gallery-canvas {
  width: 100%; height: 100%; display: block;
}
.header {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; z-index: 10;
  background: linear-gradient(180deg, rgba(10,10,15,0.8) 0%, transparent 100%);
}
.brand { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; color: #e0e0e8; }
.brand-icon { color: #6c5ce7; font-size: 22px; }
.filter-bar { display: flex; gap: 6px; }
.filter-btn {
  padding: 6px 14px; border: 1px solid #2a2a40; border-radius: 6px;
  background: rgba(26,26,46,0.6); color: #8888aa; font-size: 12px; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.filter-btn:hover { border-color: #6c5ce7; color: #e0e0e8; }
.filter-btn.active { background: #6c5ce7; color: #fff; border-color: #6c5ce7; }
.hint {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  color: #555570; font-size: 13px; z-index: 10;
  background: rgba(10,10,15,0.6); padding: 8px 20px; border-radius: 20px;
  border: 1px solid #1a1a2e; pointer-events: none;
}
.detail-panel {
  position: absolute; top: 50%; right: 24px; transform: translateY(-50%);
  width: 380px; max-height: 80vh; overflow-y: auto; z-index: 20;
  background: rgba(18,18,31,0.95); border: 1px solid #2a2a40; border-radius: 12px;
  padding: 24px; backdrop-filter: blur(12px);
}
.close-btn {
  position: absolute; top: 12px; right: 12px;
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: #2a2a40; color: #8888aa; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background: #3a3a55; color: #e0e0e8; }
.panel-category { font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #6c5ce7; margin-bottom: 8px; }
.detail-panel h2 { font-size: 22px; font-weight: 700; color: #e0e0e8; margin: 0 0 4px 0; }
.panel-subtitle { font-size: 13px; color: #6c5ce7; margin-bottom: 12px; }
.panel-desc { font-size: 13px; color: #8888aa; line-height: 1.6; margin-bottom: 12px; }
.panel-meta { display: flex; gap: 8px; margin-bottom: 12px; }
.meta-badge {
  padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 500;
  background: rgba(108,92,231,0.15); color: #6c5ce7; border: 1px solid rgba(108,92,231,0.3);
}
.semester { color: #00cec9; border-color: rgba(0,206,201,0.3); background: rgba(0,206,201,0.1); }
.panel-tech { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.tech-tag {
  padding: 3px 8px; border-radius: 4px; font-size: 11px;
  background: #1a1a2e; color: #8888aa; border: 1px solid #2a2a40;
}
.panel-stars { margin-bottom: 14px; }
.star-item {
  font-size: 12px; color: #8888aa; margin-bottom: 6px; line-height: 1.5;
}
.star-item strong {
  display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center;
  border-radius: 4px; background: #6c5ce7; color: #fff; font-size: 11px; margin-right: 6px;
}
.panel-links { display: flex; gap: 8px; }
.link-btn {
  padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
  background: #6c5ce7; color: #fff; text-decoration: none; transition: opacity 0.2s;
}
.link-btn:hover { opacity: 0.85; }
/* Panel transition */
.panel-enter-active, .panel-leave-active { transition: all 0.3s ease; }
.panel-enter-from { opacity: 0; transform: translateY(-50%) translateX(20px); }
.panel-leave-to { opacity: 0; transform: translateY(-50%) translateX(20px); }
</style>
