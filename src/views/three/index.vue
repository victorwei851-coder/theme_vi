<script setup lang="ts">
// @ts-nocheck
// 该组件由 villa-garden.html 组件化而来：Three.js 场景逻辑放在 onMounted，
// 卸载时清理；视角切换 / 环绕改用 Vue 响应式状态与事件绑定。
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Sky } from 'three/addons/objects/Sky.js'
import { getSceneColors, themeColor } from '@/utils/themeKey'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const activeView = ref('overview')
const autoRotate = ref(false)

// 在 onMounted 中赋值，供模板事件处理函数（外层）访问
let renderer: any = null
let scene: any = null
let camera: any = null
let controls: any = null
let tween: any = null
let views: any = {}
const swayCrowns: any[] = []
let animationId = 0
let resizeHandler: (() => void) | null = null
let themeObserver: MutationObserver | null = null

// 视角切换（由模板按钮调用）
function setView(name: string) {
  if (!camera || !controls) return
  activeView.value = name
  const v = views[name]
  tween = {
    start: performance.now(),
    fromP: camera.position.clone(),
    toP: new THREE.Vector3(...v.p),
    fromT: controls.target.clone(),
    toT: new THREE.Vector3(...v.t),
  }
  controls.autoRotate = false
  autoRotate.value = false
}

// 环绕模式开关
function toggleRotate() {
  if (!controls) return
  controls.autoRotate = !controls.autoRotate
  autoRotate.value = controls.autoRotate
  tween = null
}

