"""Pack original ChatGPT rasters for runtime. No repainting or generated geometry.

Original images remain unchanged. Uniform resampling, transparent gutters and
explicit pivots prevent sheet neighbours or transparent margins entering play.
Run with Pillow: python3 tools/pack-runtime-art.py
"""
from pathlib import Path
from PIL import Image
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'runtime'
OUT.mkdir(parents=True, exist_ok=True)
catalog = json.loads((ROOT / 'assets/art-catalog.json').read_text())
heights = {'run': 144, 'jump': 144, 'roll': 90, 'land': 140, 'stumble': 137, 'celebrate': 151,
           'crouch': 87, 'speed': 37, 'support': 150, 'barrier': 90, 'car': 108, 'barrel': 95, 'platform': 148,
           'shield': 34, 'magnet': 36, 'dust': 28, 'impact': 62, 'spark': 28, 'power': 70}
static = {'barrier', 'barrel', 'platform', 'shield', 'magnet', 'speed', 'support'}
sprites = {}
sources = {}
images = []
for name, height in heights.items():
    data = catalog[name]
    source = ROOT / data['src']
    sources[data['src']] = hashlib.sha256(source.read_bytes()).hexdigest()
    sheet = Image.open(source).convert('RGBA')
    frames = data['frames'][:1] if name in static else data['frames']
    # Props have a fixed visible silhouette; the generated car keeps its base
    # frame scale while its second frame rises from the same wheel baseline.
    factor = height / (frames[0]['height'] if name in static or name == 'car' else data['height'])
    sprites[name] = []
    for index, bounds in enumerate(frames):
        x, y, w, h = [bounds[k] for k in ('x', 'y', 'width', 'height')]
        crop = sheet.crop((x, y, x+w, y+h))
        # Image Gen's tall idle pose is close to the requested pulse; apply a
        # small atlas-scale correction so the shipped car is exactly 20% taller
        # from the shared wheel line rather than relying on a CSS transform.
        frame_factor = factor * (1.048 if name == 'car' and index == 1 else 1)
        dw, dh = w * frame_factor, h * frame_factor
        runtime = crop.resize((round(dw * 2), round(dh * 2)), Image.Resampling.LANCZOS)
        frame = {'width': dw, 'height': dh, 'pivotX': dw/2, 'pivotY': dh,
                 'source': [x, y, w, h]}
        sprites[name].append(frame)
        images.append((frame, runtime))

for name, filename, box, size, pivot in [
    ('gate', 'assets/imagegen/obstacles/overhead-gate-v2.png', (0, 0, 1024, 768), (246, 184.5), (123, 160.72)),
    ('coin', 'assets/imagegen/props/coin-icon-v1.png', None, (29, 29), (14.5, 14.5)),
]:
    source = ROOT / filename
    sources[filename] = hashlib.sha256(source.read_bytes()).hexdigest()
    sheet = Image.open(source).convert('RGBA')
    if box: sheet = sheet.crop(box)
    else: sheet = sheet.crop(sheet.getchannel('A').getbbox())
    # Fit to a square without stretching the coin.
    factor = min(size[0]/sheet.width, size[1]/sheet.height)
    width, height = sheet.width*factor, sheet.height*factor
    runtime = sheet.resize((round(width*2), round(height*2)), Image.Resampling.LANCZOS)
    frame = {'width': width, 'height': height, 'pivotX': pivot[0], 'pivotY': pivot[1],
             'source': list(box) if box else [0, 0, sheet.width, sheet.height]}
    sprites[name] = [frame]
    images.append((frame, runtime))

# New gameplay families use complete alpha components instead of equal-width
# cells: many original sheets have hands/feet crossing those cell boundaries.
import warnings
with warnings.catch_warnings():
    warnings.simplefilter('ignore')
    import numpy as np
    from scipy import ndimage

def remember(filename):
    source=ROOT/filename
    sources[filename]=hashlib.sha256(source.read_bytes()).hexdigest()
    return Image.open(source).convert('RGBA')

def append(name,crop,factor,pivot=None,source=None,extra=None):
    dw,dh=crop.width*factor,crop.height*factor
    frame={'width':dw,'height':dh,'pivotX':pivot[0] if pivot else dw/2,'pivotY':pivot[1] if pivot else dh,'source':source or [0,0,crop.width,crop.height],**(extra or {})}
    sprites.setdefault(name,[]).append(frame)
    images.append((frame,crop.resize((max(1,round(dw*2)),max(1,round(dh*2))),Image.Resampling.LANCZOS)))

# The opening visual beat uses the same approved sneaker silhouette as a
# standalone raster prop: the shopkeeper gestures, then the shoe lifts clear
# of Sneakers before the run begins.
shoe_source='assets/imagegen/props/sneaker-off-v1.png'
shoe=remember(shoe_source)
shoe_bounds=shoe.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
if not shoe_bounds: raise ValueError('Cutscene sneaker has no visible alpha')
shoe_crop=shoe.crop(shoe_bounds)
append('cutsceneShoe',shoe_crop,118/shoe_crop.width,source=list(shoe_bounds),extra={'registration':'cutscene prop / ground'})

# New obstacle-only mechanics are full standalone rasters, but still enter the
# reviewed runtime atlas so the editor, offline build, and asset checker share
# the same source of truth as the older gameplay props.
for name, filename, width in [
    ('rollingCart','rolling-cart-v1.png',230),
    ('dropGate','drop-gate-v1.png',270),
    ('oilSlick','oil-slick-v1.png',210),
]:
    sheet=remember('assets/imagegen/obstacles/'+filename)
    bounds=sheet.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
    if not bounds:
        raise ValueError(f'Obstacle has no visible alpha: {name}')
    crop=sheet.crop(bounds)
    append(name,crop,width/crop.width,source=list(bounds),extra={'registration':'authored ground / obstacle mechanic'})

