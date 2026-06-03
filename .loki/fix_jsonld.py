"""Replace dangerouslySetInnerHTML JSON.stringify pattern with safeJsonLd helper."""
import re
from pathlib import Path

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
    original = text

    # Replace __html: JSON.stringify(X) with __html: safeJsonLd(X)
    text = re.sub(
        r'dangerouslySetInnerHTML=\{\{ __html: JSON\.stringify\(([^)]+)\) \}\}',
        r'dangerouslySetInnerHTML={{ __html: safeJsonLd(\1) }}',
        text,
    )

    if text == original:
        print(f"NO CHANGE: {fp}")
        continue

    # Add import if not present
    if "safeJsonLd" not in text.split("\n", 30)[0:30].__str__() and 'from "@/lib/seo"' in text:
        # Already imports from seo — just add safeJsonLd to import
        text = re.sub(
            r'(import\s*\{[^}]*)(\}\s*from\s*"@/lib/seo")',
            lambda m: (
                m.group(1) + ", safeJsonLd" + m.group(2)
                if "safeJsonLd" not in m.group(1)
                else m.group(0)
            ),
            text,
            count=1,
        )
    elif 'from "@/lib/seo"' not in text:
        # Add new import after the first existing import
        text = re.sub(
            r'(import [^\n]+\n)',
            r'\1import { safeJsonLd } from "@/lib/seo";\n',
            text,
            count=1,
        )

    p.write_text(text, encoding="utf-8")
    print(f"OK: {fp}")
