"""Render a diagnostic contact sheet and loop from the shipping raster atlas."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'assets/runtime/sprites.json').read_text())
atlas=Image.open(root/'assets/runtime/sprites.webp')
out=Image.new('RGB',(1280,760),'#e8e3d4');loop=[]
for i,frame in enumerate(data['sprites']['run']):
 x,y,w,h=frame['rect'];crop=atlas.crop((x,y,x+w,y+h))
 tile=Image.new('RGBA',(320,380),'#e8e3d4');draw=ImageDraw.Draw(tile)
 draw.line((0,330,320,330),fill='#807b70')
 tile.alpha_composite(crop,(round(160-frame['pivotX']*2),round(330-frame['pivotY']*2)))
 draw.text((12,12),f"{i+1}. {frame['phase']}",fill='#202020')
 out.paste(tile,(i%4*320,i//4*380));loop.append(tile.convert('RGB'))
out.save(root/'game-tests/review/run-v8-all-frames.png')
# Eight authored poses at 4 FPS: 250 ms per pose, 2 s for the complete cycle.
loop[0].save(root/'game-tests/review/run-v8-loop.gif',save_all=True,append_images=loop[1:],duration=250,loop=0)

def capture_loop(name, label):
    frames=data['sprites'][name]
    contact=Image.new('RGB',(1280,760),'#e8e3d4')
    loop=[]
    for i,frame in enumerate(frames):
        x,y,w,h=frame['rect']; crop=atlas.crop((x,y,x+w,y+h))
        tile=Image.new('RGBA',(320,380),'#e8e3d4'); draw=ImageDraw.Draw(tile)
        draw.line((0,330,320,330),fill='#807b70')
        tile.alpha_composite(crop,(round(160-frame['pivotX']*2),round(330-frame['pivotY']*2)))
        draw.text((12,12),f'{label} {i+1}/{len(frames)}',fill='#202020')
        contact.paste(tile,(i%4*320,i//4*380)); loop.append(tile.convert('RGB'))
    contact.save(root/f'game-tests/review/{name}-all-frames.png')
    duration = 200 if name.endswith('Start') else 250 if name.endswith('Finish') else 125
    loop[0].save(root/f'game-tests/review/{name}-loop.gif',save_all=True,append_images=loop[1:],duration=duration,loop=0)

capture_loop('chaser', 'GRAY SUIT')
capture_loop('chaser2', 'BLUE SUIT')
for name, label in [
    ('chaserStart', 'GRAY START'), ('chaser2Start', 'BLUE START'),
    ('chaserFinish', 'GRAY FINISH'), ('chaser2Finish', 'BLUE FINISH'),
    ('chaserJump', 'GRAY JUMP'), ('chaser2Jump', 'BLUE JUMP'),
    ('chaserRoll', 'GRAY ROLL'), ('chaser2Roll', 'BLUE ROLL'),
]: capture_loop(name, label)