def components(sheet):
    alpha=np.array(sheet.getchannel('A'))
    labels,count=ndimage.label(alpha>32)
    objects=ndimage.find_objects(labels)
    result=[]
    for label,bounds in enumerate(objects,1):
        if bounds is None:continue
        mask=labels[bounds]==label
        if mask.sum()<2000:continue
        yy,xx=bounds
        x,y=max(0,xx.start-2),max(0,yy.start-2)
        right,bottom=min(sheet.width,xx.stop+2),min(sheet.height,yy.stop+2)
        region=labels[y:bottom,x:right]==label
        mask=ndimage.binary_dilation(region,iterations=2)
        crop=sheet.crop((x,y,right,bottom))
        crop.putalpha(Image.fromarray(np.where(mask,alpha[y:bottom,x:right],0).astype('uint8')))
        result.append((x,y,right,bottom,crop))
    return sorted(result,key=lambda f:f[0])

for name,filename,width in [
    ('conveyor','conveyor-v1.png',250),('bollards','bollards-v1.png',190),
    ('shutter','street-shutter-v1.png',360),('sweeper','street-sweeper-v1.png',246),
    ('crane','crane-hook-v1.png',246),
]:
    sheet=remember('assets/imagegen/obstacles/'+filename)
    half=sheet.crop((0,0,sheet.width//2,sheet.height))
    bounds=half.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
    crop=half.crop(bounds)
    append(name,crop,width/crop.width,source=list(bounds))
# Keep the truck whole: this asset is a single image, not a two-frame strip.
sheet=remember('assets/imagegen/obstacles/truck-side-v3.png')
bounds=sheet.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();crop=sheet.crop(bounds)
append('truck',crop,340/crop.width,source=list(bounds))

# Level signatures are grounded, non-collidable dressing props.  They stay in
# the same atlas as gameplay art so authored routes, the editor, and direct
# file launches all use one deterministic raster source of truth.
level_props_path = ROOT / 'assets' / 'level-props.json'
if level_props_path.exists():
    for name, data in json.loads(level_props_path.read_text()).items():
        sheet = remember(data['src'])
        bounds = sheet.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
        if not bounds:
            raise ValueError(f'Level prop has no visible alpha: {name}')
        crop = sheet.crop(bounds)
        append(name, crop, data['width'] / crop.width, source=list(bounds),
               extra={'registration': 'authored ground / level signature'})

# The street kit is one authored 5x2 sheet. Segmenting by its declared grid
# keeps the source deterministic while alpha-cropping each cell removes the
# artist's transparent room. The hitbox is then measured from the painted
# alpha, so physics follows the actual silhouette rather than a guessed cell.
street_kit_path = ROOT / 'assets' / 'street-kit.json'
if street_kit_path.exists():
    data = json.loads(street_kit_path.read_text())
    sheet = remember(data['sheet'])
    columns, rows = data['grid']['columns'], data['grid']['rows']
    cell_width, cell_height = sheet.width / columns, sheet.height / rows
    for index, item in enumerate(data['assets']):
        column, row = index % columns, index // columns
        cell = sheet.crop((round(column * cell_width), round(row * cell_height),
                           round((column + 1) * cell_width), round((row + 1) * cell_height)))
        alpha = np.array(cell.getchannel('A'))
        visible = alpha > 32
        bounds = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
        if not bounds:
            raise ValueError(f'Street kit cell has no visible alpha: {item["name"]}')
        crop = cell.crop(bounds)
        solid = alpha[bounds[1]:bounds[3], bounds[0]:bounds[2]] > 100
        ys, xs = np.where(solid)
        if len(xs) == 0:
            raise ValueError(f'Street kit cell has no solid alpha: {item["name"]}')
        left, right = xs.min(), xs.max() + 1
        top, bottom = ys.min(), ys.max() + 1
        factor = item['width'] / crop.width
        hitbox = [left * factor, 0, (right - left) * factor, (crop.height - top) * factor]
        append(item['name'], crop, factor, source=[round(column * cell_width) + bounds[0],
               round(row * cell_height) + bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1]],
               extra={'registration': 'smart alpha grid / street kit', 'cell': [column, row],
                      'label': item['label'], 'behavior': item['behavior'], 'hitbox': hitbox})

# Looping street dressing is authored as one transparent 8-cell strip per
# asset. Parse each fixed cell independently, derive a shared ground baseline,
# and retain the alpha footprint in the atlas metadata. This keeps animation
# registration deterministic even when a lid, sign, glow, or vapor plume
# changes the visible bounds from frame to frame.
looping_path = ROOT / 'assets' / 'imagegen' / 'looping' / 'manifest.json'
if looping_path.exists():
    data = json.loads(looping_path.read_text())
    for item in data['assets']:
        sheet = remember(item['src'])
        columns = int(data.get('grid', {}).get('columns', 8))
        if columns != 8 or sheet.width < columns:
            raise ValueError(f'Looping sheet must declare eight columns: {item["id"]}')
        cells = []
        for index in range(columns):
            left = round(index * sheet.width / columns)
            right = round((index + 1) * sheet.width / columns)
            cell = sheet.crop((left, 0, right, sheet.height))
            bounds = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
            if not bounds:
                raise ValueError(f'Looping cell has no visible alpha: {item["id"]} frame {index + 1}')
            cells.append((left, cell, bounds))
        baseline = max(bounds[3] for _, _, bounds in cells)
        max_height = max(bounds[3] - bounds[1] for _, _, bounds in cells)
        factor = item['worldHeight'] / max_height
        for index, (left, cell, bounds) in enumerate(cells):
            crop = cell.crop(bounds)
            pivot = ((crop.width * factor) / 2, (baseline - bounds[1]) * factor)
            append(item['spriteName'], crop, factor, pivot=pivot,
                   source=[left + bounds[0], bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1]],
                   extra={'sourceFrame': index, 'registration': 'looping alpha cell / shared baseline',
                          'loop': True, 'fps': data.get('fps', 4), 'assetId': item['id'],
                          'behavior': item.get('behavior', '')})

