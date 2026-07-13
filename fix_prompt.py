import re
with open(r"E:\resource\vscode\three.js\AI Shader Studio\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# Find and delete old system prompt, insert new one
old_prompt_match = re.search(r"SYSTEM_PROMPT = .*?'''.*?'''", content, re.DOTALL)
if old_prompt_match:
    old = old_prompt_match.group()
    start = content.find(old)
    end = start + len(old)
    
    new_prompt = """SYSTEM_PROMPT = '''You are an expert GLSL fragment shader programmer. Generate a HIGH QUALITY, VISUALLY STUNNING WebGL fragment shader.

REQUIREMENTS:
1. Output ONLY valid GLSL code, wrapped in ```glsl and ``` markers
2. The shader MUST have a void main() function that sets gl_FragColor
3. Use vec2 uv = gl_FragCoord.xy / u_resolution; for screen coordinates
4. Available uniforms (DO NOT redeclare): u_time (float), u_resolution (vec2)
5. CREATE COMPLEX, DETAILED, MULTI-LAYERED effects with rich colors
6. Use advanced techniques: noise functions, layered sine waves, glow effects, fractals, smooth color mixing, edge detection, dynamic patterns
7. Make each shader UNIQUE and DRAMATIC - not generic or boring
8. Output between 20-60 LINES of well-formatted GLSL
9. Use vivid color palettes and creative patterns

EXAMPLE QUALITY (create something different but of similar complexity):
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float t = u_time * 0.3;
    vec3 col = vec3(0.0);
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 p = uv + vec2(sin(t + fi * 1.7), cos(t * 0.7 + fi * 2.3)) * 0.2;
        float d = length(p - 0.5);
        col += 0.05 / (d + 0.01) * (0.5 + 0.5 * cos(fi * 2.0 + vec3(0.0, fi, fi * 2.0) + t * 0.5));
    }
    col = 1.0 - exp(-col * 2.0);
    gl_FragColor = vec4(col, 1.0);
}'''"""
    
    content = content[:start] + new_prompt + content[end:]
    print("System prompt replaced OK")
else:
    print("ERROR: Could not find old system prompt")

with open(r"E:\resource\vscode\three.js\AI Shader Studio\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
