import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PortfolioItem, PortfolioState } from '@/types/portfolio'

const API_BASE = '/api'

export const usePortfolioStore = defineStore('portfolio', () => {
  const items = ref<PortfolioItem[]>([])
  const selectedItem = ref<PortfolioItem | null>(null)
  const filter = ref({ category: null, semester: null, search: '' })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      if (filter.value.category && item.category !== filter.value.category) return false
      if (filter.value.semester && item.semester !== filter.value.semester) return false
      if (filter.value.search) {
        const s = filter.value.search.toLowerCase()
        return (
          item.title.toLowerCase().includes(s) ||
          item.description.toLowerCase().includes(s) ||
          item.tags.some((t) => t.toLowerCase().includes(s))
        )
      }
      return true
    })
  })

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/portfolio`)
      if (!res.ok) throw new Error('Failed to fetch')
      items.value = await res.json()
    } catch (e: any) {
      error.value = e.message
      // Fallback: use hardcoded demo data if API unavailable
      items.value = getDemoItems()
    } finally {
      loading.value = false
    }
  }

  function selectItem(item: PortfolioItem | null) {
    selectedItem.value = item
  }

  function setFilter(partial: Partial<PortfolioState['filter']>) {
    Object.assign(filter.value, partial)
  }

  return { items, selectedItem, filter, filteredItems, loading, error, fetchItems, selectItem, setFilter }
})

function getDemoItems(): PortfolioItem[] {
  return [
    {
      id: '1',
      title: 'AI全流程场景',
      subtitle: 'Midjourney → Meshy → Houdini → UE5',
      description: '用AI生成概念图、PBR贴图和基础模型，再经过Houdini程序化细节和UE5渲染，完成一个完整的次世代场景。',
      category: 'ai',
      semester: '大二下',
      date: '2028-06',
      thumbnail: '',
      techStack: ['Midjourney', 'ComfyUI', 'Meshy', 'Houdini', 'UE5'],
      aiContribution: 65,
      performanceData: { 场景面数: '12.5M', 'Draw Call': '1850', 帧率: '60fps' },
      starDoc: {
        situation: '需要快速构建一个高质量古建场景用于国赛',
        task: '设计并实现AI辅助的完整资产管线',
        action: '使用Midjourney生成概念图→LoRA控制风格→ControlNet多约束→Meshy生成低模→Houdini程序化细节→UE5渲染',
        result: '将制作周期从3周缩短到1周，AI提效65%，获国赛省奖',
      },
      links: { github: 'https://github.com', demo: 'https://demo.com' },
      tags: ['AI全流程', '古建', '国赛'],
    },
    {
      id: '2',
      title: '实时风格迁移插件',
      subtitle: 'UE5 ONNX Runtime 集成',
      description: '在UE5中集成轻量级风格迁移模型，实现1080p@30fps的实时画面风格转换。',
      category: 'rendering',
      semester: '大三上',
      date: '2029-10',
      thumbnail: '',
      techStack: ['Python', 'ONNX', 'UE5', 'C++'],
      aiContribution: 40,
      performanceData: { 分辨率: '1080p', 帧率: '30fps', 延迟: '33ms' },
      starDoc: {
        situation: '需要为UE5场景实现实时风格化效果',
        task: '开发一个UE5插件实现AI实时风格迁移',
        action: '轻量级模型转ONNX→UE5插件配置→UI切换三种风格→性能优化到1080p@30fps',
        result: '成功实现1080p@30fps实时风格迁移，输出插件源码+演示视频',
      },
      links: { github: 'https://github.com' },
      tags: ['UE5', 'C++', 'ONNX', '风格迁移'],
    },
    {
      id: '3',
      title: '程序化城市生成器',
      subtitle: 'Houdini HDA → UE5 运行时',
      description: '在Houdini中创建参数化城市生成器，支持运行时在UE5中动态调节建筑密度、楼层高度等参数。',
      category: 'procedural',
      semester: '大三上',
      date: '2029-11',
      thumbnail: '',
      techStack: ['Houdini', 'VEX', 'UE5', 'C++', 'HAPI'],
      aiContribution: 0,
      performanceData: { 建筑数: '2000+', 生成时间: '3.2s', 运行时帧率: '45fps' },
      starDoc: {
        situation: '需要快速生成大规模城市场景',
        task: '开发程序化城市生成管线',
        action: 'Houdini中创建道路网络→地块划分→建筑随机生成→打包HDA→UE5运行时C++调用HAPI动态调节',
        result: '支持2000+建筑实时生成，参数化控制密度/高度，运行时帧率稳定45fps',
      },
      links: { github: 'https://github.com' },
      tags: ['Houdini', '程序化生成', 'UE5'],
    },
    {
      id: '4',
      title: 'Three.js交互式画廊',
      subtitle: 'Web 3D 作品展示平台',
      description: '基于Three.js构建的3D交互式作品集，支持OrbitControls漫游、点击展品查看详情。',
      category: 'tool',
      semester: '大三上',
      date: '2029-09',
      thumbnail: '',
      techStack: ['Three.js', 'Vue', 'TypeScript', 'Vite'],
      aiContribution: 20,
      performanceData: { 模型数: '12', 帧率: '60fps', 加载时间: '1.2s' },
      starDoc: {
        situation: '需要在线展示TA作品集',
        task: '设计并实现3D交互式作品展示平台',
        action: 'Three.js搭建3D画廊场景→Vue集成→响应式布局→性能优化',
        result: '12个作品3D展示，60fps流畅运行，1.2s快速加载',
      },
      links: { github: 'https://github.com', demo: 'https://demo.com' },
      tags: ['Three.js', 'Web', '作品集'],
    },
    {
      id: '5',
      title: 'AI Agent场景生成器',
      subtitle: 'LangGraph + ComfyUI 智能体',
      description: '使用LangGraph构建AI Agent，输入"生成一个中国古镇"，自动调用图像生成API、优化提示词、组合模型，输出完整的场景参考。',
      category: 'ai',
      semester: '大三上',
      date: '2029-12',
      thumbnail: '',
      techStack: ['LangGraph', 'Python', 'ComfyUI', 'DeepSeek'],
      aiContribution: 90,
      performanceData: { 生成时间: '45s', Agent步骤: '6步', 成功率: '85%' },
      starDoc: {
        situation: '需要简化AI全流程的复杂性',
        task: '构建一个能自主完成场景生成的AI Agent',
        action: 'LangGraph框架搭建→Function Calling工具调用→MCP协议接入→多步推理→记忆机制',
        result: '一句话生成完整场景参考，6步Agent工作流，45秒完成，成功率85%',
      },
      links: { github: 'https://github.com' },
      tags: ['AI Agent', 'LangGraph', '自动化'],
    },
    {
      id: '6',
      title: 'GGJ 2029 - 溶解Shader',
      subtitle: 'Global Game Jam 参赛作品',
      description: '在48小时内完成一款游戏的全流程制作，主要负责Shader特效、AI辅助贴图生成和性能优化。',
      category: 'game',
      semester: '大二上',
      date: '2029-01',
      thumbnail: '',
      techStack: ['Unity', 'HLSL', 'ComfyUI', 'C#'],
      aiContribution: 30,
      performanceData: { 开发时间: '48h', Shader数: '5个', AI提效: '30%' },
      starDoc: {
        situation: '48小时Game Jam需要快速产出',
        task: '负责Shader特效和AI资产生成',
        action: 'HLSL编写溶解/边缘光/流光Shader→ComfyUI生成贴图→性能优化→团队协作',
        result: '48小时完成可玩Demo，5个自写Shader，AI提效30%',
      },
      links: { github: 'https://github.com' },
      tags: ['Game Jam', 'Unity', 'HLSL'],
    },
  ]
}
