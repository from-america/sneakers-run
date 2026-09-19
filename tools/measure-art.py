"""Record alpha bounds of approved artwork. Never creates or edits artwork."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHEETS = {
    'run': ('runner/run-v6.png', 8),
    'jump': ('runner/actions/jump-v1.png', 4),
    'roll': ('runner/actions/roll-v1.png', 4),
    'crouch': ('runner/actions/crouch-v1.png', 4),
    'land': ('runner/actions/land-v1.png', 4),
    'stumble': ('runner/actions/stumble-v1.png', 4),
    'celebrate': ('runner/actions/celebrate-v1.png', 4),
    'chaser': ('chaser/run-v1.png', 8),
    'barrier': ('props/low-v1.png', 2),
    'car': ('props/car-v1.png', 2),
    'gate': ('obstacles/overhead-gate-v2.png', 2),
    'barrel': ('obstacles/barrel-v1.png', 2),
    'platform': ('props/platform-v1.png', 2),
    'support': ('obstacles/platform-support-v1.png', 1),
    'coin': ('props/coin-v1.png', 2),
    'shield': ('props/shield-v1.png', 2),
    'magnet': ('props/magnet-v1.png', 2),
    'speed': ('props/speed-v1.png', 2),
    'dust': ('vfx/dust-v1.png', 2),
    'impact': ('vfx/impact-v1.png', 2),
    'spark': ('vfx/coin-v1.png', 2),
    'power': ('vfx/power-v1.png', 2),
    'rival': ('enemies/skateboard-rival/run-v1.png', 8),
    'courier': ('enemies/shoe-box-courier/run-v1.png', 8),
}
result = {}
for name, (file, count) in SHEETS.items():
    with Image.open(ROOT / 'assets/imagegen' / file) as image:
        frame_width = image.width // count
        frames = []
        for index in range(count):
            frame = image.crop((index * frame_width, 0, (index + 1) * frame_width, image.height))
            alpha = frame.convert('RGBA').getchannel('A')
            bounds = alpha.point(lambda value: 255 if value > 32 else 0).getbbox()
            if not bounds:
                raise ValueError(f'{file}: frame {index} is empty')
            left, top, right, bottom = bounds
            frames.append({'x': index * frame_width + left, 'y': top, 'width': right-left, 'height': bottom-top})
        result[name] = {'src': f'assets/imagegen/{file}', 'frames': frames,
                        'width': max(f['width'] for f in frames), 'height': max(f['height'] for f in frames)}
(ROOT / 'assets/art-catalog.json').write_text(json.dumps(result, indent=2) + '\n')
print(f'Measured {len(result)} approved sheets; original raster files unchanged.')
