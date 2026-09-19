// Ten raster plates generated with ChatGPT Image Gen from the retained runner reference.
// This records provenance and camera geometry, not user approval of new artwork.
export const STREET_MANIFEST = Object.freeze([
  {
    "key": "storyGetaway",
    "file": "01-waterfront-flat-v2.png"
  },
  {
    "key": "storyWarehouseDistrict",
    "file": "09-warehouse-flat-v2.png"
  },
  {
    "key": "storyRooftop",
    "file": "02-rooftop-flat-v2.png"
  },
  {
    "key": "storyNeonMarket",
    "file": "04-market-flat-v2.png"
  },
  {
    "key": "storyLastBlock",
    "file": "03-underpass-flat-v2.png"
  },
  {
    "key": "storySubwayPlatform",
    "file": "05-subway-flat-v2.png"
  },
  {
    "key": "storyBasketballBlock",
    "file": "06-basketball-flat-v2.png"
  },
  {
    "key": "storyIndustrialBridge",
    "file": "07-bridge-flat-v2.png"
  },
  {
    "key": "storyUpliftCrosswalk",
    "file": "08-crosswalk-flat-v2.png"
  },
  {
    "key": "cityClear",
    "file": "10-dawn-flat-v2.png"
  }
].map(entry => Object.freeze({ ...entry, provenance: 'ChatGPT Image Gen raster PNG', worldHeight: 560, curb: .67, footline: .86 })));
export const STREET_BY_KEY = Object.freeze(Object.fromEntries(STREET_MANIFEST.map(entry => [entry.key, entry])));
