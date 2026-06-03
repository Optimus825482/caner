import sys
with open("src/lib/seo.ts", "rb") as f:
    data = f.read()
needle = b".replace(/\xe2\x80\xa8/g, "
idx = data.find(needle)
print("idx:", idx)
if idx < 0:
    sys.exit(1)
# Replace from 4 spaces before to close-paren-semicolon after 2029
start = idx - 4
# Find the closing pattern: u2029");\r\n
end_marker = b'\\\\u2029");\r\n'
end = data.find(end_marker, idx)
if end < 0:
    print("end not found")
    sys.exit(1)
end += len(end_marker)
print("REPLACING", repr(data[start:end]))
new = b'    .split("")\r\n    .map((c) => (c === "\xe2\x80\xa8" ? "\\\\u2028" : c === "\xe2\x80\xa9" ? "\\\\u2029" : c))\r\n    .join("");'
data = data[:start] + new + data[end:]
with open("src/lib/seo.ts", "wb") as f:
    f.write(data)
print("done")
