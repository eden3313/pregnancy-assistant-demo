import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'miniprogram');
const errors = [];
const appJsonPath = path.join(root, 'app.json');
if (!existsSync(appJsonPath)) errors.push('缺少 app.json');
else {
  const app = JSON.parse(readFileSync(appJsonPath, 'utf8'));
  for (const page of app.pages || []) for (const ext of ['.ts', '.wxml', '.wxss', '.json']) {
    if (!existsSync(path.join(root, `${page}${ext}`))) errors.push(`页面文件缺失：${page}${ext}`);
  }
}
const projectPath = path.join(root, 'project.config.json');
if (!existsSync(projectPath)) errors.push('缺少 project.config.json');
else if (JSON.parse(readFileSync(projectPath, 'utf8')).appid !== 'touristappid') errors.push('提交包中的 project.config.json 必须使用 touristappid，真实 AppID 请放在本机私有配置。');

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/\.(ts|json|wxml|wxss|md)$/.test(entry.name)) {
      const text = readFileSync(target, 'utf8');
      if (/sk-[A-Za-z0-9_-]{20,}/.test(text) || /OPENAI_API_KEY\s*=\s*[^\s"']+/.test(text) || /AppSecret\s*[:=]\s*[^\s"']+/.test(text)) errors.push(`疑似密钥：${path.relative(root, target)}`);
      // Online image extraction is intentional in v1.1.0; check its public configuration below.
    }
  }
}
if (existsSync(root)) walk(root);
const configPath = path.join(root, 'config.ts');
if (existsSync(configPath)) {
  const configured = readFileSync(configPath, 'utf8').match(/API_BASE_URL\s*=\s*["']([^"']*)["']/)?.[1];
  if (configured && !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(configured)) errors.push('AI API必须配置为HTTPS域名，不能包含路径或密钥。');
  if (!configured && process.argv.includes('--production')) errors.push('正式上传前必须配置 miniprogram/config.ts 的 API_BASE_URL。');
  else if (!configured) console.warn('AI API域名未配置：源码可检查，正式识别尚未具备联调条件。');
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Mini program validation passed: ${root}`);
