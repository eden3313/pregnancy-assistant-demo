"""Build an isolated, versioned source ZIP without secrets or test files."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parents[1]
source = root / 'miniprogram'
release = root / 'release'
release.mkdir(exist_ok=True)
target = release / 'pregnancy-assistant-miniprogram-v1.1.0-source.zip'
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(source.rglob('*')):
        if not file.is_file() or file.name.endswith('.test.ts') or file.name == 'project.private.config.json':
            continue
        if file.suffix in ('.log',) or file.name.startswith('.env'):
            continue
        relative = file.relative_to(source)
        if file.name == 'project.config.json':
            config = json.loads(file.read_text(encoding='utf-8'))
            config['appid'] = 'touristappid'
            archive.writestr(str(relative).replace('\\', '/'), json.dumps(config, ensure_ascii=False, indent=2))
        else:
            archive.write(file, str(relative).replace('\\', '/'))
    archive.write(root / 'docs/wechat/v1.1.0-release.md', 'V1.1.0_RELEASE.md')
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert 'pages/image-assistant/index.wxml' in archive.namelist()
    assert not any(name.endswith('.test.ts') or '.env' in name or 'private.config' in name for name in archive.namelist())
print(f'{target} ({target.stat().st_size} bytes)')
