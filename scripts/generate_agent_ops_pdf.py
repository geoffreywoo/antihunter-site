#!/usr/bin/env python3
from pathlib import Path
import re
import math

MD_PATH = Path('/Users/gwbox/.openclaw/workspace/antihunter-opensource/agent_ops_architecture_spec.md')
OUT_PATH = Path('/Users/gwbox/.openclaw/workspace/antihunter-site/public/roadmap/agent-ops-architecture.pdf')

if not MD_PATH.exists():
    raise SystemExit(f"Missing source markdown: {MD_PATH}")

text = MD_PATH.read_text(encoding='utf-8')

# Convert markdown-ish to readable lines
lines = []
for raw in text.splitlines():
    line = raw.rstrip()
    if not line:
        lines.append('')
        continue
    if line.startswith('## '):
        line = line[3:]
    elif line.startswith('# '):
        line = line[2:]
    line = line.replace('**', '')
    line = line.replace('`', '')
    line = line.replace('- ', '  - ')
    line = line.replace('|', ' | ')
    line = line.replace('\t', '    ')
    line = re.sub(r'\{[^}]*\}', '', line)
    lines.append(line)

# wrap helper
def wrap(s, width=85):
    if not s:
        return ['']
    out=[]
    while len(s) > width:
        cut = s.rfind(' ',0,width+1)
        if cut <= 0:
            out.append(s[:width])
            s = s[width:]
        else:
            out.append(s[:cut])
            s = s[cut+1:]
    out.append(s)
    return out

wrapped = []
for line in lines:
    wrapped.extend(wrap(line, 95))

# Very simple PDF objects
objects = []
contents_lines = []

# Precompute pages
PAGE_W, PAGE_H = 612, 792
M_LEFT = 50
M_TOP = 740
M_BOTTOM = 50
x = M_LEFT
line_h = 16
cur_y = M_TOP

pages = []
cur = []
for w in wrapped:
    if cur_y < M_BOTTOM + 2*line_h:
        pages.append('\n'.join(cur))
        cur=[]
        cur_y = M_TOP
    if w == '':
        cur_y -= line_h*0.7
        cur.append('')
        continue
    cur.append(w.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)'))
    cur_y -= line_h

if cur:
    pages.append('\n'.join(cur))

# Build PDF objects dynamically
# object 1: Catalog
# object 2: Pages
# object 3..: page and contents
page_obj_ids = []
content_obj_ids = []

def pdf_header():
    return b"%PDF-1.4\n"

# Create each page and its content
for page_num, body in enumerate(pages, start=1):
    content_obj_id = len(objects)+3
    page_obj_id = len(objects)+4
    content_obj_ids.append(content_obj_id)
    page_obj_ids.append(page_obj_id)
    # content stream
    y = 740
    stream = [
        'BT',
        '/F1 12 Tf',
        '1 0 0 1 0 0 Tm',
        '1 0 0 1 50 740 Tm',
        '0.0 0.0 0.0 rg',
    ]
    stream.append(f'({wrapped[0] if wrapped else ""}) Tj')
    # easier: just emit all lines with repeated Tm
    y = 740
    for ln in body.split('\n'):
        if ln.strip() == '':
            y -= line_h*0.7
            continue
        escaped = ln.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
        stream.append(f'50 {int(y)} Td')
        stream.append(f'({escaped}) Tj')
        y -= line_h
    stream.append('ET')
    stream_txt = "\n".join(stream).encode('utf-8')
    stream_obj = (
        f"{content_obj_id} 0 obj\n"
        f"<< /Length {len(stream_txt)} >>\n"
        f"stream\n{stream_txt.decode('latin1')}\nendstream\n"
        f"endobj\n"
    )
    objects.append(stream_obj)

# fallback if no wrapped content
if not page_obj_ids:
    content_obj_id=3; page_obj_id=4
    stream_txt = b"BT /F1 12 Tf /F1 12 Tf 1 0 0 1 50 740 Tm (agent ops architecture) Tj ET"
    objects.append(f"{content_obj_id} 0 obj\n<< /Length {len(stream_txt)} >>\nstream\n{stream_txt.decode()}\nendstream\nendobj\n")
    content_obj_ids=[content_obj_id]; page_obj_ids=[page_obj_id]

# Build page objects
for idx, (page_obj_id, content_obj_id) in enumerate(zip(page_obj_ids, content_obj_ids), start=1):
    y0 = 0

    obj = (
        f"{page_obj_id} 0 obj\n"
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] "
        f"/Resources << /Font << /F1 5 0 R >> >> /Contents {content_obj_id} 0 R >>\n"
        f"endobj\n"
    )
    objects.append(obj)

# Fonts object
font_obj = (
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
)
objects.append(font_obj)

# Pages object (object 2)
kids = ''.join([f" {pid} 0 R" for pid in page_obj_ids])
pages_obj = f"2 0 obj\n<< /Type /Pages /Kids [{kids} ] /Count {len(page_obj_ids)} /MediaBox [0 0 {PAGE_W} {PAGE_H}] >>\nendobj\n"
objects.insert(0, pages_obj)
# catalog object 1
catalog_obj = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
objects.insert(0, catalog_obj)

# Build cross-ref
pdf = bytearray(pdf_header())
offsets = [0]
for obj in objects:
    offsets.append(len(pdf))
    pdf.extend(obj.encode('utf-8'))

xref_start = len(pdf)
xref = ["xref\n0 %d\n" % (len(objects)+1), "0000000000 65535 f \r\n"]
for off in offsets[1:]:
    xref.append(f"{off:010d} 00000 n \r\n")
xref.append("trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objects)+1, xref_start))
pdf.extend(''.join(xref).encode('utf-8'))

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUT_PATH.write_bytes(bytes(pdf))
print(f"wrote {OUT_PATH} ({len(pdf)} bytes)")
