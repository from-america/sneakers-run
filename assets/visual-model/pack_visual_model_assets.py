"""Pack the inspected visual-model atlases into game-ready horizontal strips.

The source sheets stay in ``source/`` as the art-direction record.  The game
uses the derived strips so its renderer can keep one small, predictable
``drawImage`` call per animation frame.

Run from the repository root with:

    python3 assets/visual-model/pack_visual_model_assets.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source"


def cells(path: Path, columns: int, rows: int) -> list[list[Image.Image]]:
    image = Image.open(path).convert("RGBA")
    result: list[list[Image.Image]] = []
    for row in range(rows):
        row_cells: list[Image.Image] = []
        y0 = round(row * image.height / rows)
        y1 = round((row + 1) * image.height / rows)
        for column in range(columns):
            x0 = round(column * image.width / columns)
            x1 = round((column + 1) * image.width / columns)
            row_cells.append(image.crop((x0, y0, x1, y1)))
        result.append(row_cells)
    return result


def strip(frames: list[Image.Image], destination: Path) -> None:
    width = max(frame.width for frame in frames)
    height = max(frame.height for frame in frames)
    output = Image.new("RGBA", (width * len(frames), height), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        x = index * width + (width - frame.width) // 2
        y = (height - frame.height) // 2
        output.alpha_composite(frame, (x, y))
    output.save(destination, optimize=True)


def trim(frame: Image.Image) -> Image.Image:
    """Remove atlas padding while keeping a small transparent safety margin."""
    bbox = frame.getchannel("A").getbbox()
    if not bbox:
        return frame
    left, top, right, bottom = bbox
    pad = max(6, round(min(frame.size) * 0.04))
    return frame.crop((
        max(0, left - pad),
        max(0, top - pad),
        min(frame.width, right + pad),
        min(frame.height, bottom + pad),
    ))


def pack_runner() -> None:
    action = cells(SOURCE / "runner-otoole-actions.png", 4, 3)
    run = cells(SOURCE / "runner-otoole-run-recreated.png", 4, 2)
    strip(run[0] + run[1], ROOT / "runner" / "run.png")
    strip(action[1], ROOT / "runner" / "jump.png")
    trim(action[0][0]).save(ROOT / "runner" / "otoole-static.png", optimize=True)

    roll_crouch = cells(SOURCE / "runner-otoole-roll-crouch.png", 4, 2)
    strip(roll_crouch[0], ROOT / "runner" / "roll.png")
    strip(roll_crouch[1], ROOT / "runner" / "crouch.png")


def pack_chaser() -> None:
    atlas = cells(SOURCE / "chaser-run.png", 4, 2)
    strip(atlas[0] + atlas[1], ROOT / "chaser" / "run.png")


def pack_props() -> None:
    atlas = cells(SOURCE / "props-2fps.png", 4, 4)
    names = ("car", "low", "high", "platform", "coin", "shield", "speed", "magnet")
    for index, name in enumerate(names):
        row = 0 if index < 4 else 2
        column = index % 4
        first = trim(atlas[row][column])
        if name == "coin":
            first.save(ROOT / "props" / "coin-icon.png", optimize=True)
        strip(
            [first, trim(atlas[row + 1][column])],
            ROOT / "props" / f"{name}.png",
        )


def pack_vfx() -> None:
    atlas = cells(SOURCE / "vfx-2fps.png", 4, 2)
    for column, name in enumerate(("dust", "coin", "power", "impact")):
        strip([atlas[0][column], atlas[1][column]], ROOT / "vfx" / f"{name}.png")


if __name__ == "__main__":
    pack_runner()
    pack_chaser()
    pack_props()
    pack_vfx()
    print("Packed visual-model runner, chaser, prop, and VFX strips")
