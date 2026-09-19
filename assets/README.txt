Sneaker Run asset contract

The browser runtime uses the reviewed ChatGPT Image Gen raster set:
- imagegen/runner/idle-v1.png (Sneakers O'Toole loading fallback)
- imagegen/runner/run-v6.png (8 frames, alternating leg crossover)
- imagegen/runner/actions/*.png (4-frame jump, roll, crouch, land, stumble,
  celebrate, and rush states)
- imagegen/chaser/run-gray-suit-v1.png (8-frame bald gray-suit pursuer sheet matching the attached two-man reference)
- imagegen/chaser/run-blue-suit-v1.png (8-frame brown-haired blue-suit pursuer sheet matching the attached two-man reference)
- imagegen/chaser/start-point-*-suit-v1.png (6-frame point, lean, and launch intro sheets for both pursuers)
- imagegen/chaser/out-of-breath-*-suit-v1.png (6-frame finish fatigue loops for both pursuers)
- imagegen/chaser/jump-*-suit-v1.png (4-frame jump-path sheets for both pursuers)
- imagegen/chaser/roll-*-suit-v1.png (4-frame roll-path sheets for both pursuers)
- imagegen/looping/*.png (10 eight-frame, 4 FPS decorative prop loops with
  shared visible baselines and no gameplay solids)
- imagegen/props/*.png (two-frame, 2 FPS obstacle, platform, collectible, and
  power-up cycles)
- imagegen/vfx/*.png (two-frame, 2 FPS dust, coin, power, and impact cycles)

The existing `suit-generated.webp` remains a preserved approved reference for
the directly-behind runner suit treatment. The two generated pursuer sheets
follow the attached two-man reference and are packed independently so their
frames never cross-contaminate.

The source atlases in visual-model/source/ are the art-direction record only;
they are not runtime non-GUI art. The
canonical identity board is visual-model/source/runner-otoole-source-board.png.
The generated runtime provenance is recorded in
imagegen/runtime-art-manifest.json.

The legacy Blender source renders remain available for proportion and timing
tests in 3d-raw/. The Blender pipeline totals 360 character frames across the
runner, alternate runner, and chaser; they are not the browser's final art.

Legacy source art retained for comparison and art direction only:
- runner.webp
- chaser.webp
- car.webp
- construction_low.webp
- construction_high.webp
- bg_suburb.webp
- bg_city.webp
