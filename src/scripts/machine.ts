import { calculateScenario, EXAMPLE_SCENARIO, MACHINE_FIELDS, parseScenarioFragment, scenarioFragment, validateScenario, type MachineField, type MachineScenario } from '../lib/machine';

const fieldNames = Object.keys(MACHINE_FIELDS) as MachineField[];
const form = document.querySelector<HTMLFormElement>('#machine-form')!;
const fields = Object.fromEntries(fieldNames.map((field) => [field, document.getElementById(field) as HTMLInputElement])) as Record<MachineField, HTMLInputElement>;
const get = (id: string) => document.getElementById(id)!;
const download = get('download-receipt') as HTMLButtonElement;
const share = get('share-scenario') as HTMLButtonElement;
const calculate = get('calculate') as HTMLButtonElement;
const formStatus = get('form-status');
const shareStatus = get('share-status');
let current = { ...EXAMPLE_SCENARIO };
let provenance = 'HYPOTHETICAL EXAMPLE / NOT MEASURED RESULTS';
let dirty = false;
const completedScenarios = new Set<string>();

function money(value: number, compact = false): string {
  if (value !== 0 && Math.abs(value) < 0.000000001) {
    return `${value < 0 ? '-' : ''}$${Math.abs(value).toExponential(2)}`;
  }
  return value.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: compact && Math.abs(value) >= 1_000_000 ? 0 : 2,
    maximumFractionDigits: value !== 0 && Math.abs(value) < 0.01 ? 9 : 2,
    notation: compact && Math.abs(value) >= 1_000_000 ? 'compact' : 'standard',
  });
}

const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 9 });
const percentage = (value: number) => `${(value * 100).toFixed(0)}%`;

function verdict(result: ReturnType<typeof calculateScenario>) {
  switch (result.driver) {
    case 'review': return { driver: `Human review: ${percentage(result.reviewShare)} of modeled cost.`, take: 'the supervisor would like a word with your margin.' };
    case 'inference': return { driver: `Inference + tools: ${percentage(result.inferenceShare)} of modeled cost.`, take: 'the machine has developed an expensive habit.' };
    case 'equal': return { driver: 'A tie: inference and human review each cost 50%.', take: 'management and the machine split the invoice.' };
    default: return { driver: 'No cost entered. No largest cost driver.', take: 'free is an assumption. keep the receipt.' };
  }
}

function emit(name: 'experience_complete' | 'share_intent') {
  // Never include scenario inputs, the fragment, revenue, or calculated values.
  window.dispatchEvent(new CustomEvent('antihunter:analytics', { detail: { name, episode: 'hidden-cost' } }));
}

function render() {
  const result = calculateScenario(current);
  const copy = verdict(result);
  const set = (id: string, value: string) => { get(id).textContent = value; };
  set('scenario-provenance', provenance);
  set('result-total', money(result.total, true));
  get('result-total').title = money(result.total);
  set('result-inference', money(result.inference, true));
  set('result-review', money(result.review, true));
  set('result-revenue', money(current.revenue, true));
  set('result-contribution', money(result.contribution, true));
  set('contribution-note', 'Before costs outside this model.');
  get('inference-bar').style.width = `${result.inferenceShare * 100}%`;
  get('review-bar').style.width = `${result.reviewShare * 100}%`;
  set('result-driver', copy.driver);
  set('result-take', copy.take);
  set('assumption-cost', money(current.costPerAttempt));
  set('assumption-attempts', number(current.attempts));
  set('assumption-minutes', number(current.reviewMinutes));
  set('assumption-rate', money(current.hourlyRate));
  set('assumption-revenue', money(current.revenue));
  download.disabled = false;
  share.disabled = false;
  dirty = false;
}

function clearErrors() {
  for (const field of fieldNames) {
    fields[field].removeAttribute('aria-invalid');
    get(`${field}-error`).hidden = true;
  }
}

form.addEventListener('input', () => {
  dirty = true;
  download.disabled = true;
  share.disabled = true;
  formStatus.textContent = 'Assumptions changed. Calculate to update the receipt.';
  shareStatus.textContent = '';
  get('copy-fallback').hidden = true;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors();
  const parsed = validateScenario(Object.fromEntries(fieldNames.map((field) => [field, fields[field].value])));
  if (!parsed.ok) {
    for (const field of fieldNames) {
      const error = parsed.errors[field];
      if (!error) continue;
      fields[field].setAttribute('aria-invalid', 'true');
      get(`${field}-error`).textContent = error;
      get(`${field}-error`).hidden = false;
    }
    const first = fieldNames.find((field) => parsed.errors[field]);
    if (first) fields[first].focus();
    download.disabled = true;
    share.disabled = true;
    formStatus.textContent = 'Check the marked assumptions. The receipt has not been updated.';
    return;
  }
  current = parsed.value;
  provenance = 'USER SCENARIO / INPUTS NOT INDEPENDENTLY VERIFIED';
  render();
  formStatus.textContent = `Receipt updated. ${money(calculateScenario(current).total)} per accepted result.`;
  const fingerprint = scenarioFragment(current);
  if (!completedScenarios.has(fingerprint)) {
    completedScenarios.add(fingerprint);
    emit('experience_complete');
  }
});