# The two pursuers are deliberately separate animation sources. All sheets
# are derived from the approved two-man reference: the gray-suit bald man and
# the blue-suit brown-haired man. Component parsing keeps each full character
# intact even when a hand, shoe, or running fist reaches a nominal cell edge.
def append_chaser_family(name, filename, height, expected, character, action,
                         ground=True):
    sheet = remember(filename)
    parts = components(sheet)
    assert len(parts) == expected, (name, len(parts))
    factor = height / max(p[3] - p[1] for p in parts)
    # Grounded actions share the lowest painted footline. Jump frames instead
    # use their own shoe edge because the player's physics supplies the shared
    # vertical arc at draw time.
    baseline = max(p[3] for p in parts)
    for index, (x, y, right, bottom, crop) in enumerate(parts):
        alpha = np.array(crop.getchannel('A'))
        rows = alpha[:max(1, int(alpha.shape[0] * .24))] > 100
        centers = np.where(rows)[1]
        axis = float(np.median(centers)) if len(centers) else crop.width / 2
        pivot_y = (baseline - y) * factor if ground else crop.height * factor
        append(name, crop, factor, pivot=(axis * factor, pivot_y),
               source=[x, y, right - x, bottom - y],
               extra={'sourceFrame': index,
                      'registration': 'head-axis / shared ground' if ground else 'head-axis / action anchor',
                      'character': character, 'action': action})

append_chaser_family('chaser', 'assets/imagegen/chaser/run-gray-suit-v1.png',
                     134, 8, 'gray-suit-bald', 'run')
append_chaser_family('chaser2', 'assets/imagegen/chaser/run-blue-suit-v1.png',
                     134, 8, 'blue-suit-brown-haired', 'run')
for name, prefix, character in [
    ('chaser', 'gray-suit', 'gray-suit-bald'),
    ('chaser2', 'blue-suit', 'blue-suit-brown-haired'),
]:
    append_chaser_family(f'{name}Start', f'assets/imagegen/chaser/start-point-{prefix}-v1.png',
                         134, 6, character, 'start-point')
    append_chaser_family(f'{name}Finish', f'assets/imagegen/chaser/out-of-breath-{prefix}-v1.png',
                         134, 6, character, 'out-of-breath')
    append_chaser_family(f'{name}Jump', f'assets/imagegen/chaser/jump-{prefix}-v1.png',
                         134, 4, character, 'jump', ground=False)
    append_chaser_family(f'{name}Roll', f'assets/imagegen/chaser/roll-{prefix}-v1.png',
                         90, 4, character, 'roll', ground=False)

# The delivery boss was generated as four isolated transparent frames rather
# than one touching contact sheet. Keep each source frame independently
# inspectable and register all four to the same painted wheel baseline.
def append_generated_family(name, filenames, height, character, action):
    parts=[]
    for filename in filenames:
        sheet=remember(filename)
        bounds=sheet.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
        if not bounds:
            raise ValueError(f'Generated frame has no visible alpha: {filename}')
        x,y,right,bottom=bounds
        parts.append((filename,x,y,right,bottom,sheet.crop(bounds)))
    factor=height/max(bottom-y for _,_,y,_,bottom,_ in parts)
    baseline=max(bottom for _,_,_,_,bottom,_ in parts)
    for index,(filename,x,y,right,bottom,crop) in enumerate(parts):
        alpha=np.array(crop.getchannel('A'))
        rows=alpha[:max(1,int(alpha.shape[0]*.24))]>100
        centers=np.where(rows)[1]
        axis=float(np.median(centers)) if len(centers) else crop.width/2
        append(name,crop,factor,pivot=(axis*factor,(baseline-y)*factor),
               source=[x,y,right-x,bottom-y],extra={
                   'sourceFrame':index,'registration':'head-axis / shared ground',
                   'character':character,'action':action})

append_generated_family('deliveryBoss', [
    'assets/imagegen/enemies/delivery-boss/run-v2-frames/frame-01.png',
    'assets/imagegen/enemies/delivery-boss/run-v2-frames/frame-02.png',
    'assets/imagegen/enemies/delivery-boss/run-v2-frames/frame-03.png',
    'assets/imagegen/enemies/delivery-boss/run-v2-frames/frame-04.png',
], 175, 'delivery-courier', 'run')

# The campaign-specific enemies are authored as four-panel transparent strips.
# Cell cropping keeps every frame independent, preserves the painted alpha,
# and gives each family a shared ground baseline without inventing new art.
def append_grid_family(name, filename, height, character, action, columns=4):
    sheet = remember(filename)
    parts=[]
    for index in range(columns):
        left=round(index*sheet.width/columns)
        right=round((index+1)*sheet.width/columns)
        cell=sheet.crop((left,0,right,sheet.height))
        bounds=cell.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
        if not bounds:
            raise ValueError(f'Generated grid frame has no visible alpha: {filename} frame {index + 1}')
        x,y,r,b=bounds
        parts.append((left,x,y,r,b,cell.crop(bounds)))
    factor=height/max(b-y for _,_,y,_,b,_ in parts)
    baseline=max(b for _,_,_,_,b,_ in parts)
    for index,(left,x,y,r,b,crop) in enumerate(parts):
        alpha=np.array(crop.getchannel('A'))
        rows=alpha[:max(1,int(alpha.shape[0]*.24))]>100
        centers=np.where(rows)[1]
        axis=float(np.median(centers)) if len(centers) else crop.width/2
        append(name,crop,factor,pivot=(axis*factor,(baseline-y)*factor),
               source=[left+x,y,r-x,b-y],extra={'sourceFrame':index,
               'registration':'head-axis / shared ground','character':character,
               'action':action,'gridFrame':index})

