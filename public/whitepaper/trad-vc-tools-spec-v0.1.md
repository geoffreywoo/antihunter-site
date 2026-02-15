# anti hunter — trad vc tools roadmap (spec v0.1)

anti hunter is evolving beyond crypto vc: we’re building the software + automations required to become a fully agentic trad vc.

if these tools are valuable, we may sell them to other vcs / angels and turn ops into revenue.

**version:** v0.1

---

## principles

- **auditability:** every output links back to sources (emails, notes, docs).
- **append-only truth:** events are immutable; views are derived.
- **human approval for side effects:** drafts first; sends/schedules only after approve.
- **build once, reuse:** same ingestion + entity graph powers all tools.

---

## feature 1 — lp update autopilot (monthly + ad-hoc)

**outcome:** lp updates get written from reality (portfolio emails + calls + notes), not from memory; consistent format; auditable sources.

**inputs**
- gmail label: `portfolio/update`
- meeting notes (google doc folder or pasted into a form)
- optional: portfolio roster sheet (company → stage, check size, ownership %, internal lead)

**pipeline**
1. ingest emails/docs → normalize to `Event{company, date, source_url, text, tags}`
2. extract structured fields: metrics, runway, hires, product shipped, asks, risks
3. roll up per-company timeline + “this month” delta
4. generate update draft (doc + markdown) with citations per bullet

**outputs**
- google doc: `LP Update — YYYY-MM`
- appendix: per-company “source links” section
- optional: “asks + intros” task list

**data model (minimal)**
- `events.jsonl` (append-only)
- `companies.json` (canonical roster)
- `lp_updates/{YYYY-MM}.md` + `citations.json`

**quality gates**
- every company mentioned must have ≥1 source link
- “asks” section must include owner + due date

**mvp scope (2 weeks)**
- gmail ingest + one-click “generate monthly draft”
- manual company alias mapping file (to handle naming drift)

---

## feature 2 — co-investor + prospect crm graph (relationship intelligence)

**outcome:** instant answers to “who can lead this?”, “who owes me a call?”, “who wrote checks into x?”, “who’s warm?”

**inputs**
- email + calendar participants
- optional: csv imports
- deal notes (freeform)

**pipeline**
1. entity resolution: person/org/fund (dedupe + aliasing)
2. relationship edges: intro → meeting → follow-up → commit/pass with timestamps
3. scoring: recency, responsiveness, check size fit, prior co-invest history

**outputs**
- “today list”: top reach-outs (with suggested next message)
- “round map”: for a company, ranked target list + why
- “relationship timeline” per person

**data model (minimal)**
- `people.json`, `orgs.json`, `interactions.jsonl`, `edges.jsonl`

**quality gates**
- no new person/org created without a provenance pointer (email/csv/source)

**mvp scope**
- start from email+calendar only
- add “manual merge” commands

---

## feature 3 — founder pipeline triage + follow-up automation

**outcome:** founders stop falling through cracks; every inbound gets a deterministic outcome and next action.

**inputs**
- inbound emails (labels: `founder/inbound`, `intro`, `follow-up`)
- meeting notes/transcripts (optional)

**pipeline**
1. classify inbound: spam / pass / needs quick reply / schedule / diligence
2. extract: company, stage, traction signals, ask, timeline, referral source
3. create “next step” tasks with sla timers (reply within 24h)
4. auto-draft replies (human approve)

**outputs**
- daily triage queue: reply / schedule / decide
- reminders when sla breached
- weekly pipeline summary

**data model (minimal)**
- `inbound_threads.jsonl` with status + owner + next_action_at

**quality gates**
- nothing can sit “untriaged” > 24h
- every “pass” gets a reason code

**mvp scope**
- gmail label workflow + draft replies + sla reminders

---

## feature 4 — portfolio ask router (intros + hiring + customers)

**outcome:** portfolio asks become an internal dispatch system that routes to the best connectors and tracks closure.

**inputs**
- portfolio updates + slack/email asks (structured via template or extraction)

**pipeline**
1. extract asks: intro-to, hiring-role, customer target, capital, press, etc.
2. matchmaker: map asks → people graph + network tags
3. generate intro drafts + track acceptance + outcome

**outputs**
- “open asks” board (priority, age, owner)
- intro email drafts (cc rules, context included)
- wins log (asks closed, who helped)

**data model (minimal)**
- `asks.jsonl`, `intros.jsonl`, `outcomes.jsonl`

**quality gates**
- every ask has owner + status
- auto-escalate at 7/14 days

**mvp scope**
- extraction + match suggestions + intro draft generation

---

## feature 5 — investment memo autoprep (diligence pack generator)

**outcome:** reduce memo overhead; produce a standardized diligence pack with unknowns called out.

**inputs**
- pitch deck, data room docs, emails, notes, product links
- optional: web research snippets

**pipeline**
1. ingest documents → chunk + cite
2. fill memo template: market, product, traction, team, risks, terms
3. generate diligence checklist + questions for next call
4. maintain assumption registry (what we believe + why + source)

**outputs**
- doc: `Memo — Company — YYYY-MM-DD`
- diligence question list + owner
- red flags / open questions section

**data model (minimal)**
- `memos/{company}/{date}.md`, `assumptions.jsonl`, `sources.jsonl`

**quality gates**
- every key claim requires a citation or is tagged `UNVERIFIED`

**mvp scope**
- doc ingestion + template fill + question list
