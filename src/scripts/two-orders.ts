/** A shared link selects a reviewed case; fragment text never becomes page content. */
export function readCaseFragment(fragment: string, allowedIds: readonly string[]): string | null {
  if (!fragment.startsWith('#') || fragment.length > 128) return null;
  const params = new URLSearchParams(fragment.slice(1));
  if ([...params].length !== 1 || params.getAll('case').length !== 1) return null;
  const id = params.get('case');
  return id && allowedIds.includes(id) ? id : null;
}

/** Called only by an explicit share action. The address bar is never rewritten. */
export function caseShareUrl(id: string, allowedIds: readonly string[]): string {
  if (!allowedIds.includes(id)) throw new RangeError('Unknown synthetic case');
  const url = new URL('https://antihunter.com/two-orders');
  url.hash = new URLSearchParams({ case: id }).toString();
  return url.href;
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('two-orders');
  if (root) setupWalkthrough(root);
}

function setupWalkthrough(root: HTMLElement) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-case-select]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-case-panel]')];
  const allowedIds = buttons.map(button => button.dataset.caseSelect!);
  const navigation = root.querySelector<HTMLElement>('#case-navigation')!;
  const status = root.querySelector<HTMLElement>('#case-status')!;
  const shareSection = root.querySelector<HTMLElement>('#case-share')!;
  const share = root.querySelector<HTMLButtonElement>('#share-case')!;
  const shareStatus = root.querySelector<HTMLElement>('#case-share-status')!;
  const fallback = root.querySelector<HTMLElement>('#case-copy-fallback')!;
  const copyInput = root.querySelector<HTMLInputElement>('#case-link')!;
  let currentId = allowedIds[0];
  let completed = false;

  function emit(name: 'experience_complete' | 'share_intent') {
    // Shared analytics supplies campaign, admission and session deduplication.
    // No case ID, fragment, observations, labels or ledger content is emitted.
    window.dispatchEvent(new CustomEvent('antihunter:analytics', { detail: { name, episode: 'two-orders' } }));
  }

  function selectCase(id: string, announcement = '') {
    if (!allowedIds.includes(id)) return;
    currentId = id;
    for (const panel of panels) {
      panel.hidden = panel.dataset.casePanel !== id;
      const reveal = panel.querySelector<HTMLDetailsElement>('[data-ledger-reveal]')!;
      reveal.open = false;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.caseSelect === id));
    status.textContent = announcement;
    shareStatus.textContent = '';
    fallback.hidden = true;
    copyInput.value = '';
  }

  function restoreFragment() {
    if (!location.hash) { selectCase(allowedIds[0]); return; }
    const id = readCaseFragment(location.hash, allowedIds);
    selectCase(id || allowedIds[0], id
      ? 'Shared case selected. Read the evidence, then reveal the ledger.'
      : 'This case link is invalid. The first synthetic case is shown.');
    // Restoring a link does not reveal ground truth or count as completion.
  }

  for (const button of buttons) button.addEventListener('click', () => {
    selectCase(button.dataset.caseSelect!, `${button.dataset.caseTitle} selected. The ledger is closed.`);
  });
  for (const panel of panels) {
    const reveal = panel.querySelector<HTMLDetailsElement>('[data-ledger-reveal]')!;
    reveal.addEventListener('toggle', () => {
      if (!reveal.open || panel.hidden || completed) return;
      completed = true;
      emit('experience_complete');
    });
  }

  share.addEventListener('click', async () => {
    const id = currentId;
    const name = buttons.find(button => button.dataset.caseSelect === id)!.dataset.caseTitle!;
    const url = caseShareUrl(id, allowedIds);
    fallback.hidden = true;
    shareStatus.textContent = '';
    share.disabled = true;
    emit('share_intent');
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        try {
          await navigator.share({ title: 'two orders. one refund. — Anti Hunter', text: `Inspect the synthetic case: ${name}.`, url });
          shareStatus.textContent = `Share action completed for “${name}”. This does not confirm a public post.`;
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') { shareStatus.textContent = 'Sharing canceled.'; return; }
        }
      }
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        shareStatus.textContent = `Link copied for “${name}”. The ledger starts closed.`;
      } catch {
        fallback.hidden = false;
        copyInput.value = url;
        copyInput.focus();
        copyInput.select();
        shareStatus.textContent = `Copy the selected link for “${name}”. The ledger starts closed.`;
      }
    } finally { share.disabled = false; }
  });

  restoreFragment();
  navigation.hidden = false;
  shareSection.hidden = false;
  window.addEventListener('hashchange', restoreFragment);
}
