"""
Télécharge les assets CC0 de Poly Haven listés dans assets.json vers art/sources/,
prépare les textures teintées et écrit art/sources/credits.json.

    python3 tools/blender/fetch_assets.py

Idempotent : un fichier déjà présent n'est pas retéléchargé.
Nécessite Python 3 et Pillow (pip install pillow).
"""
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "art" / "sources"
MANIFEST = json.loads((Path(__file__).parent / "assets.json").read_text(encoding="utf-8"))
API = "https://api.polyhaven.com"
UA = {"User-Agent": "atelier-lumen-dev-factory/1.0 (asset pipeline)"}


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def download(url, dest: Path):
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  ↓ {dest.relative_to(ROOT)}")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r:
        tmp = dest.with_suffix(dest.suffix + ".part")
        tmp.write_bytes(r.read())
        tmp.rename(dest)


def make_variant(src: Path, dest: Path, saturation=1.0, brightness=1.0, tint=(1, 1, 1), contrast=1.0):
    """Albédo teinté, préparé ici car un nœud de mélange ne s'exporterait pas en glTF."""
    if dest.exists():
        return
    im = Image.open(src).convert("RGB")
    im = ImageEnhance.Color(im).enhance(saturation)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Brightness(im).enhance(brightness)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * tint[0])))
    g = g.point(lambda v: min(255, int(v * tint[1])))
    b = b.point(lambda v: min(255, int(v * tint[2])))
    Image.merge("RGB", (r, g, b)).save(dest, quality=92)
    print(f"  ✎ {dest.relative_to(ROOT)}")


def main():
    credits = []

    for tex in MANIFEST["textures"]:
        tid = tex["id"]
        print(f"Texture {tid}")
        files = get_json(f"{API}/files/{tid}")
        folder = SRC / "textures" / tid
        maps = {"diff": files["Diffuse"], "nor_gl": files["nor_gl"], "rough": files["Rough"]}
        for name, entry in maps.items():
            download(entry["1k"]["jpg"]["url"], folder / f"{name}.jpg")
        for vname, params in tex.get("variants", {}).items():
            make_variant(
                folder / "diff.jpg",
                folder / f"diff_{vname}.jpg",
                params.get("saturation", 1.0),
                params.get("brightness", 1.0),
                params.get("tint", [1, 1, 1]),
                params.get("contrast", 1.0),
            )
        credits.append(info(tid, "texture", tex["use"]))

    for model in MANIFEST["models"]:
        mid = model["id"]
        print(f"Modèle {mid}")
        files = get_json(f"{API}/files/{mid}")
        gltf = files["gltf"]["1k"]["gltf"]
        folder = SRC / "models" / mid
        download(gltf["url"], folder / f"{mid}.gltf")
        for rel, entry in gltf["include"].items():
            download(entry["url"], folder / rel)
        credits.append(info(mid, "modèle 3D", model["use"]))

    hdri = MANIFEST["hdri"]
    print(f"Ciel {hdri['id']}")
    files = get_json(f"{API}/files/{hdri['id']}")
    folder = SRC / "hdri"
    download(files["hdri"]["2k"]["hdr"]["url"], folder / "sky_2k.hdr")
    download(files["hdri"]["1k"]["hdr"]["url"], folder / "sky_1k.hdr")
    download(files["tonemapped"]["url"], folder / "sky_tonemapped.jpg")
    credits.append(info(hdri["id"], "ciel HDRI", hdri["use"]))

    (SRC / "credits.json").write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK : {len(credits)} assets, crédits dans art/sources/credits.json")


def info(asset_id, kind, use):
    data = get_json(f"{API}/info/{asset_id}")
    return {
        "id": asset_id,
        "name": data.get("name", asset_id),
        "kind": kind,
        "use": use,
        "authors": list(data.get("authors", {}).keys()),
        "url": f"https://polyhaven.com/a/{asset_id}",
        "license": "CC0",
    }


if __name__ == "__main__":
    sys.exit(main())
