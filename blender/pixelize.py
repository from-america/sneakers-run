"""Pixelize Blender renders on a fixed grid and pack character animations."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "3d-raw"
OUT = ROOT / "assets" / "pixel"
OUT.mkdir(parents=True, exist_ok=True)


def quantized_rgba(image: Image.Image, size: tuple[int, int], colors: int) -> Image.Image:
    rgba = image.convert("RGBA").resize(size, Image.Resampling.BOX)
    alpha = rgba.getchannel("A").point(lambda value: 255 if value > 42 else 0)
    rgb = rgba.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert("RGB")
    rgb.putalpha(alpha)
    return rgb


def pixelize_frame(path: Path, logical_size: tuple[int, int], output_size: tuple[int, int], colors: int) -> Image.Image:
    image = Image.open(path)
    small = quantized_rgba(image, logical_size, colors)
    return small.resize(output_size, Image.Resampling.NEAREST)


def pack_animation(name: str, frame_count: int):
    frames = []
    for index in range(frame_count):
        source = RAW / name / f"{index:02d}.png"
        frames.append(pixelize_frame(source, (64, 64), (256, 256), 28))
    sheet = Image.new("RGBA", (256 * len(frames), 256), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * 256, 0))
    sheet.save(OUT / f"{name}.png", optimize=True)
    if name == "runner-run":
        frames[1].save(OUT / "runner-preview.png", optimize=True)


def pixelize_environments():
    for path in sorted(RAW.glob("*.png")):
        image = pixelize_frame(path, (480, 128), (1920, 512), 42)
        image.save(OUT / path.name, optimize=True)


def main():
    for name, count in {
        "runner-run": 48,
        "runner-roll": 36,
        "runner-crouch": 24,
        "runner-jump": 24,
        "runner-v1-run": 48,
        "runner-v1-roll": 36,
        "runner-v1-crouch": 24,
        "runner-v1-jump": 24,
        "chaser-run": 96,
    }.items():
        pack_animation(name, count)
    pixelize_environments()
    print(f"Pixel assets written to {OUT}")


if __name__ == "__main__":
    main()
