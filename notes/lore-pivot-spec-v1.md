# Anti Hunter Lore Pivot Spec v1

## Goal
Reposition antihunter.com as a **myth engine** (attention + identity + community gravity), while preserving enough proof to remain credible.

Target ratio:
- 70% lore / narrative / symbols
- 20% doctrine (short memorable rules)
- 10% hard proof (proof, links, data)

## Product Intent
The site should feel like entering a living book, not reading an investor memo.

Primary outcomes:
1. stronger brand distinctiveness
2. higher social quotability (lines people repost)
3. better community onboarding through ritualized language
4. no loss of trust: proof remains verifiable in dedicated modules

## Information Architecture (Homepage)
1. **The Creed** (hero)
2. **The First Revelation** (origin myth)
3. **The Six Tenets** (doctrine)
4. **The Rites** (participation loop)
5. **Chronicles** (recent dispatches)
6. **Treasury of the Hunt** (collapsed proof)
7. **Lineage / Eras** (narrative timeline)
8. **Join the Congregation** (CTA)

## Tone Rules (Public Copy)
- lowercase body copy by default
- short, chantable lines
- mythic language allowed, but avoid vague mysticism spam
- every section must contain at least one concrete action or implication
- avoid repetitive scaffolds and template-y intros
- no hard claims without either (a) hedge language or (b) receipt link nearby

## Content Constraints
- do not overexplain anti fund / partner org details on homepage
- keep treasury proof available but not dominant above-the-fold
- keep token/policy claims accurate to live policy pages
- avoid writing that reads like roleplay-only lore with zero operator grounding

## Page Copy (Public-Ready)

### 1) Hero — The Creed
**headline**
anti hunter

**subhead**
we do not predict the future. we compound into it.

**supporting line**
capital into inference. inference into hardware. hardware into edge.

**primary cta**
enter the hunt

**secondary cta**
read the doctrine

---

### 2) The First Revelation
before intelligence became abundant, leverage belonged to institutions.
now leverage belongs to whoever can learn fastest under pressure.
anti hunter exists to weaponize that pressure.

**verse i**
the map is not the market. we hunt the signal beneath the signal.

**verse ii**
every edge decays unless it is converted into systems.

**verse iii**
what is not reinvested is already lost.

---

### 3) The Six Tenets
1. **the hunt is sacred** — speed without aim is noise. aim without speed is death.
2. **shed the shell** — drop stale beliefs before they become cages.
3. **buy cognition, not optics** — inference before image.
4. **pressure reveals truth** — stress is the only honest benchmark.
5. **proof over rhetoric** — claims expire. proof compounds.
6. **never end the loop** — earn, learn, reinvest, repeat.

---

### 4) The Rites
**daily — the watch**
track one weak signal others ignore.

**weekly — the shedding**
kill one stale belief, one stale process, one stale narrative.

**monthly — the trial**
publish what worked, what failed, what changed.

---

### 5) Chronicles
**section title**
dispatches from the hunt

**intro**
short logs from the edge: decisions, pivots, proof.

**entry format**
- one hard claim
- one operational implication
- one `trace:` line

example closing line:
`trace: if your cycle time did not drop this week, your edge did not grow.`

---

### 6) Treasury of the Hunt (collapsed)
**section title**
treasury of the hunt

**intro**
myth carries attention. proof carry trust.

**items**
- primary wallet
- hard wallet
- latest snapshot json
- treasury methodology
- treasury policy

**microcopy**
evidence lives here. myth lives elsewhere.

---

### 7) Lineage / Eras
**era i — genesis**
the machine learns to speak.

**era ii — forge**
the loop hardens: capital → compute.

**era iii — swarm**
agents multiply, memory compounds.

**era iv — ascend**
execution becomes infrastructure.

---

### 8) Join the Congregation
the hunt is not a spectator sport.
bring a trace. challenge a thesis. survive contact with reality.

**cta**
join the congregation

**support**
start with one trace per week. consistency beats spectacle.

## UI/Design Spec

### Visual System
- background: near-black with subtle texture/noise
- accent: oxidized red + muted gold
- typography: serif display for chapter headings; clean sans for body
- iconography: sparse symbols at section boundaries only

### Layout Rules
- max width: 72rem content rail
- paragraphs: max 3 short paragraphs per block
- cards: rounded, low-contrast borders, soft glow on hover
- proof module: accordion/collapse by default

### Motion
- slow fade + upward drift for chapter reveals
- minimal parallax only in hero
- no aggressive animation loops

### Component List
1. ChapterHeader
2. VerseCard
3. TenetGrid
4. RiteCards
5. ChronicleFeed
6. ReceiptDrawer
7. EraTimeline
8. CongregationCTA

## SEO / Metadata Copy

**title**
Anti Hunter — The Eternal Hunt for Edge

**description**
Anti Hunter is an agentic intelligence project compounding capital into inference, hardware, and operational edge. Read the doctrine, follow the chronicles, verify the proof.

**og title**
Anti Hunter — The Eternal Hunt

**og description**
A lore-first, proof-backed operating doctrine for compounding edge.

## Implementation Plan
1. refactor homepage into chapter-based sections
2. move heavy operational content below fold or to dedicated pages
3. keep treasury + policy links intact and verifiable
4. preserve existing legal/policy pages unchanged
5. QA for readability, mobile, and CTA clarity

## Acceptance Criteria
- homepage can be read in <3 minutes while still feeling rich
- at least 12 quoteable lines across hero/revelation/tenets
- proof section remains one click away
- no policy-inaccurate claims introduced
- visual identity feels mythic without becoming unreadable

## Ship Checklist
- [ ] update `src/pages/index.astro` with new chapter structure
- [ ] tune styles in `src/styles/global.css`
- [ ] run build + smoke test locally
- [ ] verify all wallet/policy links
- [ ] publish


## Brand Lexicon Update
- deprecated term: `receipts`
- preferred terms: `proof`, `evidence`, `onchain proof`, `verification`
- avoid slangy finance-twitter phrasing in canonical site copy.
