from pathlib import Path
import re

files = [
    "src/app/[locale]/about/page.tsx",
    "src/app/[locale]/blog/[slug]/page.tsx",
    "src/app/[locale]/blog/page.tsx",
    "src/app/[locale]/catalog/[slug]/page.tsx",
    "src/app/[locale]/faq/page.tsx",
    "src/app/[locale]/page.tsx",
    "src/app/[locale]/privacy/page.tsx",
    "src/app/[locale]/products/page.tsx",
    "src/app/[locale]/services/page.tsx",
]

for fp in files:
    p = Path(fp)
    text = p.read_text(encoding="utf-8")
    # Repair: ",\n  safeJsonLd\n}" -> ",\n  safeJsonLd,\n}"
    # Also the script created lines like ", safeJsonLd}"
    new = re.sub(
        r",\s*safeJsonLd\s*\}",
        ", safeJsonLd,\n}",
        text,
    )
    # Also ", safeJsonLd\n}" (mid-block)
    if new == text:
        # Look for "X,\n  safeJsonLd}" (line 9 in broken)
        new = re.sub(
            r"(\n[ \t]+)(\w+)\s*\n[ \t]*, safeJsonLd\}",
            r"\1\2,\n\1safeJsonLd,\n}",
            text,
        )
    if new == text:
        print(f"NO REPAIR: {fp}")
    else:
        p.write_text(new, encoding="utf-8")
        print(f"OK: {fp}")
