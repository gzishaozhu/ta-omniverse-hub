import re
with open("E:/resource/vscode/three.js/AI Shader Studio/server.py", "r") as f:
    content = f.read()

# Find and replace the old find_in_cache function
start = content.find("def find_in_cache(prompt):")
end = content.find("def generate_prompt_hash")
if start == -1:
    print("ERROR: Could not find find_in_cache")
else:
    old_func = content[start:end]
    new_func = """def find_in_cache(prompt):
    \"\"\"Exact match only - no fuzzy keyword matching\"\"\"
    data = load_cache()
    prompt_lower = prompt.lower().strip()
    for s in data['shaders']:
        if s['prompt'].lower().strip() == prompt_lower:
            return s
    return None

def generate_prompt_hash"""
    content = content.replace(old_func, new_func)
    with open("E:/resource/vscode/three.js/AI Shader Studio/server.py", "w") as f:
        f.write(content)
    print("Updated find_in_cache - exact match only")
