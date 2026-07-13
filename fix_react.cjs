const fs = require('fs');
const filePath = 'E:/resource/vscode/three.js/AI Shader Studio/ta-omniverse-hub/src/composables/useThreeScene.ts';
let content = fs.readFileSync(filePath, 'utf-8');
content = content.replace('React.RefObject<HTMLCanvasElement> | any', 'any');
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed React.RefObject reference');
