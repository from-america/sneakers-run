const freeze = (value) => Object.freeze(value);

const band = ({ sourceTop, sourceBottom, screenTop, screenBottom, travel, opacity }) => freeze({
  sourceTop,
  sourceBottom,
  screenTop,
  screenBottom,
  travel,
  opacity
});

const background = ({
  key,
  file,
  title,
  landmark,
  atmosphere,
  palette,
  lowerBand,
  baseTravel,
  bands
}) => freeze({
  key,
  file,
  title,
  landmark,
  atmosphere,
  palette: freeze(palette),
  provenance: 'ChatGPT Image Gen raster PNG',
  dimensions: freeze({ width: 1672, height: 941 }),
  decodedBytes: 6293408,
  loadPriority: key === 'storyGetaway' ? 'ready' : 'level',
  lowerBand: freeze(lowerBand),
  depth: freeze({
    baseTravel,
    bands: freeze(bands)
  })
});

export const BACKGROUND_ART_DIRECTION = freeze({
  style: 'original adult-animated suburban-comedy sensibility',
  medium: 'raster artwork generated with ChatGPT Image Gen',
  sharedLanguage: 'confident ink, flat cel shading, warm street color, graphic silhouettes',
  forbidden: 'direct imitation of a named show; copied characters, locations, props, wardrobe, logos, catchphrases, or exact compositions',
  gameplayBand: 'historical dense plates; do not infer artistic approval from this metadata'
});