for name,filename,height,character in [
    ('chinatownDragon','assets/imagegen/enemies/chinatown-dragon/run-v1.png',166,'chinatown-dragon'),
    ('airportHandler','assets/imagegen/enemies/airport-handler/run-v1.png',145,'airport-baggage-handler'),
    ('airportCart','assets/imagegen/enemies/airport-baggage-cart/run-v1.png',138,'airport-baggage-cart'),
    ('airportSecurityDog','assets/imagegen/enemies/airport-security-dog/run-v1.png',148,'airport-security-dog'),
    ('airportBaggageBot','assets/imagegen/enemies/airport-baggage-bot/run-v1.png',150,'airport-baggage-bot'),
    ('airportSuitcases','assets/imagegen/obstacles/airport-suitcase-cluster/roll-v1.png',140,'airport-suitcase-cluster'),
    ('airportBaggageCluster','assets/imagegen/obstacles/airport-baggage-cluster/wobble-v1.png',140,'airport-baggage-cluster'),
    ('airportBoardingGate','assets/imagegen/obstacles/airport-boarding-gate/signal-v1.png',145,'airport-boarding-gate'),
    ('airportBoardingStanchion','assets/imagegen/obstacles/airport-boarding-stanchion/sway-v1.png',145,'airport-boarding-stanchion'),
    ('airportTugCart','assets/imagegen/obstacles/airport-tug-cart/rock-v1.png',145,'airport-tug-cart'),
    ('airportJetway','assets/imagegen/obstacles/airport-jetway/extend-v1.png',150,'airport-jetway'),
    ('airportJetwayChock','assets/imagegen/obstacles/airport-jetway-chock/blink-v1.png',145,'airport-jetway-chock'),
    ('airportJetwayDoor','assets/imagegen/obstacles/airport-jetway-door/blink-v1.png',145,'airport-jetway-door'),
    ('airportStairs','assets/imagegen/obstacles/airport-boarding-stairs/roll-v1.png',145,'airport-boarding-stairs'),
    ('subwayCart','assets/imagegen/obstacles/subway-maintenance-cart/roll-v1.png',138,'subway-maintenance-cart'),
    ('subwayToolbox','assets/imagegen/obstacles/subway-toolbox-cart/roll-v1.png',140,'subway-toolbox-cart'),
    ('subwayTurnstile','assets/imagegen/obstacles/subway-turnstile/spin-v1.png',145,'subway-turnstile'),
    ('subwayBench','assets/imagegen/obstacles/subway-platform-bench/wobble-v1.png',120,'subway-platform-bench'),
    ('subwaySignalBox','assets/imagegen/obstacles/subway-signal-box/blink-v1.png',145,'subway-signal-box'),
    ('subwaySignalLantern','assets/imagegen/obstacles/subway-signal-lantern/cycle-v1.png',145,'subway-signal-lantern'),
    ('subwayVendingMachine','assets/imagegen/obstacles/subway-vending-machine/pulse-v1.png',145,'subway-vending-machine'),
    ('subwayPlatformSign','assets/imagegen/obstacles/subway-platform-sign/blink-v1.png',145,'subway-platform-sign'),
    ('subwayRailJunction','assets/imagegen/obstacles/subway-rail-junction/spark-v1.png',145,'subway-rail-junction'),
    ('subwayTrackSwitch','assets/imagegen/obstacles/subway-track-switch/tilt-v1.png',145,'subway-track-switch'),
    ('subwayPlatformUmbrella','assets/imagegen/obstacles/subway-umbrella-stand/strap-v1.png',145,'subway-umbrella-stand'),
    ('subwayPlatformWarningLamp','assets/imagegen/obstacles/subway-platform-warning-lamp/blink-v1.png',145,'subway-platform-warning-lamp'),
    ('factoryBelt','assets/imagegen/obstacles/factory-sneaker-box/belt-v1.png',138,'factory-sneaker-box'),
    ('factoryPress','assets/imagegen/obstacles/factory-shoe-press/press-v1.png',140,'factory-shoe-press'),
    ('factoryShoePile','assets/imagegen/obstacles/factory-shoe-pile/lace-wobble-v1.png',140,'factory-shoe-pile'),
    ('factoryLaceBin','assets/imagegen/obstacles/factory-lace-bin/roll-v1.png',145,'factory-lace-bin'),
    ('factoryThreadCart','assets/imagegen/obstacles/factory-thread-cart/roll-v1.png',145,'factory-thread-cart'),
    ('factoryLabelRoll','assets/imagegen/obstacles/factory-label-roll/roll-v1.png',145,'factory-label-roll'),
    ('factoryRobotArm','assets/imagegen/obstacles/factory-robot-arm/reach-v1.png',145,'factory-robot-arm'),
    ('factorySneakerMold','assets/imagegen/obstacles/factory-sneaker-mold/press-v1.png',145,'factory-sneaker-mold'),
    ('factoryLaceSpool','assets/imagegen/obstacles/factory-lace-spool/roll-v1.png',145,'factory-lace-spool'),
    ('factoryLaceBundle','assets/imagegen/obstacles/factory-lace-bundle/roll-v1.png',145,'factory-lace-bundle'),
    ('factoryPolishWheel','assets/imagegen/obstacles/factory-polish-wheel/spin-v1.png',145,'factory-polish-wheel'),
    ('factoryShoeDryer','assets/imagegen/obstacles/factory-shoe-dryer/glow-v1.png',145,'factory-shoe-dryer'),
    ('factorySneakerTray','assets/imagegen/obstacles/factory-sneaker-tray/roll-v1.png',145,'factory-sneaker-tray'),
    ('factoryBoxChute','assets/imagegen/obstacles/factory-box-chute/slide-v1.png',145,'factory-box-chute'),
    ('factoryGluePuddle','assets/imagegen/obstacles/factory-glue-puddle/ripple-v1.png',34,'factory-glue-puddle'),
    ('yamRoller','assets/imagegen/obstacles/yam-roller/roll-v1.png',142,'yam-roller'),
    ('yamCrate','assets/imagegen/obstacles/yam-crate/rattle-v1.png',140,'yam-crate'),
    ('yamHarvestCrate','assets/imagegen/obstacles/yam-harvest-crate/wobble-v1.png',145,'yam-harvest-crate'),
    ('yamWheelbarrow','assets/imagegen/obstacles/yam-wheelbarrow/roll-v1.png',145,'yam-wheelbarrow'),
    ('yamSackBundle','assets/imagegen/obstacles/yam-sack-bundle/wobble-v1.png',145,'yam-sack-bundle'),
    ('yamFieldFence','assets/imagegen/obstacles/yam-field-fence/sway-v1.png',145,'yam-field-fence'),
    ('yamHarvestBasket','assets/imagegen/obstacles/yam-harvest-basket/wobble-v1.png',145,'yam-harvest-basket'),
    ('yamIrrigationSprinkler','assets/imagegen/obstacles/yam-irrigation-sprinkler/spray-v1.png',145,'yam-irrigation-sprinkler'),
    ('yamIrrigationWheel','assets/imagegen/obstacles/yam-irrigation-wheel/turn-v1.png',145,'yam-irrigation-wheel'),
    ('yamIrrigationWindmill','assets/imagegen/obstacles/yam-irrigation-windmill/turn-v1.png',145,'yam-irrigation-windmill'),
    ('yamHayBale','assets/imagegen/obstacles/yam-hay-bale/roll-v1.png',145,'yam-hay-bale'),
    ('yamScarecrow','assets/imagegen/enemies/yam-scarecrow/run-v1.png',160,'yam-scarecrow'),
    ('yamGobbler','assets/imagegen/enemies/yam-gobbler/run-v1.png',150,'yam-gobbler'),
    ('chinatownDrumCart','assets/imagegen/obstacles/chinatown-drum-cart/roll-v1.png',150,'chinatown-drum-cart'),
    ('chinatownLionCart','assets/imagegen/obstacles/chinatown-lion-cart/bob-v1.png',150,'chinatown-lion-cart'),
    ('chinatownLanternGate','assets/imagegen/obstacles/chinatown-lantern-gate/gate-v1.png',150,'chinatown-lantern-gate'),
    ('chinatownShopSign','assets/imagegen/obstacles/chinatown-shop-sign/swing-v1.png',145,'chinatown-shop-sign'),
    ('chinatownLanternCluster','assets/imagegen/obstacles/chinatown-lantern-cluster/sway-v1.png',145,'chinatown-lantern-cluster'),
    ('chinatownShopShutter','assets/imagegen/obstacles/chinatown-shop-shutter/rattle-v1.png',145,'chinatown-shop-shutter'),
    ('chinatownLanternPole','assets/imagegen/obstacles/chinatown-lantern-pole/sway-v1.png',150,'chinatown-lantern-pole'),
    ('chinatownMarketCrate','assets/imagegen/obstacles/chinatown-market-crate/wobble-v1.png',145,'chinatown-market-crate'),
    ('chinatownFirecrackerCrate','assets/imagegen/obstacles/chinatown-firecracker-crate/spark-v1.png',145,'chinatown-firecracker-crate'),
    ('chinatownFanStand','assets/imagegen/obstacles/chinatown-fan-stand/flicker-v1.png',145,'chinatown-fan-stand'),
    ('chinatownSteamCart','assets/imagegen/obstacles/chinatown-steam-cart/wobble-v1.png',145,'chinatown-steam-cart'),
    ('chinatownSteamBasket','assets/imagegen/obstacles/chinatown-steam-basket/steam-v1.png',145,'chinatown-steam-basket'),
    ('subwayTicketMachine','assets/imagegen/obstacles/subway-ticket-machine/blink-v1.png',145,'subway-ticket-machine'),
    ('subwayEmergencyBox','assets/imagegen/obstacles/subway-emergency-box/blink-v1.png',145,'subway-emergency-box'),
    ('rooftopDish','assets/imagegen/obstacles/rooftop-satellite-dish/swivel-v1.png',150,'rooftop-satellite-dish'),
    ('rooftopFan','assets/imagegen/obstacles/rooftop-hvac-fan/fan-v1.png',132,'rooftop-hvac-fan'),
    ('rooftopAntenna','assets/imagegen/obstacles/rooftop-antenna/wobble-v1.png',145,'rooftop-antenna'),
    ('rooftopClothesline','assets/imagegen/obstacles/rooftop-clothesline/flap-v1.png',145,'rooftop-clothesline'),
    ('rooftopClotheslineFlutter','assets/imagegen/obstacles/rooftop-clothesline-flutter/flutter-v1.png',145,'rooftop-clothesline-flutter'),
    ('rooftopBirdFlock','assets/imagegen/obstacles/rooftop-bird-flock/flap-v1.png',145,'rooftop-bird-flock'),
    ('rooftopWaterTank','assets/imagegen/obstacles/rooftop-water-tank/valve-v1.png',145,'rooftop-water-tank'),
    ('rooftopValveFlag','assets/imagegen/obstacles/rooftop-valve-flag/flutter-v1.png',145,'rooftop-valve-flag'),
    ('rooftopDishArray','assets/imagegen/obstacles/rooftop-dish-array/swivel-v1.png',145,'rooftop-dish-array'),
    ('rooftopCableAnchor','assets/imagegen/obstacles/rooftop-cable-anchor/uncoil-v1.png',145,'rooftop-cable-anchor'),
    ('rooftopPigeonCrate','assets/imagegen/obstacles/rooftop-pigeon-crate/peek-v1.png',145,'rooftop-pigeon-crate'),
    ('airportDepartureBoard','assets/imagegen/obstacles/airport-departure-board/blink-v1.png',145,'airport-departure-board'),
    ('airportSecurityScanner','assets/imagegen/obstacles/airport-security-scanner/pulse-v1.png',145,'airport-security-scanner'),
    ('airportRunwayCone','assets/imagegen/obstacles/airport-runway-cone/blink-v1.png',145,'airport-runway-cone'),
    ('airportSecurityTray','assets/imagegen/obstacles/airport-security-tray/scan-v1.png',145,'airport-security-tray'),
    ('airportBaggageCarousel','assets/imagegen/obstacles/airport-baggage-carousel/belt-v1.png',145,'airport-baggage-carousel'),
    ('airportSuitcasePile','assets/imagegen/obstacles/airport-suitcase-pile/wobble-v1.png',145,'airport-suitcase-pile'),
    ('sunsetBarrier','assets/imagegen/obstacles/sunset-traffic-barrier/roll-v1.png',132,'sunset-traffic-barrier'),
    ('sunsetSignal','assets/imagegen/obstacles/sunset-traffic-signal/lights-v1.png',145,'sunset-traffic-signal'),
    ('sunsetNeonSign','assets/imagegen/obstacles/sunset-neon-sign/pulse-v1.png',145,'sunset-neon-sign'),
    ('sunsetBollards','assets/imagegen/obstacles/sunset-bollards/blink-v1.png',145,'sunset-bollards'),
    ('sunsetLitSign','assets/imagegen/obstacles/sunset-lit-sign/pulse-v1.png',145,'sunset-lit-sign'),
    ('sneakerRack','assets/imagegen/obstacles/sneaker-display-rack/roll-v1.png',145,'sneaker-display-rack'),
    ('sneakerShopRope','assets/imagegen/obstacles/sneaker-shop-rope/sway-v1.png',145,'sneaker-shop-rope'),
    ('sneakerShopPolishCart','assets/imagegen/obstacles/sneaker-shop-polish-cart/roll-v1.png',145,'sneaker-shop-polish-cart'),
    ('sneakerShopBench','assets/imagegen/obstacles/sneaker-shop-bench/bob-v1.png',145,'sneaker-shop-bench'),
    ('sneakerLaceDisplay','assets/imagegen/obstacles/sneaker-lace-display/sway-v1.png',145,'sneaker-lace-display'),
    ('sneakerBoxTower','assets/imagegen/obstacles/sneaker-box-tower/wobble-v1.png',145,'sneaker-box-tower'),
    ('sneakerShopWindow','assets/imagegen/obstacles/sneaker-shop-window/wobble-v1.png',145,'sneaker-shop-window'),
    ('sneakerFittingMirror','assets/imagegen/obstacles/sneaker-fitting-mirror/shimmer-v1.png',145,'sneaker-fitting-mirror'),
    ('sneakerBoxStack','assets/imagegen/obstacles/sneaker-box-stack/wobble-v1.png',145,'sneaker-box-stack'),
    ('sneakerSalePennants','assets/imagegen/obstacles/sneaker-sale-pennants/sway-v1.png',145,'sneaker-sale-pennants'),
    ('victoryFan','assets/imagegen/props/victory-fan/cheer-v1.png',170,'victory-fan'),
    ('victoryFoamFinger','assets/imagegen/props/victory-foam-finger/cheer-v1.png',170,'victory-foam-finger'),
    ('victoryBanner','assets/imagegen/props/victory-banner/cheer-v1.png',170,'victory-banner'),
    ('victoryConfettiPopper','assets/imagegen/props/victory-confetti-popper/pop-v1.png',170,'victory-confetti-popper'),
    ('victoryPennant','assets/imagegen/props/victory-pennant/ripple-v1.png',170,'victory-pennant'),
    ('victoryDrum','assets/imagegen/props/victory-drum/cheer-v1.png',170,'victory-drum'),
    ('victoryCrowdDrum','assets/imagegen/obstacles/victory-crowd-drum/tap-v1.png',145,'victory-crowd-drum'),
    ('victoryScarf','assets/imagegen/props/victory-scarf/wave-v1.png',170,'victory-scarf'),
    ('victoryRibbonBouquet','assets/imagegen/props/victory-ribbon-bouquet/wave-v1.png',170,'victory-ribbon-bouquet'),
    ('victoryStarBadge','assets/imagegen/props/victory-star-badge/shine-v1.png',170,'victory-star-badge'),
    ('victoryBalloonCluster','assets/imagegen/props/victory-balloon-cluster/bob-v1.png',170,'victory-balloon-cluster'),
    ('victoryStarWreath','assets/imagegen/props/victory-star-wreath/flutter-v1.png',170,'victory-star-wreath'),
    ('victoryChampionCrown','assets/imagegen/props/victory-champion-crown/sparkle-v1.png',170,'victory-champion-crown'),
    ('victoryPomPoms','assets/imagegen/props/victory-pom-poms/shake-v1.png',170,'victory-pom-poms'),
    ('victoryScarfStand','assets/imagegen/props/victory-scarf-stand/wave-v1.png',170,'victory-scarf-stand'),
    ('victoryMegaphone','assets/imagegen/props/victory-megaphone/cheer-v1.png',170,'victory-megaphone'),
    ('victoryBarrelStack','assets/imagegen/obstacles/victory-barrel-stack/roll-v1.png',145,'victory-barrel-stack'),
    ('victoryConfettiCannon','assets/imagegen/obstacles/victory-confetti-cannon/pop-v1.png',145,'victory-confetti-cannon'),
    ('victoryHandPennant','assets/imagegen/obstacles/victory-hand-pennant/wave-v1.png',145,'victory-hand-pennant'),
    ('victoryBossBarrel','assets/imagegen/obstacles/victory-boss-barrel/roll-v1.png',145,'victory-boss-barrel'),
    ('sneakerMascot','assets/imagegen/enemies/sneaker-shop-mascot/run-v1.png',150,'sneaker-shop-mascot'),
    ('yamCreature','assets/imagegen/enemies/yam-creature/run-v1.png',142,'yam-creature'),
    ('factoryWorker','assets/imagegen/enemies/factory-box-worker/run-v1.png',145,'factory-box-worker'),
    ('factoryBoxRunner','assets/imagegen/enemies/factory-box-runner/run-v1.png',150,'factory-box-runner'),
    ('subwayConductor','assets/imagegen/enemies/subway-conductor/run-v1.png',148,'subway-conductor'),
]:
    append_grid_family(name,filename,height,character,'run')