onMounted(() => {
  const canvas = canvasRef.value!
  const W = window.innerWidth
  const H = window.innerHeight

  /* 基础场景 */
  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xcbd9d7, 72, 170)
  camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 450)
  camera.position.set(37, 25, 43)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setSize(W, H)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.93

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.065
  controls.target.set(0, 3.8, -2)
  controls.minDistance = 7
  controls.maxDistance = 105
  controls.maxPolarAngle = Math.PI / 2.04
  controls.autoRotateSpeed = 0.45

  /* 可复现的随机数 */
  let seed = 20261102
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  function rand(a: number, b: number) { return a + (b - a) * rnd() }

  /* 程序化自然材质 */
  function canvasTexture(kind: string, size = 256) {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const bases: any = { grass: '#6f7f58', plaster: '#ded5c2', stone: '#b9ae98', roof: '#9a5744', wood: '#79543b', bark: '#5c4b3b', gravel: '#bcb4a4', soil: '#62513d' }
    ctx.fillStyle = bases[kind] || '#aaaaaa'
    ctx.fillRect(0, 0, size, size)
    if (kind === 'roof') {
      for (let y = 0; y < size; y += 24) {
        const offset = (y / 24) % 2 ? 12 : 0
        for (let x = -24; x < size + 24; x += 24) {
          const v = Math.floor(rand(-13, 14))
          ctx.fillStyle = `rgb(${151 + v},${82 + v * 0.55},${61 + v * 0.35})`
          ctx.fillRect(x + offset + 1, y + 1, 22, 21)
          ctx.strokeStyle = 'rgba(71,38,29,.32)'
          ctx.strokeRect(x + offset + 1, y + 1, 22, 21)
          ctx.fillStyle = 'rgba(255,220,190,.10)'
          ctx.fillRect(x + offset + 3, y + 3, 2, 16)
        }
      }
    } else if (kind === 'wood') {
      for (let x = 0; x < size; x += 32) {
        ctx.fillStyle = x % 64 ? 'rgba(45,24,13,.08)' : 'rgba(255,224,181,.05)'
        ctx.fillRect(x, 0, 30, size)
        ctx.strokeStyle = 'rgba(44,25,15,.28)'
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke()
        for (let i = 0; i < 12; i++) {
          ctx.strokeStyle = 'rgba(48,28,17,.12)'
          ctx.beginPath()
          const xx = x + rand(3, 28), yy = rand(0, size)
          ctx.moveTo(xx, yy); ctx.bezierCurveTo(xx + 5, yy + 12, xx - 4, yy + 28, xx + 2, yy + 43); ctx.stroke()
        }
      }
    } else if (kind === 'bark') {
      for (let x = 0; x < size; x += 9) {
        ctx.strokeStyle = `rgba(30,22,16,${rand(0.12, 0.32)})`
        ctx.lineWidth = rand(1, 3)
        ctx.beginPath(); ctx.moveTo(x + rand(-2, 2), 0)
        for (let y = 0; y < size; y += 18) ctx.lineTo(x + Math.sin(y * 0.08 + x) * rand(1, 3), y)
        ctx.stroke()
      }
      for (let i = 0; i < 45; i++) {
        ctx.strokeStyle = 'rgba(205,183,146,.12)'
        ctx.beginPath(); const y = rand(0, size); ctx.moveTo(rand(0, size * 0.3), y); ctx.lineTo(rand(size * 0.6, size), y + rand(-3, 3)); ctx.stroke()
      }
    } else if (kind === 'stone') {
      ctx.strokeStyle = 'rgba(83,75,61,.22)'; ctx.lineWidth = 2
      for (let y = 0; y < size; y += 42) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke()
        const off = (y / 42) % 2 ? 35 : 0
        for (let x = off; x < size; x += 70) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 42); ctx.stroke() }
      }
    }
    const dots = kind === 'grass' ? 5200 : 1900
    for (let i = 0; i < dots; i++) {
      const light = rnd() > 0.48
      ctx.fillStyle = light ? `rgba(255,255,235,${rand(0.015, 0.09)})` : `rgba(24,34,20,${rand(0.015, 0.10)})`
      const x = rnd() * size, y = rnd() * size
      if (kind === 'grass') {
        ctx.strokeStyle = ctx.fillStyle; ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + rand(-1, 1), y); ctx.stroke()
      } else ctx.fillRect(x, y, rand(0.4, 2), rand(0.4, 2))
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    return t
  }
  const textures: any = {}
  for (const k of ['grass', 'plaster', 'stone', 'roof', 'wood', 'bark', 'gravel', 'soil']) textures[k] = canvasTexture(k, 512)
  textures.grass.repeat.set(28, 28)
  textures.plaster.repeat.set(3, 2)
  textures.stone.repeat.set(3, 2)
  textures.roof.repeat.set(5, 4)
  textures.wood.repeat.set(2, 2)
  textures.bark.repeat.set(2, 5)
  textures.gravel.repeat.set(8, 8)
  textures.soil.repeat.set(3, 3)

  function waterNormalTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(256, 256)
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4
      img.data[i] = 128 + Math.sin(x * 0.19 + y * 0.07) * 17 + Math.sin(x * 0.047 - y * 0.11) * 9
      img.data[i + 1] = 128 + Math.cos(y * 0.16 - x * 0.06) * 16 + Math.sin(y * 0.05 + x * 0.09) * 8
      img.data[i + 2] = 242; img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t
  }
  const waterNormal = waterNormalTexture()

  // 当前主题下的景物配色（树叶 / 瓦片 / 木作 / 坐垫 / 陶罐 等）
  const sceneColors = getSceneColors()

  function standard(color: number, opts: any = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, envMapIntensity: 0.45, ...opts }) }
  const M: any = {
    grass: standard(0xf0f2e9, { map: textures.grass, bumpMap: textures.grass, bumpScale: 0.045, roughness: 1 }),
    wall: standard(0xffffff, { map: textures.plaster, bumpMap: textures.plaster, bumpScale: 0.032, roughness: 0.94 }),
    wallWarm: standard(0xe6d9c5, { map: textures.plaster, bumpMap: textures.plaster, bumpScale: 0.028, roughness: 0.95 }),
    stone: standard(0xf2eee5, { map: textures.stone, bumpMap: textures.stone, bumpScale: 0.065, roughness: 0.93 }),
    stoneLight: standard(0xd8cfbd, { roughness: 0.9 }),
    stoneDark: standard(0x817b6e, { roughness: 0.98 }),
    roof: standard(0xffffff, { map: textures.roof, bumpMap: textures.roof, bumpScale: 0.085, roughness: 0.86 }),
    roofDark: standard(0x5c4136, { roughness: 0.9 }),
    wood: standard(0xffffff, { map: textures.wood, bumpMap: textures.wood, bumpScale: 0.055, roughness: 0.76 }),
    woodDark: standard(0x766454, { map: textures.wood, bumpMap: textures.wood, bumpScale: 0.045, roughness: 0.82 }),
    metal: standard(0x303633, { metalness: 0.78, roughness: 0.3, envMapIntensity: 0.9 }),
    brass: standard(0xb69352, { metalness: 0.82, roughness: 0.24, envMapIntensity: 1.1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x9fb5b7, roughness: 0.065, metalness: 0.08, transparent: true, opacity: 0.82, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.35 }),
    darkGlass: standard(0x243537, { roughness: 0.15, metalness: 0.25, envMapIntensity: 1 }),
    curtain: standard(0xd8cbb5, { roughness: 1 }),
    gravel: standard(0xf0ede6, { map: textures.gravel, bumpMap: textures.gravel, bumpScale: 0.075, roughness: 1 }),
    soil: standard(0xd6cabb, { map: textures.soil, bumpMap: textures.soil, bumpScale: 0.06, roughness: 1 }),
    bark: standard(0xe0d5c7, { map: textures.bark, bumpMap: textures.bark, bumpScale: 0.12, roughness: 1 }),
    leaf: [standard(0x3e5938), standard(0x4d6840), standard(0x5c7348), standard(0x314b34)],
    blossom: [standard(0xd6a4a7), standard(0xe3bebc), standard(0xc98594)],
    white: standard(0xe8e3d8),
    cushion: standard(0xbfb39d, { roughness: 1 }),
    terracotta: standard(0x9a664d, { roughness: 0.9 }),
    lamp: standard(0xffe2a2, { emissive: 0xffc66f, emissiveIntensity: 0.65 }),
    water: new THREE.MeshPhysicalMaterial({ color: 0x4b858a, roughness: 0.075, metalness: 0.12, transparent: true, opacity: 0.88, clearcoat: 1, clearcoatRoughness: 0.035, normalMap: waterNormal, normalScale: new THREE.Vector2(0.23, 0.23), ior: 1.333, envMapIntensity: 1.45 }),
    poolTile: standard(0x6e9491, { roughness: 0.38 }),
  }

  // 应用主题色变量到共享材质（树叶 / 瓦片 / 木作 / 坐垫 / 陶罐 / 窗台花）
  // 带贴图的 roof/wood/woodDark 用浅色叠加，避免与贴图相乘过暗
  M.roof.side = THREE.DoubleSide
  M.leaf.forEach((m: any, i: number) => m.color.set(sceneColors.leaf[i]))
  M.roof.color.set(sceneColors.roofTint)
  M.roofDark.color.set(sceneColors.roofDark)
  M.wood.color.set(sceneColors.woodTint)
  M.woodDark.color.set(sceneColors.woodDarkTint)
  M.cushion.color.set(sceneColors.cushion)
  M.terracotta.color.set(sceneColors.terracotta)
  M.blossom.forEach((m: any, i: number) => m.color.set(sceneColors.blossom[i]))

  function addMesh(geo: any, material: any, parent = scene, x = 0, y = 0, z = 0, shadows = true) {
    const m = new THREE.Mesh(geo, material)
    m.position.set(x, y, z)
    m.castShadow = shadows
    m.receiveShadow = shadows
    parent.add(m)
    return m
  }
  function box(w: number, h: number, d: number, material: any, parent = scene, x = 0, y = 0, z = 0) { return addMesh(new THREE.BoxGeometry(w, h, d), material, parent, x, y, z) }
  function cyl(rt: number, rb: number, h: number, material: any, parent = scene, x = 0, y = 0, z = 0, seg = 16) { return addMesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, parent, x, y, z) }
  function ball(r: number, material: any, parent = scene, x = 0, y = 0, z = 0, detail = 1) { return addMesh(new THREE.IcosahedronGeometry(r, detail), material, parent, x, y, z) }
  function beamBetween(a: any, b: any, radius: number, material: any, parent = scene, segments = 8) {
    const dir = new THREE.Vector3().subVectors(b, a)
    const m = addMesh(new THREE.CylinderGeometry(radius * 0.78, radius, dir.length(), segments), material, parent)
    m.position.copy(a).add(b).multiplyScalar(0.5)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    return m
  }

  /* 天空与午后光照 */
  const sky = new Sky()
  sky.scale.setScalar(400)
  scene.add(sky)
  sky.material.uniforms.turbidity.value = 2.8
  sky.material.uniforms.rayleigh.value = 2.15
  sky.material.uniforms.mieCoefficient.value = 0.0035
  sky.material.uniforms.mieDirectionalG.value = 0.78
  const sun = new THREE.DirectionalLight(0xffe7c7, 2.25)
  sun.position.set(-32, 43, 28)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  sun.shadow.camera.left = -48; sun.shadow.camera.right = 48
  sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -48
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 130
  sun.shadow.bias = -0.00015; sun.shadow.normalBias = 0.035
  scene.add(sun)
  sky.material.uniforms.sunPosition.value.copy(sun.position)
  scene.add(new THREE.HemisphereLight(0xd7e5ef, 0x62644e, 1.08))
  const fill = new THREE.DirectionalLight(0xc9dded, 0.34)
  fill.position.set(24, 18, -30); scene.add(fill)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(scene, 0.055, 0.1, 500)
  scene.environment = environment.texture
  pmrem.dispose()

  /* 草地基底 */
  const ground = addMesh(new THREE.CircleGeometry(105, 96), M.grass, scene, 0, -0.08, 0)
  ground.rotation.x = -Math.PI / 2
  ground.castShadow = false
  const courtyard = box(62, 0.12, 56, M.grass, scene, 0, -0.01, 0)
  courtyard.castShadow = false

  /* 建筑工具 */
  function hipRoof(w: number, d: number, y: number, h: number, parent: any, x = 0, z = 0) {
    const r = Math.max(0, (w - d) / 2)
    const V = [
      [-w / 2, y, d / 2], [w / 2, y, d / 2], [r, y + h, 0], [-w / 2, y, d / 2], [r, y + h, 0], [-r, y + h, 0],
      [w / 2, y, -d / 2], [-w / 2, y, -d / 2], [-r, y + h, 0], [w / 2, y, -d / 2], [-r, y + h, 0], [r, y + h, 0],
      [-w / 2, y, -d / 2], [-w / 2, y, d / 2], [-r, y + h, 0], [w / 2, y, d / 2], [w / 2, y, -d / 2], [r, y + h, 0],
    ]
    const pos: number[] = [], uv: number[] = []
    for (const v of V) { pos.push(...v); uv.push(v[0] / w + 0.5, v[2] / d + 0.5) }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    geo.computeVertexNormals()
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g)
    addMesh(geo, M.roof, g)
    box(w + 0.12, 0.18, 0.16, M.roofDark, g, 0, y - 0.04, d / 2)
    box(w + 0.12, 0.18, 0.16, M.roofDark, g, 0, y - 0.04, -d / 2)
    box(0.16, 0.18, d + 0.12, M.roofDark, g, w / 2, y - 0.04, 0)
    box(0.16, 0.18, d + 0.12, M.roofDark, g, -w / 2, y - 0.04, 0)
    for (const s of [-1, 1]) {
      const gutter = cyl(0.065, 0.065, w + 0.25, M.metal, g, 0, y - 0.14, s * (d / 2 + 0.06), 10); gutter.rotation.z = Math.PI / 2
      const sideGutter = cyl(0.065, 0.065, d + 0.25, M.metal, g, s * (w / 2 + 0.06), y - 0.14, 0, 10); sideGutter.rotation.x = Math.PI / 2
    }
    if (r > 0.1) { const ridge = cyl(0.13, 0.13, r * 2 + 0.35, M.roofDark, g, 0, y + h + 0.06, 0, 12); ridge.rotation.z = Math.PI / 2 }
    return g
  }
  function createWindow(w = 1.45, h = 1.75, shutters = false, flowers = false) {
    const g = new THREE.Group()
    box(w + 0.24, h + 0.24, 0.16, M.stoneLight, g, 0, 0, 0)
    box(w, h, 0.19, M.darkGlass, g, 0, 0, 0.07)
    box(w - 0.15, h - 0.15, 0.08, M.glass, g, 0, 0, 0.18)
    box(0.065, h - 0.08, 0.12, M.white, g, 0, 0, 0.25)
    box(w - 0.08, 0.065, 0.12, M.white, g, 0, 0.08, 0.25)
    box(w + 0.38, 0.13, 0.36, M.stoneLight, g, 0, -h / 2 - 0.14, 0.07)
    box(w + 0.32, 0.12, 0.26, M.stoneLight, g, 0, h / 2 + 0.13, 0.03)
    if (shutters) {
      for (const s of [-1, 1]) {
        const sg = new THREE.Group(); sg.position.set(s * (w / 2 + 0.38), 0, 0.03); g.add(sg)
        box(0.5, h + 0.05, 0.1, M.woodDark, sg)
        for (let i = 0; i < 8; i++) { const slat = box(0.42, 0.055, 0.08, M.wood, sg, 0, -h / 2 + 0.16 + i * (h - 0.25) / 7, 0.08); slat.rotation.x = 0.18 }
      }
    }
    if (flowers) {
      box(w * 0.9, 0.25, 0.34, M.terracotta, g, 0, -h / 2 - 0.34, 0.28)
      for (let i = 0; i < 7; i++) {
        const f = ball(0.13, M.leaf[i % M.leaf.length], g, -w * 0.36 + i * w * 0.12, -h / 2 - 0.16, 0.31, 1)
        f.scale.set(1, 0.75, 1)
        if (i % 2 === 0) ball(0.065, M.blossom[i % 3], g, -w * 0.36 + i * w * 0.12, -h / 2 - 0.04, 0.34, 1)
      }
    }
    return g
  }
  function placeWindow(parent: any, x: number, y: number, z: number, rot = 0, w = 1.45, h = 1.75, shutters = false, flowers = false) {
    const g = createWindow(w, h, shutters, flowers); g.position.set(x, y, z); g.rotation.y = rot; parent.add(g); return g
  }
  function quoins(parent: any, w: number, d: number, y0: number, height: number) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      for (let i = 0; i < Math.floor(height / 0.43); i++) {
        const wide = i % 2 === 0
        box(wide ? 0.58 : 0.38, 0.32, 0.18, M.stoneLight, parent, sx * (w / 2 - 0.18), y0 + 0.25 + i * 0.43, sz * (d / 2 + 0.055))
        box(0.18, 0.32, wide ? 0.38 : 0.58, M.stoneLight, parent, sx * (w / 2 + 0.055), y0 + 0.25 + i * 0.43, sz * (d / 2 - 0.18))
      }
    }
  }

  /* 三层别墅：统一暖石、灰泥和陶瓦 */
  const house = new THREE.Group(); house.position.z = -4.5; scene.add(house)
  const h1 = 3.15, h2 = 3, h3 = 2.75, base = 0.45, roofY = base + h1 + h2 + h3
  box(14.5, 0.5, 10.5, M.stone, house, 0, 0.25, 0)
  box(14, h1, 10, M.wall, house, 0, base + h1 / 2, 0)
  box(12.8, h2, 8.8, M.wallWarm, house, 0, base + h1 + h2 / 2, 0)
  box(10, h3, 6, M.wall, house, 0, base + h1 + h2 + h3 / 2, 0)
  box(14.35, 0.2, 10.35, M.stoneLight, house, 0, base + h1 - 0.04, 0)
  box(13.15, 0.22, 9.15, M.stoneLight, house, 0, base + h1 + h2 - 0.03, 0)
  box(14.6, 0.24, 10.6, M.stoneLight, house, 0, roofY - 0.1, 0)
  quoins(house, 14, 10, base, h1)
  quoins(house, 12.8, 8.8, base + h1, h2)
  quoins(house, 10, 6, base + h1 + h2, h3)
  hipRoof(15.2, 11.2, roofY, 2.75, house)

  /* 主入口：门扇、门环、门廊、台阶 */
  box(2.15, 2.85, 0.22, M.stoneLight, house, 0, 1.75, 5.08)
  box(1.72, 2.6, 0.18, M.woodDark, house, 0, 1.68, 5.23)
  for (const x of [-0.43, 0.43]) for (const y of [1.05, 1.95]) box(0.62, 0.66, 0.08, M.wood, house, x, y, 5.34)
  box(1.3, 0.38, 0.08, M.glass, house, 0, 2.65, 5.34)
  ball(0.065, M.brass, house, 0.57, 1.62, 5.42, 2)
  for (let i = 0; i < 3; i++) box(3.9 - i * 0.35, 0.16, 1.25 - i * 0.25, M.stoneLight, house, 0, 0.08 + i * 0.12, 6.15 - i * 0.12)
  for (const s of [-1, 1]) {
    cyl(0.16, 0.2, 2.7, M.stoneLight, house, s * 1.55, 1.75, 6.65, 20)
    cyl(0.28, 0.28, 0.14, M.stoneLight, house, s * 1.55, 0.43, 6.65, 20)
    box(0.5, 0.16, 0.5, M.stoneLight, house, s * 1.55, 3.08, 6.65)
  }
  hipRoof(4.25, 2.65, 3.2, 0.82, house, 0, 6.05)
  for (const s of [-1, 1]) {
    box(0.24, 0.42, 0.18, M.metal, house, s * 1.42, 2.12, 5.3)
    box(0.16, 0.25, 0.12, M.lamp, house, s * 1.42, 2.12, 5.41)
  }

  /* 各层门窗与窗台花箱 */
  for (const x of [-4.4, 4.4]) placeWindow(house, x, 2.05, 5.08, 0, 1.65, 1.8, true, true)
  for (const s of [-1, 1]) for (const z of [-2.5, 2.2]) placeWindow(house, s * 7.06, 2.05, z, s * Math.PI / 2, 1.35, 1.7, true, false)
  for (const x of [-4.2, 4.2]) placeWindow(house, x, 2.05, -5.08, Math.PI, 1.5, 1.75, false, false)
  for (const x of [-3.7, 3.7]) {
    placeWindow(house, x, 5.05, 4.47, 0, 1.55, 1.85, true, true)
    placeWindow(house, x, 5.05, -4.47, Math.PI, 1.45, 1.75, false, false)
  }
  for (const s of [-1, 1]) for (const z of [-2, 2]) placeWindow(house, s * 6.46, 5.05, z, s * Math.PI / 2, 1.25, 1.7, false, false)
  placeWindow(house, 0, 8.05, 3.08, 0, 2.05, 2.05, false, false)
  for (const x of [-3.2, 3.2]) placeWindow(house, x, 8.05, 3.08, 0, 1.25, 1.65, false, true)
  for (const s of [-1, 1]) placeWindow(house, s * 5.07, 8.05, 0, s * Math.PI / 2, 1.35, 1.7, false, false)

  /* 三层阳台与栏杆 */
  box(9.6, 0.24, 2.05, M.stoneLight, house, 0, 6.62, 3.85)
  for (const x of [-4.55, 4.55]) box(0.13, 1.05, 0.13, M.metal, house, x, 7.22, 4.76)
  for (let i = 0; i <= 24; i++) box(0.045, 0.9, 0.045, M.metal, house, -4.55 + i * 9.1 / 24, 7.17, 4.77)
  box(9.25, 0.075, 0.09, M.metal, house, 0, 7.66, 4.77)
  for (const s of [-1, 1]) {
    box(0.07, 0.07, 1.75, M.metal, house, s * 4.55, 7.66, 3.9)
    for (let i = 0; i < 5; i++) box(0.045, 0.9, 0.045, M.metal, house, s * 4.55, 7.17, 3.15 + i * 0.36)
  }

  /* 烟囱、雨水管 */
  box(1.15, 2.8, 1.05, M.stone, house, 3.6, roofY + 1.45, -1.6)
  box(1.42, 0.22, 1.32, M.roofDark, house, 3.6, roofY + 2.88, -1.6)
  for (const s of [-1, 1]) {
    cyl(0.055, 0.055, 8.9, M.metal, house, s * 6.85, 4.65, 5.13, 10)
    const elbow = cyl(0.06, 0.06, 0.55, M.metal, house, s * 6.85, 0.26, 5.35, 10); elbow.rotation.x = Math.PI / 2
  }

  /* 车库副楼 */
  const garage = new THREE.Group(); garage.position.set(10.25, 0, -0.5); house.add(garage)
  box(6.2, 0.42, 7.1, M.stone, garage, 0, 0.21, 0)
  box(6, 3.05, 6.8, M.wall, garage, 0, 1.75, 0)
  box(6.35, 0.2, 7.15, M.stoneLight, garage, 0, 3.25, 0)
  hipRoof(7, 7.8, 3.34, 1.65, garage)
  box(3.85, 2.45, 0.18, M.stoneLight, garage, 0, 1.52, 3.47)
  box(3.5, 2.2, 0.16, M.woodDark, garage, 0, 1.45, 3.59)
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) box(1.02, 0.32, 0.06, M.wood, garage, -1.12 + j * 1.12, 0.62 + i * 0.4, 3.7)
  placeWindow(garage, 0, 2.65, 3.58, 0, 1.1, 0.48, false, false)
  box(5.7, 0.12, 25, M.gravel, scene, 10.25, 0.06, 12.2)
  for (const s of [-1, 1]) box(0.18, 0.15, 25, M.stoneLight, scene, 10.25 + s * 2.82, 0.08, 12.2)

  /* 入口园路与车道细节 */
  box(4.2, 0.1, 26, M.gravel, scene, 0, 0.045, 14.1)
  for (const s of [-1, 1]) box(0.18, 0.16, 26, M.stoneLight, scene, s * 2.15, 0.08, 14.1)
  for (let i = 0; i < 17; i++) {
    const slab = box(3.65, 0.035, 0.055, M.stoneDark, scene, 0, 0.105, 2.2 + i * 1.45); slab.castShadow = false
  }
  for (const z of [7, 14, 21]) for (const s of [-1, 1]) {
    cyl(0.09, 0.12, 0.75, M.metal, scene, s * 2.65, 0.38, z, 10)
    cyl(0.15, 0.15, 0.22, M.lamp, scene, s * 2.65, 0.82, z, 12)
    cyl(0.19, 0.19, 0.06, M.metal, scene, s * 2.65, 0.96, z, 12)
  }

  /* 泳池、池岸和躺椅 */
  const pool = new THREE.Group(); pool.position.set(-14.2, 0, -2.2); scene.add(pool)
  box(12, 0.22, 9, M.stoneLight, pool, 0, 0.11, 0)
  box(9.6, 0.32, 6.6, M.poolTile, pool, 0, 0.22, 0)
  box(8.95, 0.18, 5.95, M.water, pool, 0, 0.43, 0)
  for (const s of [-1, 1]) {
    box(9.9, 0.18, 0.38, M.stoneLight, pool, 0, 0.47, s * 3.18)
    box(0.38, 0.18, 6.75, M.stoneLight, pool, s * 4.77, 0.47, 0)
  }
  for (let i = 0; i < 3; i++) box(2.1, 0.12, 0.65, M.poolTile, pool, -2.9, 0.34 - i * 0.06, -2.45 + i * 0.46)
  for (const x of [-0.35, 0.35]) {
    const rail = addMesh(new THREE.TorusGeometry(0.42, 0.035, 8, 20, Math.PI), M.metal, pool, 3.55 + x, 0.85, -2.95)
    rail.rotation.y = Math.PI / 2
  }
  function lounger(parent: any, x: number, z: number, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, 0.25, z); g.rotation.y = rot; parent.add(g)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.07, 0.45, 0.07, M.woodDark, g, sx * 0.38, 0.22, sz * 0.82)
    box(0.9, 0.12, 1.65, M.cushion, g, 0, 0.52, 0.25)
    const back = box(0.9, 0.12, 1.05, M.cushion, g, 0, 0.85, -0.82); back.rotation.x = -0.63
    box(1, 0.1, 2.85, M.wood, g, 0, 0.43, 0)
  }
  lounger(pool, -5.25, -1.8, Math.PI / 2); lounger(pool, -5.25, 1.1, Math.PI / 2)
  cyl(0.055, 0.055, 2.6, M.woodDark, pool, -5.1, 1.5, 3.25, 10)
  const umbrella = cyl(0, 1.65, 0.58, M.white, pool, -5.1, 2.82, 3.25, 24); umbrella.rotation.y = 0.2

  /* 有机花坛与石材收边 */
  function flowerBed(x: number, z: number, rx: number, rz: number) {
    const shape = new THREE.Shape()
    for (let i = 0; i <= 48; i++) {
      const a = i / 48 * Math.PI * 2, f = 1 + Math.sin(a * 3 + 0.7) * 0.055 + Math.cos(a * 5) * 0.035
      const px = Math.cos(a) * rx * f, py = Math.sin(a) * rz * f
      if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py)
    }
    const bed = addMesh(new THREE.ShapeGeometry(shape), M.soil, scene, x, 0.085, z)
    bed.rotation.x = -Math.PI / 2; bed.castShadow = false
    return bed
  }
  const bedDefs: number[][] = [[-8.3, 8.2, 3.7, 2.1], [6.2, 7.6, 2.5, 2], [-20.8, 6.2, 2.4, 3], [18.9, 14.3, 3.2, 2.1], [-6.2, 22.8, 3, 1.5], [6.1, 23.1, 2.6, 1.4], [-10, -12.7, 3.2, 1.5], [20, -10, 2.3, 3.1]]
  bedDefs.forEach((b) => flowerBed(b[0], b[1], b[2], b[3]))

  /* 花境：实例化花茎、花心与五片花瓣 */
  const flowers: any[] = []
  const palettes = [0xe7a6ac, 0xf0d487, 0xe9e3d3, 0xa99aba, 0xd6808d]
  function addFlowerPatch(cx: number, cz: number, rx: number, rz: number, count: number) {
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd())
      flowers.push({ x: cx + Math.cos(a) * rx * r, z: cz + Math.sin(a) * rz * r, h: rand(0.28, 0.68), c: Math.floor(rnd() * palettes.length), phase: rnd() * 6.28 })
    }
  }
  bedDefs.forEach((b, i) => addFlowerPatch(b[0], b[1], b[2] * 0.88, b[3] * 0.86, i < 4 ? 62 : 38))
  const stemGeo = new THREE.CylinderGeometry(0.013, 0.019, 1, 5)
  const stemMesh = new THREE.InstancedMesh(stemGeo, standard(0x547143), flowers.length)
  const centerMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 6, 4), standard(0xb89545), flowers.length)
  const dummy = new THREE.Object3D()
  flowers.forEach((f, i) => {
    dummy.position.set(f.x, 0.1 + f.h / 2, f.z); dummy.scale.set(1, f.h, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); stemMesh.setMatrixAt(i, dummy.matrix)
    dummy.position.set(f.x, 0.1 + f.h, f.z); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); centerMesh.setMatrixAt(i, dummy.matrix)
  })
  stemMesh.castShadow = true; centerMesh.castShadow = true; scene.add(stemMesh, centerMesh)
  for (let c = 0; c < palettes.length; c++) {
    const list = flowers.filter((f) => f.c === c)
    const petals = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), standard(palettes[c]), list.length * 5)
    let n = 0
    for (const f of list) for (let p = 0; p < 5; p++) {
      const a = p / 5 * Math.PI * 2 + f.phase
      dummy.position.set(f.x + Math.cos(a) * 0.07, 0.1 + f.h, f.z + Math.sin(a) * 0.07)
      dummy.scale.set(0.085, 0.032, 0.055); dummy.rotation.set(0, -a, 0.15 * Math.sin(a)); dummy.updateMatrix(); petals.setMatrixAt(n++, dummy.matrix)
    }
    petals.castShadow = true; scene.add(petals)
  }

  /* 透明叶片纹理与实例化枝叶，替代球状卡通树冠 */
  function foliageMaterial(flowering = false) {
    const c = document.createElement('canvas'); c.width = c.height = 256
    const ctx = c.getContext('2d')!
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 112
      const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r
      const hue = rand(76, 103), sat = rand(20, 38), light = rand(20, 39)
      ctx.fillStyle = `hsl(${hue},${sat}%,${light}%)`
      ctx.beginPath(); ctx.ellipse(x, y, rand(4, 10), rand(1.6, 3.8), rand(0, Math.PI), 0, Math.PI * 2); ctx.fill()
      if (i % 4 === 0) {
        ctx.strokeStyle = 'rgba(210,220,165,.18)'; ctx.lineWidth = 0.55
        ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.stroke()
      }
    }
    if (flowering) for (let i = 0; i < 52; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 105, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r
      for (let p = 0; p < 5; p++) {
        const pa = p / 5 * Math.PI * 2
        ctx.fillStyle = p % 2 ? 'rgba(224,164,174,.94)' : 'rgba(239,195,196,.95)'
        ctx.beginPath(); ctx.ellipse(x + Math.cos(pa) * 2.4, y + Math.sin(pa) * 2.4, 2.7, 1.8, pa, 0, Math.PI * 2); ctx.fill()
      }
      ctx.fillStyle = 'rgba(211,183,113,.95)'; ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill()
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.3, side: THREE.DoubleSide, shadowSide: THREE.DoubleSide, roughness: 0.94, metalness: 0, envMapIntensity: 0.28 })
  }
  const leafMaterials = [foliageMaterial(), foliageMaterial(), foliageMaterial(), foliageMaterial(true)]
  leafMaterials.forEach((m: any, i: number) => m.color.set(sceneColors.leafLight[i]))
  const leafCardGeo = new THREE.PlaneGeometry(1, 1)
  function leafCloud(count: number, rx: number, ry: number, rz: number, flowering = false) {
    const cloud = new THREE.InstancedMesh(leafCardGeo, leafMaterials[flowering ? 3 : Math.floor(rnd() * 3)], count)
    for (let i = 0; i < count; i++) {
      let x: number, y: number, z: number
      do { x = rand(-1, 1); y = rand(-1, 1); z = rand(-1, 1) } while (x * x + y * y + z * z > 1)
      const size = rand(0.62, 1.18) * Math.max(0.42, rx * 0.62)
      dummy.position.set(x * rx, y * ry, z * rz)
      dummy.rotation.set(rand(-1.25, 1.25), rand(0, Math.PI * 2), rand(-1.1, 1.1))
      dummy.scale.set(size * rand(0.8, 1.3), size, 1); dummy.updateMatrix(); cloud.setMatrixAt(i, dummy.matrix)
      cloud.setColorAt(i, new THREE.Color(rand(0.8, 0.98), rand(0.86, 1), rand(0.77, 0.94)))
    }
    cloud.instanceMatrix.needsUpdate = true; cloud.instanceColor!.needsUpdate = true
    cloud.castShadow = true; cloud.receiveShadow = true
    return cloud
  }

  /* 灌木、绿篱和景观石 */
  function bush(x: number, z: number, s = 1, parent = scene) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g)
    const cloud = leafCloud(28, 0.68, 0.52, 0.6, false); cloud.position.y = 0.53; g.add(cloud)
    for (let i = 0; i < 3; i++) beamBetween(new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(rand(-0.35, 0.35), rand(0.45, 0.8), rand(-0.3, 0.3)), 0.025, M.bark, g, 6)
    return g
  }
  function hedgeLine(x1: number, z1: number, x2: number, z2: number, spacing = 0.95) {
    const len = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(len / spacing)
    for (let i = 0; i <= n; i++) bush(x1 + (x2 - x1) * i / n, z1 + (z2 - z1) * i / n, rand(0.72, 0.92))
  }
  for (let i = 0; i < 9; i++) bush(-8.5 + i * 2.05, 1.25, rand(0.7, 1))
  for (let i = 0; i < 8; i++) bush(-20.5 + i * 1.7, -9.8, rand(0.85, 1.15))
  for (let i = 0; i < 7; i++) bush(17.2 + i * 1.4, -7.8, rand(0.8, 1.1))
  for (const [x, z] of [[-23, 12], [-18, 17], [22, 18], [23, 4], [-24, -15], [26, -18], [-4, 25], [5, 25]]) bush(x, z, 1.35)
  hedgeLine(-29, 25, -8, 25, 1.05)
  hedgeLine(16, 25, 29, 25, 1.05)
  hedgeLine(-24, -15, -24, 12, 1.1)
  hedgeLine(-23, -25, 23, -25, 1.15)
  for (const [x, z, s] of [[11, 7, 0.9], [19, 7, 1], [11, 14, 0.85], [20, 12, 1.05], [-22, 3, 1], [-9, -8, 0.8], [7, -10, 0.9], [22, -16, 1.1], [-20, 19, 0.9], [20, 20, 0.9]]) bush(x, z, s)
  for (const b of bedDefs) for (let i = 0; i < 3; i++) bush(b[0] + rand(-b[2] * 0.65, b[2] * 0.65), b[1] + rand(-b[3] * 0.55, b[3] * 0.55), rand(0.28, 0.42))
  const rockGeo = new THREE.DodecahedronGeometry(1, 0)
  for (let i = 0; i < 32; i++) {
    const b = bedDefs[i % bedDefs.length], a = rnd() * Math.PI * 2
    const rock = addMesh(rockGeo, M.stoneDark, scene, b[0] + Math.cos(a) * b[2], 0.16, b[1] + Math.sin(a) * b[3])
    rock.scale.set(rand(0.16, 0.35), rand(0.1, 0.22), rand(0.18, 0.4)); rock.rotation.set(rnd(), rnd() * 6, rnd())
  }

  /* 乔木：分枝、非规则树冠与花树 */
  function tree(x: number, z: number, s = 1, flowering = false) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g)
    cyl(0.15, 0.36, 3.9, M.bark, g, 0, 1.95, 0, 12)
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + rand(-0.35, 0.35), r = rand(0.9, 1.9), y = rand(3.4, 4.8)
      beamBetween(new THREE.Vector3(0, 2.15 + i * 0.11, 0), new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), rand(0.055, 0.105), M.bark, g, 8)
      if (i % 2 === 0) beamBetween(new THREE.Vector3(Math.cos(a) * r * 0.65, y - 0.35, Math.sin(a) * r * 0.65), new THREE.Vector3(Math.cos(a + 0.35) * r * 1.18, y + 0.45, Math.sin(a + 0.35) * r * 1.18), 0.035, M.bark, g, 6)
    }
    const crown = new THREE.Group(); crown.position.y = 4.25; g.add(crown)
    const cloud = leafCloud(flowering ? 135 : 120, 2.25, 1.75, 2.05, flowering); cloud.position.y = 0.25; crown.add(cloud)
    swayCrowns.push({ g: crown, phase: rnd() * 6.28, amount: rand(0.003, 0.007) })
    return g
  }
  [
    [-26, -20, 1.25, false], [-18, -22, 1.05, false], [-8, -23, 1.2, false], [5, -23, 1.05, false], [18, -22, 1.3, false], [27, -17, 1.1, false],
    [-27, -6, 1.15, false], [-27, 9, 1.25, false], [-24, 21, 1.05, true], [25, 23, 1.2, false], [27, 8, 1.15, false],
    [-14, 16, 1.05, true], [20, 3, 1.05, true], [-18, -12, 0.9, false], [16, -14, 1.1, false],
    [-22, 18, 0.82, false], [23, 17, 0.88, false], [-22, -2, 0.82, false], [24, -4, 0.85, false],
    [-20, -18, 0.78, false], [-13, -19, 0.72, true], [11, -19, 0.76, false], [21, -18, 0.8, false],
    [-17, 23, 0.7, true], [18, 24, 0.72, false],
  ].forEach((t) => tree(t[0], t[1], t[2], t[3]))
  /* 院外林带，弱化场景边界 */
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2, r = rand(39, 50)
    tree(Math.cos(a) * r, Math.sin(a) * r, rand(1.05, 1.65), i % 9 === 0)
  }

  /* 蜿蜒汀步连接茶亭 */
  function steppingPath(points: number[][], count: number) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], 0, p[1])))
    for (let i = 0; i < count; i++) {
      const p = curve.getPoint(i / (count - 1))
      const stone = cyl(rand(0.48, 0.65), rand(0.5, 0.68), 0.11, M.stoneLight, scene, p.x, 0.09, p.z, 7)
      stone.scale.z = rand(0.65, 0.9); stone.rotation.y = rnd() * Math.PI
    }
  }
  steppingPath([[1.7, 14], [5.5, 14.5], [9, 12.4], [11.7, 11]], 12)
  steppingPath([[-2, 8], [-5.5, 10], [-8, 12.5]], 7)

  /* 林下木质茶亭 */
  const tea = new THREE.Group(); tea.position.set(15, 0, 10.5); scene.add(tea)
  cyl(4.15, 4.15, 0.16, M.gravel, tea, 0, 0.08, 0, 48)
  cyl(3.45, 3.45, 0.2, M.wood, tea, 0, 0.25, 0, 48)
  for (const x of [-2.25, 2.25]) for (const z of [-1.85, 1.85]) {
    box(0.25, 3.55, 0.25, M.woodDark, tea, x, 2.05, z)
    box(0.42, 0.18, 0.42, M.stoneLight, tea, x, 0.38, z)
    beamBetween(new THREE.Vector3(x, 3.15, z), new THREE.Vector3(x * 0.72, 3.72, z), 0.085, M.wood, tea)
  }
  for (const z of [-1.95, 1.95]) box(5.25, 0.24, 0.2, M.woodDark, tea, 0, 3.79, z)
  for (const x of [-2.35, 2.35]) box(0.2, 0.24, 4.4, M.woodDark, tea, x, 3.79, 0)
  for (let i = 0; i < 12; i++) box(0.13, 0.16, 4.65, M.wood, tea, -2.5 + i * 5 / 11, 4.01, 0)
  /* 桌与四把圈椅 */
  cyl(1.02, 1.02, 0.13, M.woodDark, tea, 0, 1.18, 0, 32)
  cyl(0.15, 0.23, 0.82, M.woodDark, tea, 0, 0.73, 0, 16)
  cyl(0.58, 0.65, 0.12, M.woodDark, tea, 0, 0.35, 0, 24)
  function chair(a: number) {
    const g = new THREE.Group(); g.position.set(Math.sin(a) * 1.75, 0.32, Math.cos(a) * 1.75); g.rotation.y = a + Math.PI; tea.add(g)
    box(0.78, 0.12, 0.72, M.wood, g, 0, 0.48, 0)
    box(0.68, 0.09, 0.62, M.cushion, g, 0, 0.57, 0)
    for (const x of [-0.31, 0.31]) for (const z of [-0.27, 0.27]) box(0.07, 0.48, 0.07, M.woodDark, g, x, 0.24, z)
    for (const x of [-0.34, 0.34]) box(0.07, 0.85, 0.07, M.woodDark, g, x, 0.85, -0.3)
    const back = addMesh(new THREE.TorusGeometry(0.36, 0.045, 8, 24, Math.PI), M.woodDark, g, 0, 1.08, -0.28); back.rotation.z = Math.PI
    box(0.65, 0.32, 0.07, M.cushion, g, 0, 0.96, -0.3)
  }
  for (let i = 0; i < 4; i++) chair(i * Math.PI / 2 + Math.PI / 4)
  /* 茶盘、茶壶、茶杯 */
  cyl(0.62, 0.62, 0.035, M.wood, tea, 0, 1.27, 0, 32)
  const pot = ball(0.19, M.terracotta, tea, 0, 1.46, 0, 3); pot.scale.y = 0.82
  cyl(0.11, 0.14, 0.055, M.terracotta, tea, 0, 1.62, 0, 16)
  ball(0.035, M.woodDark, tea, 0, 1.67, 0, 2)
  beamBetween(new THREE.Vector3(0.13, 1.45, 0), new THREE.Vector3(0.36, 1.56, 0), 0.055, M.terracotta, tea, 12)
  const handle = addMesh(new THREE.TorusGeometry(0.17, 0.032, 8, 20, Math.PI * 1.45), M.terracotta, tea, -0.13, 1.47, 0); handle.rotation.y = Math.PI / 2
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2, x = Math.cos(a) * 0.43, z = Math.sin(a) * 0.43
    cyl(0.075, 0.055, 0.1, M.white, tea, x, 1.35, z, 16)
    cyl(0.063, 0.063, 0.008, standard(0x6f482b), tea, x, 1.405, z, 16)
  }
  /* 吊灯与攀援绿植 */
  beamBetween(new THREE.Vector3(0, 4, 0), new THREE.Vector3(0, 3.25, 0), 0.018, M.metal, tea)
  cyl(0.16, 0.27, 0.34, M.lamp, tea, 0, 3.08, 0, 12)
  cyl(0.29, 0.29, 0.06, M.metal, tea, 0, 2.89, 0, 12)
  for (const x of [-2.25, 2.25]) for (const z of [-1.85, 1.85]) {
    beamBetween(new THREE.Vector3(x, 0.4, z), new THREE.Vector3(x + rand(-0.15, 0.15), 3.9, z + rand(-0.15, 0.15)), 0.025, M.bark, tea, 6)
    for (const y of [1.25, 2.45, 3.75]) {
      const vine = leafCloud(y > 3 ? 42 : 24, y > 3 ? 0.75 : 0.38, y > 3 ? 0.34 : 0.55, y > 3 ? 0.72 : 0.38, true)
      vine.position.set(x, y, z); tea.add(vine)
    }
  }
  for (let i = 0; i < 5; i++) {
    const vine = leafCloud(28, 0.85, 0.28, 0.65, i % 2 === 0); vine.position.set(-1.8 + i * 0.9, 4.03, rand(-1.4, 1.4)); tea.add(vine)
  }

  /* 小型叠水景 */
  const fountain = new THREE.Group(); fountain.position.set(-8.5, 0, 13); scene.add(fountain)
  cyl(1.65, 1.8, 0.38, M.stone, fountain, 0, 0.19, 0, 40)
  cyl(1.4, 1.4, 0.08, M.water, fountain, 0, 0.42, 0, 40)
  cyl(0.24, 0.36, 1.05, M.stoneLight, fountain, 0, 0.85, 0, 20)
  cyl(0.85, 0.35, 0.18, M.stoneLight, fountain, 0, 1.36, 0, 32)
  cyl(0.72, 0.72, 0.045, M.water, fountain, 0, 1.47, 0, 32)
  ball(0.18, M.stoneLight, fountain, 0, 1.64, 0, 2)

  /* 围栏：矮石墙、铁艺和入口门柱 */
  function fenceSegment(x1: number, z1: number, x2: number, z2: number) {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), angle = -Math.atan2(dz, dx)
    const g = new THREE.Group(); g.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2); g.rotation.y = angle; scene.add(g)
    box(len, 0.52, 0.34, M.stone, g, 0, 0.26, 0)
    box(len, 0.09, 0.44, M.stoneLight, g, 0, 0.56, 0)
    box(len, 0.055, 0.055, M.metal, g, 0, 1.25, 0)
    box(len, 0.045, 0.045, M.metal, g, 0, 0.78, 0)
    const n = Math.floor(len / 0.46)
    for (let i = 0; i <= n; i++) box(0.035, 0.7, 0.035, M.metal, g, -len / 2 + i * len / n, 0.93, 0)
    const piers = Math.floor(len / 4)
    for (let i = 0; i <= piers; i++) {
      const x = -len / 2 + i * len / piers
      box(0.5, 1.35, 0.5, M.stone, g, x, 0.675, 0)
      box(0.65, 0.12, 0.65, M.stoneLight, g, x, 1.39, 0)
    }
  }
  fenceSegment(-31, -28, 31, -28); fenceSegment(-31, -28, -31, 28); fenceSegment(31, -28, 31, 28)
  fenceSegment(-31, 28, -4.4, 28); fenceSegment(4.4, 28, 7.1, 28); fenceSegment(13.4, 28, 31, 28)
  for (const x of [-4.4, 4.4, 7.1, 13.4]) {
    box(0.85, 2.05, 0.85, M.stone, scene, x, 1.02, 28)
    box(1.05, 0.16, 1.05, M.stoneLight, scene, x, 2.1, 28)
    box(0.34, 0.48, 0.34, M.lamp, scene, x, 2.42, 28)
    cyl(0.3, 0.3, 0.07, M.metal, scene, x, 2.7, 28, 12)
  }
  box(4.3, 0.08, 9, M.gravel, scene, 0, 0.02, 32.5)
  box(5.7, 0.08, 9, M.gravel, scene, 10.25, 0.02, 32.5)

  /* 细碎草叶，增强近景自然度 */
  const grassPositions: number[][] = []
  for (let i = 0; i < 2600; i++) {
    const x = rand(-30, 30), z = rand(-27, 27)
    const blocked = (Math.abs(x) < 8 && z > -11 && z < 2) || (x > -21 && x < -7 && z > -8 && z < 4) || (Math.abs(x) < 2.5 && z > 1) || (x > 7 && x < 13.5 && z > 0) || (Math.hypot(x - 15, z - 10.5) < 4.5)
    if (!blocked) grassPositions.push([x, z])
  }
  const grassBlades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.025, 0.32, 3), standard(0x6f8952), grassPositions.length)
  grassPositions.forEach((p, i) => {
    dummy.position.set(p[0], 0.15, p[1]); dummy.scale.set(rand(0.7, 1.4), rand(0.55, 1.45), rand(0.7, 1.4)); dummy.rotation.set(rand(-0.12, 0.12), rnd() * 6.28, rand(-0.12, 0.12)); dummy.updateMatrix(); grassBlades.setMatrixAt(i, dummy.matrix)
  })
  grassBlades.castShadow = false; grassBlades.receiveShadow = true; scene.add(grassBlades)

  /* 视角切换 */
  views = {
    overview: { p: [37, 25, 43], t: [0, 3.8, -2] },
    house: { p: [21, 14, 23], t: [0, 5, -3] },
    garden: { p: [-24, 10, 24], t: [-7, 2.2, 7] },
    tea: { p: [23, 8, 20], t: [15, 1.8, 10.5] },
  }
  controls.addEventListener('start', () => { tween = null })

  /* 动画与响应式 */
  const clock = new THREE.Clock()
  function animate() {
    animationId = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    M.water.opacity = 0.86 + Math.sin(t * 0.9) * 0.018
    waterNormal.offset.x = (t * 0.012) % 1
    waterNormal.offset.y = (t * 0.008) % 1
    swayCrowns.forEach((s: any) => {
      s.g.rotation.z = Math.sin(t * 0.65 + s.phase) * s.amount
      s.g.rotation.x = Math.cos(t * 0.5 + s.phase) * s.amount * 0.6
    })
    if (tween) {
      const u = Math.min(1, (performance.now() - tween.start) / 1250), e = 1 - Math.pow(1 - u, 3)
      camera.position.lerpVectors(tween.fromP, tween.toP, e)
      controls.target.lerpVectors(tween.fromT, tween.toT, e)
      if (u === 1) tween = null
    }
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // 首帧渲染完成后隐藏 loading 遮罩
  requestAnimationFrame(() => { loading.value = false })

  resizeHandler = () => {
    if (!camera || !renderer) return
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', resizeHandler)

  // 主题切换时实时更新景物颜色（setTheme 会改写 document 的 --colorX 变量）
  function applySceneColors() {
    const sc = getSceneColors()
    const color3 = themeColor('color3')
    console.log(color3, 'color3')
    M.leaf.forEach((m: any, i: number) => m.color.set(sc.leaf[i]))
    // 所有白色 / 接近白色的中性材质改为主题色 color3（随主题实时联动）
    M.wall.color.set(color3)
    M.roof.color.set(color3)
    M.wood.color.set(color3)
    M.white.color.set(color3)
    M.wallWarm.color.set(color3)
    M.stone.color.set(color3)
    M.stoneLight.color.set(color3)
    M.curtain.color.set(color3)
    M.gravel.color.set(color3)
    M.soil.color.set(color3)
    M.bark.color.set(color3)
    M.roofDark.color.set(sc.roofDark)
    M.woodDark.color.set(sc.woodDarkTint)
    M.cushion.color.set(sc.cushion)
    M.terracotta.color.set(sc.terracotta)
    M.blossom.forEach((m: any, i: number) => m.color.set(sc.blossom[i]))
    leafMaterials.forEach((m: any, i: number) => m.color.set(sc.leafLight[i]))
  }
  applySceneColors()

  let themeRaf = 0
  themeObserver = new MutationObserver(() => {
    if (themeRaf) return
    themeRaf = requestAnimationFrame(() => { themeRaf = 0; applySceneColors() })
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
})

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (themeObserver) themeObserver.disconnect()
  cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
})
</script>

