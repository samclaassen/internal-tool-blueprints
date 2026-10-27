"""Shared brand config loader. Looks for $BRAND_JSON, then ./brand.json, then ../brand.json."""
import json
import os

_CACHE = None


def load():
    global _CACHE
    if _CACHE is not None:
        return _CACHE
    for p in [os.environ.get("BRAND_JSON"), "brand.json", os.path.join("..", "brand.json"),
              os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "brand.json")]:
        if p and os.path.exists(p):
            _CACHE = json.load(open(p))
            todo = [k for k, v in _flat(_CACHE) if isinstance(v, str) and v.startswith("TODO") and not k.endswith("_comment")]
            if todo:
                print("brand.json still has TODO values: " + ", ".join(todo[:8]), flush=True)
            return _CACHE
    raise SystemExit("brand.json not found: copy brand.example.json to brand.json or set BRAND_JSON")


def _flat(d, pre=""):
    for k, v in d.items():
        if isinstance(v, dict):
            yield from _flat(v, pre + k + ".")
        else:
            yield pre + k, v


def color(name):
    return load()["colors"][name]


def rgb(name):
    h = color(name).lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
