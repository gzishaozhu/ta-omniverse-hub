<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const modules = [
  { path: '/shader-studio', title: 'AI Shader Studio', desc: 'AI驱动的GLSL着色器生成与实时预览', icon: '◉', color: '#6c5ce7' },
  { path: '/gallery', title: '3D 作品集', desc: '沉浸式3D交互式作品展示', icon: '◈', color: '#00cec9' },
]
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>TA Omniverse Hub</h1>
      <p>技术美术全栈工具平台 · AI · 3D · 交互</p>
    </div>
    <div class="cards">
      <div v-for="m in modules" :key="m.path" class="card" @click="router.push(m.path)">
        <div class="card-icon" :style="{ background: m.color }">{{ m.icon }}</div>
        <div class="card-body">
          <h3>{{ m.title }}</h3>
          <p>{{ m.desc }}</p>
        </div>
        <div class="card-arrow">→</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; }
.hero { text-align: center; }
.hero h1 { font-size: 36px; font-weight: 800; background: linear-gradient(135deg,#6c5ce7,#00cec9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
.hero p { font-size: 14px; color: #555570; }
.cards { display: flex; flex-direction: column; gap: 12px; width: 400px; }
.card {
  display: flex; align-items: center; gap: 16px; padding: 20px; border: 1px solid #2a2a40; border-radius: 10px;
  background: #12121f; cursor: pointer; transition: all 0.25s;
}
.card:hover { border-color: #6c5ce7; box-shadow: 0 0 20px rgba(108,92,231,0.15); transform: translateY(-2px); }
.card-icon {
  width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #fff; flex-shrink: 0;
}
.card-body { flex: 1; }
.card-body h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.card-body p { font-size: 12px; color: #555570; }
.card-arrow { color: #2a2a40; font-size: 18px; }
</style>
