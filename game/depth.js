// Depth is presentation-only. These tracks never participate in collision or
// route timing; they only decide where transparent dressing is painted.
export const BACKGROUND_PARALLAX = 2.1;
export const BACKGROUND_ALPHA = .72;
export const BACKGROUND_FOCAL_X = 400;
// Reserve the whole standing runner silhouette plus breathing room. This is
// a presentation boundary, never a collision surface or change to physics.
export const BACKGROUND_LANE_CLEARANCE = 168;

// Cover the canvas while registering the runner to the plate's foreground.
// A portrait crop makes the painted roadway taller on screen; keep dressing
// behind its authored rear edge as well as above the runner's silhouette.
export function backgroundPlateFor(width, height, ground, imageRatio, scale, sceneProfile) {
  const floor = .86;
  const plateHeight = Math.max(width / imageRatio, ground / floor, (height - ground) / (1 - floor));
  const top = ground - plateHeight * floor;
  const rearEdge = top + plateHeight * (sceneProfile?.dressingLine ?? sceneProfile?.foregroundBand?.[0] ?? .67);
  const laneClearance = Math.max(BACKGROUND_LANE_CLEARANCE, (ground - rearEdge) / scale);
  return { width: plateHeight * imageRatio, height: plateHeight, top, laneClearance };
}

export const BACKGROUND_TRACKS = Object.freeze({
  1: Object.freeze({ speed: 1.5, scale: .5, lift: 168 }),
  2: Object.freeze({ speed: 2, scale: .65, lift: 168 }),
  3: Object.freeze({ speed: 3, scale: .8, lift: 168 }),
});

export function backgroundTrackFor(entity, shape) {
  if (entity.backgroundTrack && BACKGROUND_TRACKS[entity.backgroundTrack]) return entity.backgroundTrack;
  const size = Math.max(shape?.width || 0, shape?.height || 0);
  return size < 160 ? 1 : size < 280 ? 2 : 3;
}

export function backgroundLiftFor(entity, shape, track) {
  return Math.max(entity.backgroundLift || 0, BACKGROUND_TRACKS[track].lift - (entity.y || 0));
}

export function backgroundPlacementFor(entity, shape, frame, worldHeight = Infinity, laneClearance = BACKGROUND_LANE_CLEARANCE) {
  const track = backgroundTrackFor(entity, shape), profile = BACKGROUND_TRACKS[track];
  const baseline = Math.max(BACKGROUND_LANE_CLEARANCE, laneClearance, (entity.y || 0) + backgroundLiftFor(entity, shape, track));
  const height = frame?.height || shape.height;
  const factor = Math.min(profile.scale, Math.max(1, worldHeight - baseline - 12) / height);
  // Registration room can extend below a frame's pivot. Place the complete
  // painted rectangle above the lane, then fit tall landmarks below the top.
  return { track, factor, elevation: baseline + (height - (frame?.pivotY ?? height)) * factor };
}

// Faster background motion is intentional. Anchor it to the authored encounter
// ahead of the runner, so a landmark crosses the focal point when its world
// position reaches that point instead of drifting away over a long chapter.
export function backgroundScreenX(value, world, scale, track) {
  return (BACKGROUND_FOCAL_X + (value - world - BACKGROUND_FOCAL_X) * BACKGROUND_TRACKS[track].speed) * scale;
}
