import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"
import { ref, onMounted, onBeforeUnmount } from "vue"
import type { PortfolioItem } from "@/types/portfolio"

const COLORS = {
  bg: 0x0a0a0f,
  floor: 0x12121f,
  grid: 0x1a1a2e,
  primary: 0x6c5ce7,
  accent: 0x00cec9,
  glow: 0x6c5ce7,
  text: 0xe0e0e8,
}

export function useThreeScene(
  canvasRef: any,
  items: PortfolioItem[],
  onSelect: (item: PortfolioItem) => void
) {
  // Three.js scene objects
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let controls: OrbitControls | null = null
  let animationId: number | null = null
  let raycaster = new THREE.Raycaster()
  let mouse = new THREE.Vector2()
  let exhibitMeshes: THREE.Mesh[] = []
  let exhibitData: Map<THREE.Mesh, PortfolioItem> = new Map()
  let hoveredMesh: THREE.Mesh | null = null

  // --- Init ---
  function init() {
    if (!canvasRef?.value) return

    scene = new THREE.Scene()
    scene.background = new THREE.Color(COLORS.bg)
    scene.fog = new THREE.Fog(COLORS.bg, 15, 30)

    const w = canvasRef.value.clientWidth
    const h = canvasRef.value.clientHeight
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.set(8, 6, 12)
    camera.lookAt(0, 0, 0)

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: true,
    })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 3
    controls.maxDistance = 30
    controls.maxPolarAngle = Math.PI / 2.1
    controls.target.set(0, 0.5, 0)
    controls.update()

    setupLights()
    createFloor()
    createExhibits()
    animate()

    // Resize
    window.addEventListener("resize", onResize)
  }

  function setupLights() {
    if (!scene) return
    const ambient = new THREE.AmbientLight(0x222244, 0.4)
    scene.add(ambient)

    const mainLight = new THREE.DirectionalLight(0xffeedd, 2)
    mainLight.position.set(5, 10, 7)
    mainLight.castShadow = true
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.6)
    fillLight.position.set(-5, 3, -5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x6c5ce7, 0.4)
    rimLight.position.set(0, -2, 8)
    scene.add(rimLight)

    // Ambient glow circles
    for (let i = 0; i < 3; i++) {
      const glow = new THREE.PointLight(COLORS.primary, 0.5, 10)
      glow.position.set(-3 + i * 3, 0.2, 0)
      scene.add(glow)
    }
  }

  function createFloor() {
    if (!scene) return
    const floorGeo = new THREE.PlaneGeometry(30, 30)
    const floorMat = new THREE.MeshStandardMaterial({
      color: COLORS.floor,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.01
    floor.receiveShadow = true
    scene.add(floor)

    // Grid helper
    const grid = new THREE.GridHelper(28, 28, COLORS.grid, COLORS.grid)
    grid.position.y = 0
    scene.add(grid)
  }

  function createExhibits() {
    if (!scene || !items.length) return

    const total = items.length
    const radius = 4 + total * 0.5

    items.forEach((item, i) => {
      const angle = (i / total) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      // Pedestal
      const pedGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.1, 16)
      const pedMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.3,
        metalness: 0.7,
        emissive: new THREE.Color(COLORS.primary),
        emissiveIntensity: 0.05,
      })
      const pedestal = new THREE.Mesh(pedGeo, pedMat)
      pedestal.position.set(x, 0.05, z)
      pedestal.receiveShadow = true
      pedestal.castShadow = true
      scene!.add(pedestal)

      // Central object - geometry based on category
      let obj: THREE.Mesh
      const catIdx = ["rendering", "ai", "procedural", "xr", "tool", "game"].indexOf(item.category)
      const geo =
        catIdx === 0
          ? new THREE.IcosahedronGeometry(0.5, 2)
          : catIdx === 1
          ? new THREE.OctahedronGeometry(0.5)
          : catIdx === 2
          ? new THREE.TorusKnotGeometry(0.35, 0.15, 48, 16)
          : catIdx === 3
          ? new THREE.TorusGeometry(0.4, 0.15, 16, 32)
          : catIdx === 4
          ? new THREE.BoxGeometry(0.5, 0.5, 0.5)
          : new THREE.DodecahedronGeometry(0.45)

      const mat = new THREE.MeshPhysicalMaterial({
        color: COLORS.primary,
        emissive: new THREE.Color(COLORS.primary),
        emissiveIntensity: 0.2,
        metalness: 0.3,
        roughness: 0.4,
        clearcoat: 0.3,
        transparent: true,
        opacity: 0.9,
      })
      obj = new THREE.Mesh(geo, mat)
      obj.position.set(x, 0.8, z)
      obj.castShadow = true
      obj.userData = { angle, speed: 0.3 + Math.random() * 0.3, hoverOffset: 0 }
      scene!.add(obj)

      // Glow ring
      const ringGeo = new THREE.RingGeometry(0.6, 0.75, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: COLORS.primary,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.set(x, 0.12, z)
      ring.rotation.x = -Math.PI / 2
      scene!.add(ring)

      exhibitMeshes.push(obj)
      exhibitData.set(obj, item)
    })
  }

  // --- Raycaster ---
  function onMouseMove(event: MouseEvent) {
    if (!renderer) return
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
  }

  function onClick(event: MouseEvent) {
    if (!camera || !scene) return
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(exhibitMeshes)
    if (intersects.length > 0) {
      const item = exhibitData.get(intersects[0].object as THREE.Mesh)
      if (item) onSelect(item)
    }
  }

  // --- Animation ---
  function animate() {
    animationId = requestAnimationFrame(animate)
    if (!scene || !camera || !controls) return

    // Animate exhibits
    exhibitMeshes.forEach((mesh, i) => {
      const data = mesh.userData
      mesh.rotation.y += 0.005 * data.speed
      mesh.position.y = 0.8 + Math.sin(Date.now() * 0.001 * data.speed + i) * 0.08
      mesh.material.emissiveIntensity = 0.15 + Math.sin(Date.now() * 0.001 + i) * 0.1
    })

    controls.update()
    renderer!.render(scene, camera)
  }

  function onResize() {
    if (!canvasRef?.value || !camera || !renderer) return
    const w = canvasRef.value.clientWidth
    const h = canvasRef.value.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  // --- Public ---
  function dispose() {
    if (animationId) cancelAnimationFrame(animationId)
    window.removeEventListener("resize", onResize)
    renderer?.dispose()
  }

  return { init, dispose, onMouseMove, onClick }
}