// Historical Image Gen plates, superseded in the runtime by streets-v2. The metadata is intentionally
// separate from the campaign level names: a plate can be composed as a route
// location while keeping its generated illustration title intact.
export const BACKGROUND_MANIFEST = freeze([
  background({
    key: 'storyGetaway',
    file: '01-waterfront-diner.png',
    title: 'Waterfront Diner',
    landmark: 'Striped diner canopy',
    atmosphere: 'dusk',
    palette: ['#ffe05d', '#ff6670', '#2255aa'],
    lowerBand: { groundLine: 0.735, texture: 'wet-curb-glow', foreground: 'dock-rail silhouettes' },
    baseTravel: 0.10,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.48, screenTop: 0, screenBottom: 0.49, travel: 0.12, opacity: 0.06 }),
      band({ sourceTop: 0.36, sourceBottom: 0.80, screenTop: 0.38, screenBottom: 0.81, travel: 0.36, opacity: 0.10 }),
      band({ sourceTop: 0.69, sourceBottom: 1, screenTop: 0.70, screenBottom: 1, travel: 0.72, opacity: 0.16 })
    ]
  }),
  background({
    key: 'storyRooftop',
    file: '02-rooftop-sunset.png',
    title: 'Rooftop Sunset',
    landmark: 'Water-tank roofline',
    atmosphere: 'sunset',
    palette: ['#59dfd0', '#ff6670', '#181a34'],
    lowerBand: { groundLine: 0.715, texture: 'painted-roof-seams', foreground: 'antenna and fire-escape silhouettes' },
    baseTravel: 0.08,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.44, screenTop: 0, screenBottom: 0.45, travel: 0.10, opacity: 0.06 }),
      band({ sourceTop: 0.31, sourceBottom: 0.78, screenTop: 0.34, screenBottom: 0.80, travel: 0.34, opacity: 0.10 }),
      band({ sourceTop: 0.68, sourceBottom: 1, screenTop: 0.68, screenBottom: 1, travel: 0.66, opacity: 0.16 })
    ]
  }),
  background({
    key: 'storyLastBlock',
    file: '03-underpass-rain.png',
    title: 'Underpass Rain',
    landmark: 'Twin underpass arches',
    atmosphere: 'rain',
    palette: ['#2255aa', '#59dfd0', '#ffe7b0'],
    lowerBand: { groundLine: 0.755, texture: 'rain-puddle-ribbons', foreground: 'reflective barrier silhouettes' },
    baseTravel: 0.07,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.46, screenTop: 0, screenBottom: 0.48, travel: 0.09, opacity: 0.06 }),
      band({ sourceTop: 0.34, sourceBottom: 0.80, screenTop: 0.37, screenBottom: 0.81, travel: 0.32, opacity: 0.10 }),
      band({ sourceTop: 0.71, sourceBottom: 1, screenTop: 0.70, screenBottom: 1, travel: 0.64, opacity: 0.16 })
    ]
  }),
  background({
    key: 'storyNeonMarket',
    file: '04-neon-market.png',
    title: 'Neon Market',
    landmark: 'Three-bay market awning',
    atmosphere: 'late-evening glow',
    palette: ['#ff6670', '#59dfd0', '#ffe05d'],
    lowerBand: { groundLine: 0.742, texture: 'tile-and-reflection-grid', foreground: 'cart and canopy silhouettes' },
    baseTravel: 0.09,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.42, screenTop: 0, screenBottom: 0.44, travel: 0.11, opacity: 0.06 }),
      band({ sourceTop: 0.30, sourceBottom: 0.77, screenTop: 0.33, screenBottom: 0.79, travel: 0.38, opacity: 0.10 }),
      band({ sourceTop: 0.67, sourceBottom: 1, screenTop: 0.69, screenBottom: 1, travel: 0.74, opacity: 0.17 })
    ]
  }),
  background({
    key: 'storySubwayPlatform',
    file: '05-subway-platform.png',
    title: 'Subway Platform',
    landmark: 'Split platform clock',
    atmosphere: 'cool work lights',
    palette: ['#59dfd0', '#ffe7b0', '#2255aa'],
    lowerBand: { groundLine: 0.772, texture: 'platform-edge-stripes', foreground: 'signal-box silhouettes' },
    baseTravel: 0.06,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.49, screenTop: 0, screenBottom: 0.51, travel: 0.08, opacity: 0.06 }),
      band({ sourceTop: 0.37, sourceBottom: 0.82, screenTop: 0.40, screenBottom: 0.84, travel: 0.29, opacity: 0.10 }),
      band({ sourceTop: 0.73, sourceBottom: 1, screenTop: 0.72, screenBottom: 1, travel: 0.58, opacity: 0.16 })
    ]
  }),
  background({
    key: 'storyBasketballBlock',
    file: '06-basketball-block.png',
    title: 'Basketball Block',
    landmark: 'Backboard roofline',
    atmosphere: 'overcast afternoon',
    palette: ['#ff6670', '#ffe05d', '#2255aa'],
    lowerBand: { groundLine: 0.728, texture: 'court-paint bands', foreground: 'fence and bleacher silhouettes' },
    baseTravel: 0.11,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.43, screenTop: 0, screenBottom: 0.45, travel: 0.13, opacity: 0.06 }),
      band({ sourceTop: 0.32, sourceBottom: 0.79, screenTop: 0.35, screenBottom: 0.81, travel: 0.40, opacity: 0.11 }),
      band({ sourceTop: 0.69, sourceBottom: 1, screenTop: 0.70, screenBottom: 1, travel: 0.78, opacity: 0.16 })
    ]
  }),
  background({
    key: 'storyIndustrialBridge',
    file: '07-industrial-bridge.png',
    title: 'Industrial Bridge',
    landmark: 'Lift-bridge counterweight',
    atmosphere: 'windy storm front',
    palette: ['#2255aa', '#ff6670', '#59dfd0'],
    lowerBand: { groundLine: 0.748, texture: 'riveted deck reflections', foreground: 'cable and gantry silhouettes' },
    baseTravel: 0.05,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.47, screenTop: 0, screenBottom: 0.49, travel: 0.07, opacity: 0.06 }),
      band({ sourceTop: 0.35, sourceBottom: 0.81, screenTop: 0.38, screenBottom: 0.82, travel: 0.27, opacity: 0.10 }),
      band({ sourceTop: 0.70, sourceBottom: 1, screenTop: 0.71, screenBottom: 1, travel: 0.60, opacity: 0.17 })
    ]
  }),
  background({
    key: 'storyUpliftCrosswalk',
    file: '08-uplift-crosswalk.png',
    title: 'Uplift Crosswalk',
    landmark: 'Stacked crosswalk signal',
    atmosphere: 'bright wind after rain',
    palette: ['#ffe05d', '#59dfd0', '#181a34'],
    lowerBand: { groundLine: 0.738, texture: 'painted crosswalk rhythm', foreground: 'signal-pole silhouettes' },
    baseTravel: 0.12,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.41, screenTop: 0, screenBottom: 0.43, travel: 0.14, opacity: 0.06 }),
      band({ sourceTop: 0.29, sourceBottom: 0.76, screenTop: 0.32, screenBottom: 0.79, travel: 0.42, opacity: 0.10 }),
      band({ sourceTop: 0.66, sourceBottom: 1, screenTop: 0.68, screenBottom: 1, travel: 0.80, opacity: 0.16 })
    ]
  }),
  background({
    key: 'storyWarehouseDistrict',
    file: '09-warehouse-district.png',
    title: 'Warehouse District',
    landmark: 'Loading-bay stack',
    atmosphere: 'blue-hour delivery shift',
    palette: ['#ff6670', '#2255aa', '#ffe7b0'],
    lowerBand: { groundLine: 0.764, texture: 'loading-lane chevrons', foreground: 'crate and dock silhouettes' },
    baseTravel: 0.065,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.45, screenTop: 0, screenBottom: 0.47, travel: 0.085, opacity: 0.06 }),
      band({ sourceTop: 0.33, sourceBottom: 0.80, screenTop: 0.36, screenBottom: 0.82, travel: 0.31, opacity: 0.10 }),
      band({ sourceTop: 0.70, sourceBottom: 1, screenTop: 0.71, screenBottom: 1, travel: 0.63, opacity: 0.17 })
    ]
  }),
  background({
    key: 'cityClear',
    file: '10-city-clear-dawn.png',
    title: 'City Clear Dawn',
    landmark: 'Sunrise civic tower',
    atmosphere: 'clear sunrise',
    palette: ['#ffe05d', '#ff6670', '#59dfd0'],
    lowerBand: { groundLine: 0.732, texture: 'sunlit lane marks', foreground: 'finish-line and storefront silhouettes' },
    baseTravel: 0.13,
    bands: [
      band({ sourceTop: 0, sourceBottom: 0.40, screenTop: 0, screenBottom: 0.42, travel: 0.15, opacity: 0.06 }),
      band({ sourceTop: 0.28, sourceBottom: 0.75, screenTop: 0.31, screenBottom: 0.78, travel: 0.44, opacity: 0.10 }),
      band({ sourceTop: 0.65, sourceBottom: 1, screenTop: 0.67, screenBottom: 1, travel: 0.84, opacity: 0.16 })
    ]
  })
]);

export const BACKGROUND_BY_KEY = freeze(
  Object.fromEntries(BACKGROUND_MANIFEST.map((entry) => [entry.key, entry]))
);
