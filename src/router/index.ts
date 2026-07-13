import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryPage.vue'),
    },
    {
      path: '/shader-studio',
      name: 'shader-studio',
      component: () => import('@/views/ShaderStudio.vue'),
    },
  ],
})
export default router