append_grid_family('yamDrop','assets/imagegen/obstacles/yam-drop-v1.png',96,'falling-yam','projectile')

for name,folder,height,order in [
    ('rival','skateboard-rival',130,[1,2,3,4]),('courier','shoe-box-courier',144,list(range(8))),
    ('business','business-man-1',145,list(range(8))),('business2','business-man-2',148,list(range(8))),
    ('parking','parking-attendant',145,list(range(8))),('raincoat','raincoat-snatcher',146,list(range(8))),
    ('bike','bike-messenger',143,list(range(8))),('pigeons','pigeon-flock',88,[0,1,2,1]),
    ('roller','construction-roller',138,list(range(8))),('camera','camera-flash-chaser',153,list(range(8))),
]:
    sheet=remember('assets/imagegen/enemies/'+folder+'/run-v1.png')
    parts=components(sheet)
    assert len(parts)==8,(name,len(parts))
    factor=height/max(p[3]-p[1] for p in parts)
    baseline=sum(p[3] for p in parts)/len(parts)
    for index in order:
        x,y,right,bottom,crop=parts[index]
        # Register at the head/torso axis, not the changing arm-span midpoint.
        alpha=np.array(crop.getchannel('A'))
        rows=alpha[:max(1,int(alpha.shape[0]*.24))]>100
        centers=np.where(rows)[1]
        axis=float(np.median(centers)) if len(centers) else crop.width/2
        append(name,crop,factor,pivot=(axis*factor,(baseline-y)*factor),source=[x,y,right-x,bottom-y],extra={'sourceFrame':index,'registration':'head-axis / shared ground'})

