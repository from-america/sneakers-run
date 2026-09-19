// The complete internal builder library. Each idea is a real, placeable
// catalog entry with a gameplay verb, environment profile, and a reviewed
// raster family to preview. Families deliberately share art and collision
// contracts so a workshop route stays deterministic while the library grows.
const item = (id, name, group, base, behavior, profile = 'universal', kind = 'entity', note = '') =>
  Object.freeze({ id, name, group, base, behavior, profile, kind, note });

export const BUILDER_CATALOG = Object.freeze([
  // Lethal hazards
  item('construction-spikes', 'Construction spikes', 'LETHAL HAZARDS', 'spikes', 'instant defeat', 'universal', 'entity', 'Jump over the marked strip.'),
  item('electrified-third-rail', 'Electrified third rail', 'LETHAL HAZARDS', 'electric', 'instant defeat', 'enclosed', 'entity', 'Jump over the pulsing rail.'),
  item('molten-asphalt-trench', 'Molten asphalt trench', 'LETHAL HAZARDS', 'spikes', 'instant defeat', 'open', 'entity', 'Static lava equivalent with safe curb edges.'),
  item('open-elevator-shaft', 'Open elevator shaft', 'LETHAL HAZARDS', 'spikes', 'fall zone', 'enclosed', 'entity', 'Framed bottomless gap.'),
  item('rooftop-gap', 'Rooftop gap', 'LETHAL HAZARDS', 'spikes', 'fall zone', 'open', 'entity', 'Parapet end caps define the landing.'),
  item('crushing-loading-shutter', 'Crushing loading shutter', 'LETHAL HAZARDS', 'shutter', 'crush', 'enclosed', 'entity', 'Static preview; timing belongs to the fixed-step phase.'),
  item('falling-wrecking-ball', 'Falling wrecking ball', 'LETHAL HAZARDS', 'crane', 'jump or cover', 'semi-enclosed', 'entity', 'Impact zone remains telegraphed.'),
  item('arc-welder-burst', 'Arc-welder burst', 'LETHAL HAZARDS', 'electric', 'jump or cover', 'enclosed', 'entity', 'Side-facing spark jet.'),
  item('broken-glass-bed', 'Broken glass bed', 'LETHAL HAZARDS', 'spikes', 'instant defeat', 'universal', 'entity', 'Low strip cleared by jumping.'),
  item('oncoming-train-lane', 'Oncoming train lane', 'LETHAL HAZARDS', 'train', 'jump or cover', 'enclosed', 'entity', 'Use as a static train obstacle in the scroller.'),

  // Moving traversal
  item('cargo-lift', 'Cargo lift', 'MOVING TRAVERSAL', 'platform', 'rideable vertical platform', 'enclosed'),
  item('crane-pallet', 'Crane pallet', 'MOVING TRAVERSAL', 'platform', 'rideable horizontal platform', 'semi-enclosed'),
  item('window-washer-cradle', 'Window-washer cradle', 'MOVING TRAVERSAL', 'platform', 'rideable vertical platform', 'open'),
  item('subway-service-cart', 'Subway service cart', 'MOVING TRAVERSAL', 'conveyor', 'rideable rail cart', 'enclosed'),
  item('ferry-gangway', 'Ferry gangway', 'MOVING TRAVERSAL', 'platform', 'tilting traversal', 'open'),
  item('forklift-forks', 'Forklift forks', 'MOVING TRAVERSAL', 'truck', 'short-cycle lift', 'enclosed'),
  item('scissor-lift', 'Scissor lift', 'MOVING TRAVERSAL', 'platform', 'expanding rideable top', 'enclosed'),
  item('construction-hoist', 'Construction hoist', 'MOVING TRAVERSAL', 'platform', 'vertical carrier', 'enclosed'),
  item('swinging-sign-platform', 'Swinging sign platform', 'MOVING TRAVERSAL', 'platform', 'pendulum traversal', 'open'),
  item('rotating-billboard-arm', 'Rotating billboard arm', 'MOVING TRAVERSAL', 'platform', 'hub orbit traversal', 'open'),

  // Platform and terrain pieces
  item('one-way-fire-escape', 'One-way fire escape', 'PLATFORM & TERRAIN', 'fireEscape', 'jump-through platform', 'semi-enclosed'),
  item('collapsing-scaffold', 'Collapsing scaffold', 'PLATFORM & TERRAIN', 'platform', 'drop and reset', 'semi-enclosed'),
  item('breakaway-awning', 'Breakaway awning', 'PLATFORM & TERRAIN', 'platform', 'soft landing then drop', 'semi-enclosed'),
  item('stompable-crate-stack', 'Stompable crate stack', 'PLATFORM & TERRAIN', 'barrel', 'stomp and destroy', 'universal'),
  item('springboard-pallet', 'Springboard pallet', 'PLATFORM & TERRAIN', 'platform', 'authored launch', 'universal'),
  item('inflatable-crash-mat', 'Inflatable crash mat', 'PLATFORM & TERRAIN', 'platform', 'low bounce', 'universal'),
  item('wall-bounce-panel', 'Wall-bounce panel', 'PLATFORM & TERRAIN', 'shutter', 'redirect jump', 'universal'),
  item('slide-ramp', 'Slide ramp', 'PLATFORM & TERRAIN', 'platform', 'convert height to speed', 'open'),
  item('icy-freezer-floor', 'Icy freezer floor', 'PLATFORM & TERRAIN', 'conveyor', 'reduced traction', 'enclosed'),
  item('sticky-tar-patch', 'Sticky tar patch', 'PLATFORM & TERRAIN', 'conveyor', 'slow surface', 'universal'),

  // Timed obstacles; all are authored around jump or cover decisions.
  item('retracting-bollards', 'Retracting bollards', 'TIMED OBSTACLES', 'bollards', 'jump or wait', 'open'),
  item('parking-gate-arm', 'Parking gate arm', 'TIMED OBSTACLES', 'gate', 'jump or roll', 'open'),
  item('opening-security-gate', 'Opening security gate', 'TIMED OBSTACLES', 'securityGate', 'switch then pass', 'enclosed'),
  item('traffic-light-crossing', 'Traffic-light crossing', 'TIMED OBSTACLES', 'barrier', 'jump or cover', 'open'),
  item('swinging-construction-hook', 'Swinging construction hook', 'TIMED OBSTACLES', 'crane', 'jump or cover', 'semi-enclosed'),
  item('rotating-rooftop-fan', 'Rotating rooftop fan', 'TIMED OBSTACLES', 'electric', 'jump or cover', 'open'),
  item('steam-vent', 'Steam vent', 'TIMED OBSTACLES', 'conveyor', 'jump or cover', 'enclosed'),
  item('fire-hydrant-jet', 'Fire hydrant jet', 'TIMED OBSTACLES', 'barrel', 'jump or cover', 'open'),
  item('automatic-car-wash-brush', 'Automatic car-wash brush', 'TIMED OBSTACLES', 'car', 'jump or roll', 'enclosed'),
  item('subway-turnstile', 'Subway turnstile', 'TIMED OBSTACLES', 'bollards', 'jump or roll', 'enclosed'),

  // Logic and goals
  item('finish-checkpoint', 'Finish checkpoint', 'LOGIC & GOALS', 'finish', 'complete route', 'universal'),
  item('mid-block-checkpoint', 'Mid-block checkpoint', 'LOGIC & GOALS', 'checkpoint', 'set respawn marker', 'universal'),
  item('floor-button', 'Floor button', 'LOGIC & GOALS', 'button', 'activate linked gate', 'universal'),
  item('wall-switch', 'Wall switch', 'LOGIC & GOALS', 'button', 'jump-height trigger', 'universal'),
  item('keycard-pickup', 'Keycard pickup', 'LOGIC & GOALS', 'shield', 'open matching gate', 'enclosed', 'pickup'),
  item('sneaker-key-pickup', 'Sneaker key pickup', 'LOGIC & GOALS', 'coin', 'open branded lock', 'universal', 'pickup'),
  item('timed-relay-beacon', 'Timed relay beacon', 'LOGIC & GOALS', 'checkpoint', 'start authored relay', 'universal'),
  item('enemy-clear-gate', 'Enemy-clear gate', 'LOGIC & GOALS', 'securityGate', 'open after stomps', 'universal'),
  item('coin-count-gate', 'Coin-count gate', 'LOGIC & GOALS', 'securityGate', 'open after local total', 'universal'),
  item('route-fork-sign', 'Route fork sign', 'LOGIC & GOALS', 'barrier', 'branch cue', 'universal'),

  // Interactive and destructible props
  item('pushable-dumpster', 'Pushable dumpster', 'INTERACTIVE PROPS', 'truck', 'push or use as cover', 'open'),
  item('rolling-barrel', 'Rolling barrel', 'INTERACTIVE PROPS', 'barrel', 'roll and defeat enemies', 'universal'),
  item('kickable-traffic-cone', 'Kickable traffic cone', 'INTERACTIVE PROPS', 'barrier', 'small switch object', 'universal'),
  item('breakable-plywood-wall', 'Breakable plywood wall', 'INTERACTIVE PROPS', 'shutter', 'rush or stomp break', 'enclosed'),
  item('chain-link-gate', 'Chain-link gate', 'INTERACTIVE PROPS', 'securityGate', 'rattle then break', 'open'),
  item('stacked-shoe-boxes', 'Stacked shoe boxes', 'INTERACTIVE PROPS', 'barrel', 'collapsible branded crates', 'universal'),
  item('glass-storefront-panel', 'Glass storefront panel', 'INTERACTIVE PROPS', 'shutter', 'breakable shortcut', 'semi-enclosed'),
  item('loose-manhole-cover', 'Loose manhole cover', 'INTERACTIVE PROPS', 'barrier', 'flip platform or projectile', 'open'),
  item('hanging-cargo-net', 'Hanging cargo net', 'INTERACTIVE PROPS', 'fireEscape', 'swaying climbable', 'semi-enclosed'),
  item('portable-ladder', 'Portable ladder', 'INTERACTIVE PROPS', 'fireEscape', 'registered climb route', 'universal'),

  // Enemy roles
  item('stationary-security-guard', 'Stationary security guard', 'ENEMY ROLES', 'business', 'stompable lane guard', 'universal'),
  item('charging-delivery-worker', 'Charging delivery worker', 'ENEMY ROLES', 'courier', 'telegraph then charge', 'universal'),
  item('jumping-rival', 'Jumping rival', 'ENEMY ROLES', 'rival', 'predictable jump', 'universal'),
  item('shielded-bouncer', 'Shielded bouncer', 'ENEMY ROLES', 'business2', 'front shield, stompable', 'universal'),
  item('pigeon-dive-flock', 'Pigeon dive flock', 'ENEMY ROLES', 'pigeons', 'formation then dive', 'open'),
  item('remote-camera-drone', 'Remote-camera drone', 'ENEMY ROLES', 'camera', 'horizontal patrol', 'universal'),
  item('sweeper-driver', 'Sweeper driver', 'ENEMY ROLES', 'sweeper', 'reversing vehicle enemy', 'open'),
  item('cone-thrower', 'Cone thrower', 'ENEMY ROLES', 'parking', 'telegraphed projectile', 'universal'),
  item('manhole-ambusher', 'Manhole ambusher', 'ENEMY ROLES', 'roller', 'fixed opening cycle', 'open'),
  item('rooftop-photographer', 'Rooftop photographer', 'ENEMY ROLES', 'camera', 'flash telegraph', 'open'),

  // Pickups and rewards
  item('large-coin-medallion', 'Large coin medallion', 'PICKUPS & REWARDS', 'coin', 'high-value optional reward', 'universal', 'pickup'),
  item('coin-trail-spline', 'Coin trail spline', 'PICKUPS & REWARDS', 'coin', 'evenly spaced coin arc', 'universal', 'pickup'),
  item('shield-refill', 'Shield refill', 'PICKUPS & REWARDS', 'shield', 'restore one hit', 'universal', 'pickup'),
  item('magnet-extender', 'Magnet extender', 'PICKUPS & REWARDS', 'magnet', 'extend active magnet', 'universal', 'pickup'),
  item('rush-extender', 'Rush extender', 'PICKUPS & REWARDS', 'speed', 'extend rush', 'universal', 'pickup'),
  item('extra-chance-token', 'Extra chance token', 'PICKUPS & REWARDS', 'shield', 'rare life pickup', 'universal', 'pickup'),
  item('score-cassette', 'Score cassette', 'PICKUPS & REWARDS', 'speed', 'hidden exploration score', 'universal', 'pickup'),
  item('golden-sneaker', 'Golden sneaker', 'PICKUPS & REWARDS', 'speed', 'one-per-block secret', 'universal', 'pickup'),
  item('streak-bank-marker', 'Streak bank marker', 'PICKUPS & REWARDS', 'magnet', 'bank current streak', 'universal', 'pickup'),
  item('mystery-shoe-box', 'Mystery shoe box', 'PICKUPS & REWARDS', 'barrel', 'seeded reward container', 'universal'),

  // Modular architecture
  item('platform-support-assembler-kit', 'Platform support assembler kit', 'MODULAR ARCHITECTURE', 'platform', 'repeatable support modules', 'universal'),
  item('parking-garage-column-kit', 'Parking-garage column kit', 'MODULAR ARCHITECTURE', 'shutter', 'column family', 'enclosed'),
  item('rooftop-parapet-kit', 'Rooftop parapet kit', 'MODULAR ARCHITECTURE', 'platform', 'gap edge family', 'open'),
  item('fire-escape-kit', 'Fire-escape kit', 'MODULAR ARCHITECTURE', 'fireEscape', 'stairs, rails, brackets', 'semi-enclosed'),
  item('scaffold-kit', 'Scaffold kit', 'MODULAR ARCHITECTURE', 'platform', 'bays, braces, decks', 'semi-enclosed'),
  item('subway-platform-kit', 'Subway-platform kit', 'MODULAR ARCHITECTURE', 'train', 'edge, columns, mouths', 'enclosed'),
  item('warehouse-rack-kit', 'Warehouse-rack kit', 'MODULAR ARCHITECTURE', 'shutter', 'uprights, beams, pallets', 'enclosed'),
  item('market-stall-kit', 'Market-stall kit', 'MODULAR ARCHITECTURE', 'platform', 'canopy and counter family', 'semi-enclosed'),
  item('bridge-maintenance-kit', 'Bridge-maintenance kit', 'MODULAR ARCHITECTURE', 'crane', 'beams, piers, catwalks', 'open'),
  item('alley-service-kit', 'Alley-service kit', 'MODULAR ARCHITECTURE', 'truck', 'doors, pipes, vents', 'enclosed'),

  // Readability, atmosphere, and event markers
  item('hazard-stripe-decal-set', 'Hazard stripe decal set', 'READABILITY & MARKERS', 'spikes', 'warning marker', 'universal'),
  item('landing-zone-paint', 'Landing-zone paint', 'READABILITY & MARKERS', 'platform', 'jump destination marker', 'universal'),
  item('patrol-endpoint-markers', 'Patrol endpoint markers', 'READABILITY & MARKERS', 'barrier', 'path endpoint cue', 'universal'),
  item('checkpoint-light-tower', 'Checkpoint light tower', 'READABILITY & MARKERS', 'checkpoint', 'red/amber/green state', 'universal'),
  item('directional-street-signs', 'Directional street signs', 'READABILITY & MARKERS', 'gate', 'jump, roll, climb, stomp cue', 'universal'),
  item('foreground-shadow-modules', 'Foreground shadow modules', 'READABILITY & MARKERS', 'platform', 'contact shadow family', 'universal'),
  item('environment-transition-portal', 'Environment transition portal', 'READABILITY & MARKERS', 'gate', 'scene profile handoff', 'universal'),
  item('crowd-barrier-kit', 'Crowd barrier kit', 'READABILITY & MARKERS', 'barrier', 'rails, feet, banners', 'open'),
  item('weather-emitter-set', 'Weather emitter set', 'READABILITY & MARKERS', 'electric', 'rain, drip, steam zones', 'universal'),
  item('victory-dressing-kit', 'Victory dressing kit', 'READABILITY & MARKERS', 'finish', 'tape, flashes, confetti', 'universal'),
]);

export const BUILDER_BY_ID = Object.freeze(Object.fromEntries(BUILDER_CATALOG.map(entry => [entry.id, entry])));
export const BUILDER_GROUPS = Object.freeze([...new Set(BUILDER_CATALOG.map(entry => entry.group))]);
export const BUILDER_COUNT = BUILDER_CATALOG.length;

if (BUILDER_COUNT !== 100) throw new Error(`Builder catalog must contain 100 ideas; found ${BUILDER_COUNT}`);
