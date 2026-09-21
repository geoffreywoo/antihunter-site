/** Candidate framing only. The separate frozen scorer decides JSON/field validity. */
export const MAX_INPUT_BYTES = 8192;
const asciiJsonWhitespace = character => character === ' ' || character === '\t' || character === '\r' || character === '\n';
const reject = reason => ({ ok: false, mode: null, text: null, reason });

// Recognize one outer object span without parsing, repairing or reserializing it.
// Invalid JSON grammar inside the span remains invalid for the separate scorer.
function isSingleObjectSpan(text) {
  let start = 0;
  while (asciiJsonWhitespace(text[start])) start++;
  if (text[start] !== '{') return false;
  let depth = 0, quoted = false, escaped = false;
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === '{') depth++;
    else if (character === '}') {
      depth--;
      if (depth === 0) {
        for (let tail = index + 1; tail < text.length; tail++) if (!asciiJsonWhitespace(text[tail])) return false;
        return true;
      }
    }
  }
  return false;
}

export function normalizeCandidate(raw) {
  if (typeof raw !== 'string') return reject('not_string');
  // UTF-8 uses at least as many bytes as UTF-16 code units. This first bound
  // prevents allocating an unbounded encoded copy of an already oversized input.
  if (raw.length > MAX_INPUT_BYTES || new TextEncoder().encode(raw).byteLength > MAX_INPUT_BYTES) return reject('too_large');
  let text = raw, mode = 'bare';
  if (raw.startsWith('```')) {
    const opening = /^```(?:json)?(?:\r\n|\n)/.exec(raw);
    if (!opening) return reject('invalid_fence');
    // Exact slicing avoids regex `$`, which can match before a final newline.
    const envelope = raw.endsWith('\r\n') ? raw.slice(0, -2) : raw.endsWith('\n') ? raw.slice(0, -1) : raw;
    const closingStart = envelope.length - 3;
    if (envelope.slice(closingStart) !== '```' || envelope[closingStart - 1] !== '\n') return reject('invalid_fence');
    const closingBoundary = envelope[closingStart - 2] === '\r' ? closingStart - 2 : closingStart - 1;
    if (closingBoundary < opening[0].length) return reject('invalid_fence');
    text = envelope.slice(opening[0].length, closingBoundary);
    mode = 'single-fence';
  }
  if (!isSingleObjectSpan(text)) return reject('not_single_object');
  return { ok: true, mode, text, reason: null };
}