function restoreFragment() {
  if (!location.hash) return;
  const parsed = parseScenarioFragment(location.hash);
  if (!parsed) {
    formStatus.textContent = 'This shared scenario is invalid. The hypothetical example is shown.';
    current = { ...EXAMPLE_SCENARIO };
    provenance = 'HYPOTHETICAL EXAMPLE / NOT MEASURED RESULTS';
  } else {
    current = parsed;
    provenance = 'SHARED SCENARIO / INPUTS NOT INDEPENDENTLY VERIFIED';
    formStatus.textContent = 'Shared assumptions loaded. Inspect them before drawing a conclusion.';
  }
  fieldNames.forEach((field) => { fields[field].value = String(current[field]); });
  clearErrors();
  render();
  // Opening a link is a view, not a user-created result or completion.
}

share.addEventListener('click', async () => {
  if (dirty) return;
  const link = new URL('/machine', location.origin);
  link.hash = scenarioFragment(current);
  const url = link.toString();
  emit('share_intent');
  // Native sharing is useful on touch devices; desktops get a direct copy.
  if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title: 'The AI employee invoice — Anti Hunter', text: 'Cheap tokens. Expensive context. Inspect these assumptions.', url });
      shareStatus.textContent = 'Share action completed. The link includes your assumptions.';
      return;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        shareStatus.textContent = 'Sharing canceled.';
        return;
      }
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    shareStatus.textContent = 'Scenario link copied. It includes your assumptions.';
  } catch {
    get('copy-fallback').hidden = false;
    const input = get('scenario-link') as HTMLInputElement;
    input.value = url;
    input.focus();
    input.select();
    shareStatus.textContent = 'Copy the selected link below. It includes your assumptions.';
  }
});

function createReceipt(): HTMLCanvasElement {
  const result = calculateScenario(current);
  const copy = verdict(result);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1540;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  ctx.fillStyle = '#ece5d5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#25251f';
  const text = (value: string, x: number, y: number, size: number, options: { font?: string; color?: string; max?: number; align?: CanvasTextAlign } = {}) => {
    ctx.font = `${size}px ${options.font || 'Arial, sans-serif'}`;
    ctx.fillStyle = options.color || '#25251f';
    ctx.textAlign = options.align || 'left';
    ctx.fillText(value, x, y, options.max || 1040);
  };
  const line = (y: number) => {
    ctx.beginPath(); ctx.strokeStyle = '#aba492'; ctx.lineWidth = 2; ctx.moveTo(80, y); ctx.lineTo(1120, y); ctx.stroke();
  };
  text('ANTI HUNTER', 80, 80, 22, { font: 'monospace' });
  text('DEPT. OF HIDDEN COSTS', 1120, 80, 22, { font: 'monospace', align: 'right' });
  line(112);
  text('the invoice.', 80, 225, 100, { font: 'Georgia, serif' });
  text('ASSUMPTIONS ENCLOSED', 80, 275, 25, { font: 'monospace', color: '#8e3427' });
  text(provenance, 80, 319, 20, { font: 'monospace', color: '#676053' });
  text('COST PER ACCEPTED RESULT', 80, 405, 24, { font: 'monospace' });
  text(money(result.total, true), 73, 560, 150, { max: 1050 });
  ctx.fillStyle = '#d2cbbb'; ctx.fillRect(80, 607, 1040, 20);
  ctx.fillStyle = '#85702f'; ctx.fillRect(80, 607, result.inferenceShare * 1040, 20);
  ctx.fillStyle = '#272720'; ctx.fillRect(80 + result.inferenceShare * 1040, 607, result.reviewShare * 1040, 20);
  const row = (label: string, value: string, y: number, size = 28) => {
    text(label, 80, y, size, { max: 650 });
    text(value, 1120, y, size, { align: 'right', max: 355 });
  };
  row('Inference + tools', money(result.inference), 694);
  row('Human review', money(result.review), 746);
  row('Revenue / accepted result', money(current.revenue), 814);
  row('Contribution / result', money(result.contribution), 866);
  text('Contribution is before costs outside this model, not net profit.', 80, 908, 20, { color: '#676053' });
  line(942);
  text(copy.driver, 80, 993, 28);
  text(copy.take, 80, 1054, 39, { font: 'Georgia, serif', max: 1040 });
  line(1090);
  text('THE ASSUMPTIONS / ALL MONEY IN USD', 80, 1139, 20, { font: 'monospace', color: '#676053' });
  row('Cost per attempt', money(current.costPerAttempt), 1190, 25);
  row('Attempts per accepted result', number(current.attempts), 1233, 25);
  row('Review minutes per accepted result', number(current.reviewMinutes), 1276, 25);
  row('Reviewer hourly rate', money(current.hourlyRate), 1319, 25);
  row('Revenue per accepted result', money(current.revenue), 1362, 25);
  line(1403);
  text('THE $30 MACHINE', 80, 1465, 23, { font: 'monospace' });
  text('antihunter.com/machine', 1120, 1465, 23, { font: 'monospace', align: 'right' });
  return canvas;
}

download.addEventListener('click', async () => {
  if (dirty) return;
  download.disabled = true;
  try {
    const canvas = createReceipt();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('PNG export failed')), 'image/png'));
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'antihunter-ai-employee-receipt.png';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    shareStatus.textContent = 'Receipt download started. All five assumptions are included.';
  } catch {
    shareStatus.textContent = 'This browser could not export a PNG. You can share the scenario link instead.';
  } finally {
    download.disabled = dirty;
  }
});

calculate.disabled = false;
render();
restoreFragment();
window.addEventListener('hashchange', restoreFragment);
