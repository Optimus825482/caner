"""Remove `(prisma as any)` casts where prisma client has the model typed."""
from pathlib import Path

files = [
    "src/app/[locale]/faq/page.tsx",
    "src/app/[locale]/services/page.tsx",
    "src/app/api/services/[id]/route.ts",
    "src/app/api/subcategories/[id]/route.ts",
    "src/app/api/team/[id]/route.ts",
]

for fp in files:
    p = Path(fp)
    text = p.read_text(encoding="utf-8")
    new = text.replace("(prisma as any).", "prisma.")
    if new == text:
        print(f"NO CHANGE: {fp}")
    else:
        p.write_text(new, encoding="utf-8")
        print(f"OK: {fp}")
