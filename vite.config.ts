import { defineConfig, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as fs from 'fs'
import * as path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

const CACHE_PATH = path.resolve(__dirname, 'cache.json')
const DEEPSEEK_KEY = 'YOUR_DEEPSEEK_API_KEY'
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_PROMPT = `You are a world-class GLSL fragment shader programmer creating AAA game quality visuals. Generate a WebGL fragment shader as a SINGLE COMPACT LINE of code body for void main(). QUALITY: Use MULTIPLE LAYERS (>3) of patterns blended together. Rich COLOR GRADIENTS with 5+ color stops. DYNAMIC ANIMATION and ATMOSPHERIC effects. RULES: Output ONLY the single-line code body for void main() { BODY_HERE }. u_time (float) and u_resolution (vec2) are auto-injected. Use vec2 uv = gl_FragCoord.xy / u_resolution; End with: gl_FragColor = vec4(FINAL_COLOR, 1.0); NO markdown, NO backticks, NO line breaks.`

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''; req.on('data', (c: string) => body += c)
    req.on('end', () => { try { resolve(JSON.parse(body)) } catch { resolve({}) } })
    req.on('error', reject)
  })
}
function sendJSON(res: ServerResponse, data: any, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}
function loadCache(): any {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) } catch { return { shaders: [] } }
}
function saveCache(data: any) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}
function findInCache(prompt: string): any {
  const data = loadCache(); const pl = prompt.toLowerCase()
  for (const s of data.shaders) if (s.prompt.toLowerCase() === pl) return s
  const words = new Set(pl.match(/\w+/g) || []); let best: any = null; let bestScore = 0
  for (const s of data.shaders) {
    const cw = new Set(s.prompt.toLowerCase().match(/\w+/g) || [])
    const overlap = [...words].filter(w => cw.has(w)).length
    const total = new Set([...words, ...cw]).size
    const ratio = overlap / total
    if (ratio > bestScore) { bestScore = ratio; best = s }
  }
  return best && bestScore > 0.35 ? best : null
}
function addToCache(prompt: string, code: string) {
  const data = loadCache()
  if (data.shaders.some((s: any) => s.prompt.toLowerCase() === prompt.toLowerCase())) return
  data.shaders.unshift({ prompt, shaderCode: code, created: new Date().toISOString() })
  saveCache(data)
}
function cleanCode(text: string): string {
  let t = text.replace(/```(?:glsl)?\s*/g, '').trim()
  if (!t.includes('void main()')) t = 'void main(){' + t + '}'
  if (!t.includes('uniform float u_time')) t = 'uniform float u_time;' + t
  if (!t.includes('uniform vec2 u_resolution')) t = 'uniform vec2 u_resolution;' + t
  return t
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'api-handler',
      configureServer(server: ViteDevServer) {
        server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: any) => {
          const url = req.url || ''
          // POST /api/generate
          if (url === '/api/generate' && req.method === 'POST') {
            const body = await parseBody(req)
            const prompt = (body?.prompt || '').trim()
            if (!prompt) return sendJSON(res, { detail: 'Prompt required' }, 400)
            const cached = findInCache(prompt)
            if (cached) {
              console.log('[API] Cache hit:', prompt.substring(0, 50))
              return sendJSON(res, { shaderCode: cached.shaderCode, cached: true, metadata: { source: 'cache' } })
            }
            try {
              const resp = await fetch(DEEPSEEK_URL, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + DEEPSEEK_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'deepseek-chat', temperature: 0.8,
                  messages: [
                    { role: 'system', content: DEEPSEEK_PROMPT },
                    { role: 'user', content: 'Create a beautiful cinematic shader for: ' + prompt }
                  ], max_tokens: 2048
                }), signal: AbortSignal.timeout(60000)
              })
              if (resp.ok) {
                const data: any = await resp.json()
                let code = cleanCode(data.choices[0].message.content)
                addToCache(prompt, code)
                console.log('[API] Generated for:', prompt.substring(0, 50))
                return sendJSON(res, { shaderCode: code, cached: false, metadata: { source: 'deepseek' } })
              }
            } catch (e) { console.error('[API] DeepSeek error:', e) }
            // Fallback
            const cache = loadCache()
            if (cache.shaders.length) {
              const fb = cache.shaders[Math.floor(Math.random() * cache.shaders.length)]
              return sendJSON(res, { shaderCode: fb.shaderCode, cached: true, metadata: { source: 'fallback', note: 'DeepSeek unavailable, using: ' + fb.prompt } })
            }
            return sendJSON(res, { detail: 'No shader available' }, 503)
          }
          // GET /api/cache
          if (url === '/api/cache' && req.method === 'GET') {
            const data = loadCache()
            return sendJSON(res, { count: data.shaders.length, shaders: data.shaders.map((s: any) => ({ prompt: s.prompt, created: s.created })) })
          }
          // POST /api/cache
          if (url === '/api/cache' && req.method === 'POST') {
            const body = await parseBody(req)
            if (body?.prompt && body?.shaderCode) addToCache(body.prompt, body.shaderCode)
            return sendJSON(res, { status: 'ok' })
          }
          // GET /api/status
          if (url === '/api/status' && req.method === 'GET') {
            const data = loadCache()
            return sendJSON(res, { server: 'running', deepseek_api: true, cache_size: data.shaders.length })
          }
          next()
        })
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  server: { port: 3000, host: true },
})
