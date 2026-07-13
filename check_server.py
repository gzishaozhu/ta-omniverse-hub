with open(r"E:/resource/vscode/three.js/AI Shader Studio/server.py", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "SYSTEM_PROMPT" in line and "=" in line:
        print(f"SYSTEM_PROMPT starts at line {i+1}")
        start = i
    if 'best_score' in line and '>=' in line:
        print(f"Threshold check at line {i+1}: {line.strip()}")
        break
print(f"Prompt is {len(lines[start].rstrip())} chars long, ends with: {lines[start].rstrip()[-30:]}")
