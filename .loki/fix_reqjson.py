"""Replace `const body = await req.json();` with guarded try/catch block."""
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

REPLACEMENT = (
    "let body: unknown;\n"
    "  try {\n"
    "    body = await req.json();\n"
    "  } catch {\n"
    "    return NextResponse.json({ error: \"Invalid JSON body\" }, { status: 400 });\n"
    "  }"
)

for fp in files:
    p = Path(fp)
    text = p.read_text(encoding="utf-8")
    new = text.replace(
        "  const body = await req.json();",
        REPLACEMENT,
        1,
    )
    if new == text:
        print(f"NO CHANGE: {fp}")
        continue
    p.write_text(new, encoding="utf-8")
    print(f"OK: {fp}")
