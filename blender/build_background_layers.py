"""Make explicit parallax layers from a generated panorama.

The Blender pipeline already exports true far/mid/near layers for the authored
worlds. This small pass makes the generated hero panorama obey the same
contract: sky and skyline, first-row buildings, near objects, and street are
separate transparent plates that can be tiled at different speeds.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "generated" / "world-strip.png"
OUTPUT = ROOT / "assets" / "generated"


def band_mask(size: tuple[int, int], start: float, end: float, feather: int = 18) -> Image.Image:
    width, height = size
    mask = Image.new("L", size, 0)
    pixels = mask.load()
    for y in range(height):
        position = y / height
        if start <= position <= end:
            edge = min(position - start, end - position)
            alpha = min(255, int(255 * max(0.0, min(1.0, edge * height / feather))))
            for x in range(width):
                pixels[x, y] = alpha
    return mask.filter(ImageFilter.GaussianBlur(feather / 2))


def write_layer(source: Image.Image, name: str, start: float, end: float) -> None:
    layer = source.copy().convert("RGBA")
    layer.putalpha(band_mask(layer.size, start, end))
    layer.save(OUTPUT / f"world-strip-{name}.png", optimize=True)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing generated panorama: {SOURCE}")
    source = Image.open(SOURCE)
    write_layer(source, "far", 0.0, 0.60)
    write_layer(source, "mid", 0.22, 0.76)
    write_layer(source, "near", 0.54, 0.93)
    write_layer(source, "street", 0.68, 1.0)
    print("Wrote generated world far/mid/near/street plates")


if __name__ == "__main__":
    main()