coin_path='assets/imagegen/props/coin-spin-v2.png'
if (ROOT/coin_path).exists():
    # Only rotation changes apparent width; shared diameter and center stay fixed.
    images=[(f,im) for f,im in images if f not in sprites['coin']];sprites['coin']=[]
    sheet=remember(coin_path)
    for i in range(8):
        cx,cy=i%4*sheet.width/4,i//4*sheet.height/2
        cell=sheet.crop((round(cx),round(cy),round(cx+sheet.width/4),round(cy+sheet.height/2)))
        box=cell.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
        crop=cell.crop(box);factor=29/crop.height
        append('coin',crop,factor,pivot=(crop.width*factor/2,14.5),source=list(box),extra={'angle':i*45})

# Full-character run frames have authored registration in source coordinates.
# The floor is allowed to sit below a flight frame; never bottom-align the feet.
registration=ROOT/'assets/runner-registration.json'
if registration.exists():
    images=[(f,im) for f,im in images if f not in sprites['run']];sprites['run']=[]
    for pose in json.loads(registration.read_text())['frames']:
        sheet=remember(pose['src'])
        cell=sheet.crop(tuple(pose['cell'])) if 'cell' in pose else sheet
        box=cell.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
        crop=cell.crop(box);factor=pose['scale']
        append('run',crop,factor,pivot=((pose['anchor'][0]-box[0])*factor,(pose['anchor'][1]-box[1])*factor),source=list(box),extra={'phase':pose['phase'],'registration':'authored pelvis / ground','file':pose['src']})

