"""Fix indent of inserted guard blocks."""
from pathlib import Path

files = [
    "src/app/api/ai/generate/route.ts",
    "src/app/api/ai/translate/route.ts",
    "src/app/api/blog/route.ts",
    "src/app/api/blog/[id]/route.ts",
    "src/app/api/faq/route.ts",
    "src/app/api/faq/[id]/route.ts",
    "src/app/api/services/route.ts",
    "src/app/api/services/[id]/route.ts",
    "src/app/api/team/route.ts",
    "src/app/api/team/[id]/route.ts",
]

for fp in files:
    p = Path(fp)
    text = p.read_text(encoding="utf-8")
    # Fix the bad indent pattern: "let body: unknown;" not indented, "  try {" 2 spaces
    new = text.replace(
        "\nlet body: unknown;\n  try {\n    body = await req.json();",
        "\n  let body: unknown;\n  try {\n    body = await req.json();",
    )
    if new == text:
        print(f"NO CHANGE: {fp}")
    else:
        p.write_text(new, encoding="utf-8")
        print(f"OK: {fp}")
