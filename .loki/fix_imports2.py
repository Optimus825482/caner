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
    # The script created patterns like:
    #   identifier
    # , safeJsonLd
    # }
    # OR
    #   identifier,
    # , safeJsonLd,
    # }
    # Fix both: any line that is just ", safeJsonLd" or ", safeJsonLd," with nothing before
    new = re.sub(
        r"^\s*,\s*safeJsonLd\s*[,]?\s*$",
        "  safeJsonLd,",
        text,
        flags=re.MULTILINE,
    )
    # Also: a line ending with "," and next line being just ", safeJsonLd,"
    new = re.sub(
        r"^,\s*safeJsonLd,\s*$",
        "  safeJsonLd,",
        new,
        flags=re.MULTILINE,
    )
    if new != text:
        p.write_text(new, encoding="utf-8")
        print(f"OK: {fp}")
    else:
        print(f"NO CHANGE: {fp}")