<template>
  <div class="three-root">
    <canvas ref="canvasRef" class="three-canvas"></canvas>

    <section class="info panel">
      <div class="eyebrow">COURTYARD RESIDENCE</div>
      <h1>岚庭 · 山野别墅</h1>
      <p>暖石立面与陶瓦屋顶，融入花境、林荫和一方茶亭。</p>
      <div class="tags">
        <span>精细建筑</span><span>自然庭院</span><span>林下茶歇</span>
      </div>
    </section>

    <div class="light-label panel"><span class="light-dot"></span>午后自然光</div>

    <nav class="views panel" aria-label="场景视角">
      <button :class="{ active: activeView === 'overview' }" @click="setView('overview')">庭院全景</button>
      <button :class="{ active: activeView === 'house' }" @click="setView('house')">建筑细节</button>
      <button :class="{ active: activeView === 'garden' }" @click="setView('garden')">花境漫步</button>
      <button :class="{ active: activeView === 'tea' }" @click="setView('tea')">茶亭休憩</button>
      <button :class="{ active: autoRotate }" @click="toggleRotate">环绕</button>
    </nav>

    <div class="hint">左键旋转 · 滚轮缩放 · 右键平移</div>

    <div class="loading" :class="{ hide: !loading }"><div class="loader">正在营造庭院</div></div>
  </div>
