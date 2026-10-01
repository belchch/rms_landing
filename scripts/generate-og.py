#!/usr/bin/env python3
"""Render the social preview from the same SVG marks as the landing page."""

from pathlib import Path
import re
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "hosting-static" / "og.png"


def svg_contents(path: Path) -> str:
    svg = path.read_text()
    return re.sub(r"^.*?<svg\b[^>]*>|</svg>\s*$", "", svg, flags=re.S)


bee = svg_contents(ROOT / "img" / "planbee-bee-ink.svg")
bee_light = svg_contents(ROOT / "img" / "planbee-bee.svg")
wordmark = svg_contents(ROOT / "img" / "planbee-wordmark-white.svg")

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="laser"><stop stop-color="#fff"/><stop offset=".35" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#141414"/>
  <rect width="500" height="630" fill="#F4C046"/>
  <g transform="translate(30 155) scale(2.15)">{bee}</g>
  <g transform="translate(555 100) scale(.078)">{wordmark}</g>
  <g fill="none" stroke="#F5F5F3" stroke-width="5" stroke-linejoin="miter">
    <path d="M580 325h94m65 0h371v240H580V325z"/>
    <path d="M870 325v75m0 58v107M870 470h105m55 0h80" stroke-width="4"/>
  </g>
  <g fill="none" stroke="#F5F5F3" stroke-width="2">
    <path d="M674 319h65m-65 12h65m0-14v16m-65-16v16"/>
    <path d="M870 400h52m0 0a52 52 0 0 1-52 52" stroke-dasharray="5 5"/>
    <path d="M1030 470v-55m0 0a55 55 0 0 0-55 55" stroke-dasharray="5 5"/>
  </g>
  <path d="M580 295v12m0-6h290m0-6v12" stroke="#F4C046" stroke-width="2"/>
  <text x="725" y="288" fill="#F4C046" font-family="Helvetica Neue, Arial, sans-serif" font-size="21" font-weight="700" text-anchor="middle">5,20</text>
  <circle cx="735" cy="301" r="32" fill="url(#laser)"/><circle cx="735" cy="301" r="5" fill="#fff"/>
  <text x="724" y="452" fill="#F5F5F3" font-family="Helvetica Neue, Arial, sans-serif" font-size="15" letter-spacing="2" text-anchor="middle">КУХНЯ-ГОСТИНАЯ</text>
  <text x="990" y="387" fill="#F5F5F3" font-family="Helvetica Neue, Arial, sans-serif" font-size="15" letter-spacing="2" text-anchor="middle">СПАЛЬНЯ</text>
  <text x="990" y="523" fill="#F5F5F3" font-family="Helvetica Neue, Arial, sans-serif" font-size="15" letter-spacing="2" text-anchor="middle">С/У</text>
  <text x="40" y="575" fill="#141414" font-family="Helvetica Neue, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="1">ЗАМЕР НА ОБЪЕКТЕ</text>
  <text x="580" y="605" fill="#F4C046" font-family="Helvetica Neue, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="2">СМЕТА В ОФИСЕ</text>
</svg>"""

source = ROOT / "hosting-static" / "og.svg"
source.write_text(svg)
subprocess.run(["sips", "-s", "format", "png", str(source), "--out", str(OUT)], check=True)
shutil.copyfile(OUT, ROOT / "hosting-static" / "og-rebrand-2026-10.png")

icon = f"""<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="38" fill="#141414"/>
  <g transform="translate(26 38) scale(.7) translate(-34 -23.2)">{bee_light}</g>
</svg>"""
icon_source = ROOT / "hosting-static" / "apple-touch-icon.svg"
icon_source.write_text(icon)
subprocess.run(
    ["sips", "-s", "format", "png", str(icon_source), "--out", str(ROOT / "hosting-static" / "apple-touch-icon.png")],
    check=True,
)
