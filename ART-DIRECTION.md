# Artwork and placement

The approved runner style is preserved in the new `assets/imagegen/runner/run-v8-frames/` set: orange hair, freckles, blue overshirt, white shirt, navy trousers and white sneakers. Version 3 now uses eight full-character raster poses from one generated 4-by-2 contact sheet. The head, costume and proportions stay consistent while the legs alternate through contact, compression, passing and flight. The proposed cutout rig was discarded.

New images were made with ChatGPT Image Gen: the individually authored run poses, eight-view coin rotation, side-view truck matching the existing car, two separate eight-pose pursuer sheets, and ten looping prop sheets. All in-game artwork remains raster. The pursuers now match the attached two-man reference: the bald gray-suit man and the brown-haired blue-suit man, with the forward fist readable in the running cycle. There is no generated SVG artwork.

`assets/runner-registration.json` defines a shared pelvis axis and ground baseline per pose. Flight frames intentionally leave space below their shoes. The source art is authored for a 4 FPS key-pose review; gameplay timing still follows distance traveled so foot plants stay synchronized with movement. The reviewed frame contact sheet and 4 FPS loop are in `game-tests/review/`.

`tools/pack-runtime-art.py` packs complete alpha components, preserving hands and feet that cross nominal source-cell boundaries. It applies uniform resampling, transparent gutters and explicit pivots. Source hashes are exported in `assets/runtime/sprites.json`. Repacking requires Pillow, NumPy and SciPy; gameplay and packaging use the already-built atlas and require none of these Python libraries.

All ten existing enemy families now appear. The skateboard uses its coherent push/recovery poses; pigeons use the consistent three-bird frames. Other actor sheets retain their complete frames and register to the head axis/shared ground. The two reference-matched pursuers are packed independently so a hand, shoe or tie can never be borrowed from the other character. Ten new looping props are packed as eight fixed cells with alpha crops and a shared visible baseline; they are decorative and carry no hidden colliders. Historical runner attempts and the mismatched pixel truck remain source archives, not runtime alternatives. The old rush sheet repeats one leading leg, so rush uses the corrected running cycle instead.

Props share world origins with collision. All solid tops are walkable, including car and truck roof/hood steps, barriers, barrels, beams, shutters, cranes and conveyors. Platform contact follows its front lip. Lamps, glow, shadows, handrails and angled decorative edges do not define contact. Elevated decks have visible supports. Uniform aspect ratios are checked during the art gate.

The local review is bound to exact source/runtime files in `game-tests/review.json`. It records inspection, not Eric's approval or a platform certification. Gameplay and visual limitations are described in `FULL-GAME-AUDIT.md`.

## Run-frame review

| Frame | Legs | Arms / registration |
| --- | --- | --- |
| 1 | Right-foot contact, left leg trails | Left arm drives forward; pelvis and sole registered to floor |
| 2 | Compression over the right support | Arms gather naturally; weight reads over the planted foot |
| 3 | Passing pose with left knee driving through | Right arm leads; head remains level |
| 4 | Flight with left leg reaching forward | Right heel folds behind; both shoes clear the baseline |
| 5 | Left-foot contact, right leg trails | Right arm drives forward; opposing contact mirrors frame 1 |
| 6 | Compression over the left support | Arms gather naturally; weight reads over the planted foot |
| 7 | Passing pose with right knee driving through | Left arm leads; head remains level |
| 8 | Flight with right leg reaching forward | Left heel folds behind; both shoes clear the baseline into frame 1 |

The frame images and loop were inspected directly; this table is a visual review record, not an anatomy test inferred from filenames.