</template>

<style scoped>
.three-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  margin: 0;
  overflow: hidden;
  background: #dce8e2;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #29372f;
}
.three-root, .three-root * { margin: 0; padding: 0; box-sizing: border-box; }
.three-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

.panel { background: rgba(250, 250, 246, .82); border: 1px solid rgba(255, 255, 255, .72); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 12px 36px rgba(42, 55, 45, .12); }
.info { position: fixed; top: 22px; left: 22px; padding: 18px 21px 16px; border-radius: 18px; user-select: none; pointer-events: none; }
.eyebrow { font-size: 10px; letter-spacing: .24em; color: #78877b; margin-bottom: 7px; }
.info h1 { font-family: "Songti SC", "Noto Serif SC", serif; font-size: 23px; font-weight: 600; letter-spacing: .08em; }
.info p { margin-top: 8px; font-size: 12px; color: #68776c; line-height: 1.7; }
.tags { display: flex; gap: 6px; margin-top: 12px; }
.tags span { font-size: 10px; padding: 4px 8px; border-radius: 20px; color: #53685a; background: rgba(97, 125, 103, .09); }
.light-label { position: fixed; top: 25px; right: 25px; padding: 9px 13px; border-radius: 30px; font-size: 11px; letter-spacing: .08em; color: #647267; user-select: none; pointer-events: none; }
.light-dot { display: inline-block; width: 6px; height: 6px; margin-right: 7px; border-radius: 50%; background: #d9a75f; box-shadow: 0 0 0 4px rgba(217, 167, 95, .14); vertical-align: 1px; }
.views { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); display: flex; gap: 5px; padding: 6px; border-radius: 16px; }
.views button { border: 0; border-radius: 11px; padding: 10px 16px; background: transparent; color: #637168; font-family: inherit; font-size: 12px; cursor: pointer; transition: .2s ease; white-space: nowrap; }
.views button:hover { color: #263b2d; background: color-mix(in srgb, var(--color3) 62%, transparent); }
.views button.active { color: #f8faf7; background: #506b58; box-shadow: 0 4px 12px rgba(50, 75, 58, .22); }
.hint { position: fixed; left: 24px; bottom: 26px; font-size: 11px; color: rgba(43, 57, 47, .62); user-select: none; pointer-events: none; }
.loading { position: fixed; inset: 0; display: grid; place-items: center; background: #e7eee8; z-index: 10; transition: opacity .55s ease; }
.loading.hide { opacity: 0; pointer-events: none; }
.loader { text-align: center; color: #53675a; font-size: 12px; letter-spacing: .15em; }
.loader::before { content: ""; display: block; width: 32px; height: 32px; margin: 0 auto 15px; border: 2px solid rgba(80, 107, 88, .18); border-top-color: #506b58; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 700px) {
  .info { top: 12px; left: 12px; padding: 13px 15px; }
  .info h1 { font-size: 18px; }
  .info p, .tags, .light-label, .hint { display: none; }
  .views { bottom: 14px; }
  .views button { padding: 9px 11px; font-size: 11px; }
}
</style>
