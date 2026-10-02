"""Rebuild mochis-house.html (and the offline copy) from the parts in src/.
Works on Windows, macOS and Linux:  python build.py"""
from pathlib import Path

root = Path(__file__).resolve().parent
src = root / "src"
parts = sorted(src.glob("*.html")) + sorted(src.glob("*.js"))
html = "".join(p.read_text(encoding="utf-8") for p in parts)
(root / "mochis-house.html").write_text(html, encoding="utf-8")
cdn = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
(root / "offline" / "mochis-house.html").write_text(html.replace(cdn, "three.min.js"), encoding="utf-8")
print(f"Built from {len(parts)} parts: mochis-house.html and offline/mochis-house.html")