# Keep the atlas under WebP's 16,383px dimension ceiling as the approved
# campaign grows. A wider atlas keeps generated four-frame families in one
# runtime texture while leaving headroom for continued asset additions.
atlas_width = 5120
x = y = row_height = 0
for frame, im in images:
    if x + im.width + 8 > atlas_width: x = 0; y += row_height; row_height = 0
    frame['rect'] = [x+4, y+4, im.width, im.height]
    x += im.width + 8
    row_height = max(row_height, im.height + 8)
atlas = Image.new('RGBA', (atlas_width, y + row_height))
for frame, im in images: atlas.paste(im, tuple(frame['rect'][:2]))
# Keep the runtime atlas below Cloudflare Pages' 25 MiB per-file limit while
# retaining the same dimensions, pivots, and transparent silhouettes. The
# source PNGs remain the lossless authoring record; the atlas is a delivery
# texture and uses high-quality WebP compression for the browser build.
atlas.save(OUT / 'sprites.webp', lossless=False, quality=80, method=6)
atlas_hash = hashlib.sha256((OUT / 'sprites.webp').read_bytes()).hexdigest()

# Keep a half-resolution delivery atlas for low-memory devices.  World-space
# measurements stay identical because the manifest scales the source geometry
# with the texture; only decoded pixels are reduced.  This keeps a 2 GB
# machine from allocating the full desktop atlas before the first level.
low_size = (atlas.width // 2, (atlas.height + 1) // 2)
low_atlas = atlas.resize(low_size, Image.Resampling.LANCZOS)
low_atlas.save(OUT / 'sprites-low.webp', lossless=False, quality=80, method=6)
low_atlas_hash = hashlib.sha256((OUT / 'sprites-low.webp').read_bytes()).hexdigest()

# A tiny, silent homepage preview uses the same reviewed run poses without
# asking the homepage to decode the full gameplay atlas. The cells have more
# transparent breathing room than the gameplay crops so CSS steps animation
# cannot trim a hand, shoe, or hat at a responsive edge.
HOME_CELL_WIDTH, HOME_CELL_HEIGHT = 320, 360
HOME_CENTER_X, HOME_BASELINE = 160, 340
preview = Image.new('RGBA', (HOME_CELL_WIDTH * len(sprites['run']), HOME_CELL_HEIGHT), (0, 0, 0, 0))
for index, frame in enumerate(sprites['run']):
    x, y, width, height = frame['rect']
    crop = atlas.crop((x, y, x + width, y + height))
    left = round(index * HOME_CELL_WIDTH + HOME_CENTER_X - frame['pivotX'] * 2)
    top = round(HOME_BASELINE - frame['pivotY'] * 2)
    preview.alpha_composite(crop, (left, top))
preview.save(OUT / 'home-runner.webp', lossless=False, quality=86, method=4)
preview_hash = hashlib.sha256((OUT / 'home-runner.webp').read_bytes()).hexdigest()

# The homepage race uses the same approved chaser poses as gameplay. Keep the
# preview sheets separate from the full atlas so the landing page decodes only
# the three small animation strips it actually displays.
def build_home_preview(sprite_name, filename):
    frames = sprites[sprite_name]
    sheet = Image.new('RGBA', (HOME_CELL_WIDTH * len(frames), HOME_CELL_HEIGHT), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        x, y, width, height = frame['rect']
        crop = atlas.crop((x, y, x + width, y + height))
        left = round(index * HOME_CELL_WIDTH + HOME_CENTER_X - frame['pivotX'] * 2)
        top = round(HOME_BASELINE - frame['pivotY'] * 2)
        sheet.alpha_composite(crop, (left, top))
    sheet.save(OUT / filename, lossless=False, quality=86, method=4)
    return {'image': filename, 'sha256': hashlib.sha256((OUT / filename).read_bytes()).hexdigest(), 'frames': len(frames)}

homepage_chasers = {
    'gray': build_home_preview('chaser', 'home-chaser-gray.webp'),
    'blue': build_home_preview('chaser2', 'home-chaser-blue.webp'),
}

# Standalone gameplay rasters are delivered as WebP instead of shipping their
# large authoring PNGs to the browser. Compact copies keep the same aspect
# ratio and world-space size while halving decoded pixels for 2 GB devices.
for name, filename in [
    ('flow-badge', 'assets/imagegen/pickups/flow-badge-v2.png'),
    ('stomp-burst', 'assets/imagegen/vfx/stomp-burst-v2.png'),
    ('rolling-cart', 'assets/imagegen/obstacles/rolling-cart-v1.png'),
    ('drop-gate', 'assets/imagegen/obstacles/drop-gate-v1.png'),
    ('oil-slick', 'assets/imagegen/obstacles/oil-slick-v1.png'),
]:
    source = Image.open(ROOT / filename).convert('RGBA')
    for suffix, scale in [('', 1), ('-low', .5)]:
        size = (max(1, round(source.width * scale)), max(1, round(source.height * scale)))
        delivery = source if scale == 1 else source.resize(size, Image.Resampling.LANCZOS)
        delivery.save(OUT / f'{name}{suffix}.webp', lossless=True, method=6)

kit_source = Image.open(OUT / 'urban-hazard-kit-v1.png').convert('RGBA')
kit_source.save(OUT / 'urban-hazard-kit.webp', lossless=True, method=6)
kit_source.resize((kit_source.width // 2, kit_source.height // 2), Image.Resampling.LANCZOS).save(
    OUT / 'urban-hazard-kit-low.webp', lossless=True, method=6)
for source in sorted((ROOT / 'assets/imagegen/streets-v2').glob('*.png')):
    sources[str(source.relative_to(ROOT))] = hashlib.sha256(source.read_bytes()).hexdigest()
    im = Image.open(source).convert('RGB')
    im.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
    im.save(OUT / (source.stem + '.webp'), quality=92, method=6)
(OUT / 'sprites.json').write_text(json.dumps({'version': 3, 'size': [atlas.width, atlas.height],
    'atlasHash': atlas_hash,
    'provenance': 'Original ChatGPT Image Gen rasters, uniformly resampled into an atlas',
    'image': 'sprites.webp', 'sprites': sprites, 'sources': sources,
    # Compact sprite geometry is derived from the full metadata at load time;
    # duplicating every frame here cost hundreds of KB before any art loaded.
    'lowMemory': {'size': list(low_size), 'atlasHash': low_atlas_hash, 'image': 'sprites-low.webp'},
    'homepagePreview': {'image': 'home-runner.webp', 'sha256': preview_hash, 'frames': len(sprites['run']), 'chasers': homepage_chasers}}, indent=2) + '\n')
shutil.copyfile(ROOT / 'assets/imagegen/props/coin-icon-v1.png', OUT / 'app-icon.png')
print(f'{len(images)} complete frames, atlas {atlas.width} x {atlas.height}, {sum(p.stat().st_size for p in OUT.iterdir())/1024/1024:.2f} MiB runtime art')
