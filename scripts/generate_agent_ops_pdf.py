#!/usr/bin/env python3
"""Generate a real PDF artifact for agent ops architecture from the Markdown spec."""

from pathlib import Path
from fpdf import FPDF

SRC = Path('/Users/gwbox/.openclaw/workspace/antihunter-opensource/agent_ops_architecture_spec.md')
OUT = Path('/Users/gwbox/.openclaw/workspace/antihunter-site/public/roadmap/agent-ops-architecture.pdf')

if not SRC.exists():
    raise SystemExit(f'missing source spec: {SRC}')


def ascii_safe(text: str) -> str:
    s = text
    replacements = {
        '→': '->',
        '←': '<-',
        '•': '-',
        '·': '-',
        '—': '-',
        '–': '-',
        '“': '"',
        '”': '"',
        '’': "'",
        '‘': "'",
        '…': '...',
        '≥': '>=',
        '`': '',
    }
    for a, b in replacements.items():
        s = s.replace(a, b)
    for token in ('**',):
        s = s.replace(token, '')
    s = s.encode('latin-1', errors='ignore').decode('latin-1')
    return s


def split_dense_words(text: str, max_len: int = 95) -> str:
    """Break long unbreakable fragments so line wrapping never fails."""
    pieces = []
    for token in text.split(' '):
        if len(token) > max_len:
            # hard split with hyphen markers for readability
            chunks = [token[i:i+max_len] for i in range(0, len(token), max_len)]
            pieces.extend(chunks)
        else:
            pieces.append(token)
    return ' '.join(pieces)


def wrap_points(text: str) -> str:
    for ch in ['/', '.', ',', ';', ':', '{', '}', '(', ')', '[', ']', '|', '_', '>', '<', '#', '~', '#', '$', '%', '+']:
        text = text.replace(ch, f' {ch} ')
    while '  ' in text:
        text = text.replace('  ', ' ')
    return text.strip()

raw = SRC.read_text(encoding='utf-8').splitlines()

lines = ['Agent Ops Architecture (2 Mac minis -> n nodes)']

for raw_line in raw:
    line = ascii_safe(raw_line.strip())
    if not line:
        lines.append('')
        continue
    if line.startswith('#'):
        heading = line.lstrip('#').strip()
        if heading:
            lines.append(heading.upper())
            lines.append('')
        continue

    # remove markdown emphasis before list handling
    for tok in ('**',):
        line = line.replace(tok, '')

    if line.startswith(('- ', '* ', '+ ')):
        lines.append(f"- {line[2:].strip()}")
        continue

    if len(line) >= 2 and line[0].isdigit() and line[1] == ')' and line[:2].isdigit():
        lines.append(line)
        continue
    if line.startswith('```'):
        continue

    lines.append(line)

# collapse duplicates of blank lines
compact = []
blank = False
for line in lines:
    if not line:
        if not blank:
            compact.append('')
        blank = True
        continue
    compact.append(ascii_safe(line))
    blank = False

# render
pdf = FPDF()
pdf.set_auto_page_break(True, margin=16)
pdf.set_left_margin(16)
pdf.set_right_margin(16)
pdf.set_top_margin(16)
pdf.set_font('Helvetica', 'B', 20)
pdf.add_page()
pdf.set_x(16)
pdf.multi_cell(0, 10, split_dense_words(ascii_safe(compact[0])))
pdf.ln(2)

sections = {
    'NORTH STAR',
    'TRANSPORT + STORAGE (SCALES)',
    'HARD SPECS (THE CONTRACTS)',
    'IMPLEMENTATION CHECKLIST (WHEN MINI #2 ARRIVES)',
    'NOTES',
}
numbered = tuple(f'{i}) ' for i in range(1, 10))

for line in compact[1:]:
    if not line:
        pdf.ln(3)
        continue

    pretty = wrap_points(split_dense_words(line))
    up = line.upper()

    if up in sections:
        pdf.set_font('Helvetica', 'B', 13)
        pdf.ln(1)
    elif line.startswith('- ') or line.startswith(numbered):
        pdf.set_font('Helvetica', '', 11)
    else:
        pdf.set_font('Helvetica', '', 11)

    pdf.set_x(16)
    pdf.multi_cell(0, 6.2, pretty)

OUT.parent.mkdir(parents=True, exist_ok=True)
pdf.output(str(OUT))
print(f'wrote {OUT} ({OUT.stat().st_size} bytes)')
