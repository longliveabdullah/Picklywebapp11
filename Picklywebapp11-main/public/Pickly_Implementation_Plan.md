**PICKLYEngineering & Product Implementation Plan**

Results Page  |  Dual Scan Modes  |  AI Context Engine  |  System Prompt

This document covers everything that needs to be built, why each decision was made, and in what order to build it. It is written so the developer can work from it directly without needing further clarification on intent. The plan is split into six parts: product decisions, results page redesign, dual scan modes, the AI context engine and system prompt, backend architecture, and the final build order.

# **Part 1 — Product Decisions & Rationale**

## **1.1  The three user states**

Every decision in the results page flows from one insight: when a user scans a product, they are in one of three distinct mental states. The entire page must respond to which state the user is in.

> **State 1 — In the store, holding the product**
> The user needs a verdict in under 3 seconds. Score, verdict, one reason, one action. Everything else is noise. Speed is the only thing that matters here.

> **State 2 — Already owns the product**
> This is emotionally loaded. They spent money. They may have been using it for weeks. The result must say how bad, under what conditions, what to do now, and whether they should stop immediately or finish the bottle.

> **State 3 — Researching before buying**
> This user wants full depth. They will read the ingredient section. They want comparisons, routine fit, shelf conflicts. Token cost is acceptable here because the user is asking for it.

## **1.2  The shelf is more powerful than duplicate detection**

The shelf was described as a tool to prevent duplicate purchases. That is its smallest use case. Here is the full picture of what the shelf unlocks when connected to the scan result.

**Fragrance-specific shelf logic**

- Note pyramid overlap — if the user owns a heavy oud base, flag that a new scent shares the same base and will feel redundant

- Layering potential — identify two scents with complementary profiles that work together (body wash + EDP)

- Longevity and sillage comparison — 'your current one lasts longer at the same price tier'

- Seasonal fit — 'you already have 3 winter-heavy scents, this covers the same occasions'

**Skincare and haircare shelf logic**

- Ingredient stacking risk — 'you are already using retinol in your night serum, adding this puts you over the recommended exposure threshold for your skin type'

- Acid overload — multiple AHAs or BHAs across products already owned

- Routine redundancy — 'this does the same job as your existing toner'

- Routine gap fill — 'you have no SPF on your shelf, this fills that gap' — proactive, not reactive

- Expiry urgency — 'you have a similar product expiring in 6 weeks, finish that first'

**Cross-category**

- Budget optimization — 'you own 4 hydration products, a 5th does not move the needle toward your goals'

- Goal completion — 'your shelf covers 3 of 5 goals; this adds coverage for frizz control which you currently lack'

- Conflict detection — certain fragrance ingredients interact poorly with skincare actives; flag when detectable

## **1.3  Critical pre-condition: persist the onboarding preferences**

Right now the app collects categories, purchase priorities, and shopping style during onboarding but does not persist them to Supabase. A budget user and a luxury user should receive completely different 'find a better option' recommendations. Until this data is saved, the AI context engine is working with thin, less useful context.

> **Action required before building anything else**
> Persist categories, purchase priorities, and shopping style to the user profile in Supabase. Nothing downstream is worth building on thin context.

# **Part 2 — Results Page Redesign**

## **2.1  The page needs to become a decision page**

The results page is currently an AI output page. It needs to become a decision page. The user should leave knowing exactly what to do with the product in their hand. Every section exists to serve that goal.

**Section 1 — Verdict hero**

The first thing the user sees. Sets the emotional tone of the entire page. The hero background gradient changes by score range. The cream base (#F5EFE6 / #EFE5D8) stays consistent throughout the page.

> **Score**
> | **Verdict** | **Hero Gradient Color** --- | --- |
| 0 - 3 | Dangerous for your profile | Dusty terracotta / muted red |
| 4 - 5 | Not recommended | Warm amber |
| 6 - 7 | Good, but watch out | Warm sand |
| 8 - 9 | Good match for you | Sage green |
| 10 | Excellent match for you | Soft fresh green |

**Section 2 — Personalized Why (most important section)**

This is where Pickly proves its value over every generic ingredient scanner. The rule is consequence language, not flag language. This is the difference between a feature and a product people recommend to their friends.

> **Flag language — do not do this**
> 'Contains sulfates' 'May irritate sensitive scalp' 'Has fragrance' | **Consequence language — do this instead** 'Contains sulfates — likely to increase your reported scalp dryness and flaking' 'High fragrance load — your sensitivity profile makes this a real itch risk' --- |

**Section 3 — Shelf Match card**

Only appears when a shelf conflict or similarity is detected. This is one of the most differentiating features in the app because no competitor does this. The card shows the matched shelf product by name and explains the relationship: redundant, risky, complementary, or fragrance overlap.

> **Example card copy**
> You already have The Ordinary Hyaluronic Acid 2% on your shelf. This product targets the same hydration function. Adding both will not increase results — you would be doubling up on the same mechanism.

**Section 4 — Routine Fit card**

The sleeper feature of the results page. It answers a question no ingredient checker answers well: where does this live in my day? Show the user a simple visual of their AM or PM routine with the scanned product slotted in. Users will screenshot this. It connects the scan to actual behavior, which is what drives retention.

**Section 5 — Evidence and ingredients**

Keep reasons to buy and reasons to avoid. Add the following:

- Key ingredients relevant to this user specifically — not a full ingredient dump

- Flagged ingredients with explanation of why they are flagged for this user

- What Pickly used from your profile — make this tappable

> **The 'What Pickly used' card is a trust mechanism, not just transparency**
> Show exactly which profile inputs influenced the score: 'Scored using: oily skin, sulfate sensitivity, hydration goal, 2 similar products on your shelf.' If the user sees incomplete inputs, they can tap to complete their profile immediately. This is the most organic profile completion loop in the product.

**Section 6 — Score-state actions**

> **Score**
> | **Primary CTA** | **Secondary CTA** --- | --- |
| 8 - 10 | Add to Shelf / Add to Routine | Save for later |
| 6 - 7 | See what to watch out for | Compare with better options |
| 4 - 5 | Find a safer alternative | See full ingredient breakdown |
| 0 - 3 | Avoid this product | Why it is unsafe for you |

**Section 7 — Assistant follow-up**

Keep the existing chat. Pre-populate with 3 context-aware quick prompts that change based on the result.

- 'Why is this bad for me specifically?' — for low scores

- 'Suggest a safer alternative for my profile' — for medium or low scores

- 'Where does this fit in my routine?' — for good scores

- 'Does it conflict with anything on my shelf?' — when shelf data exists

# **Part 3 — Dual Scan Mode Architecture**

## **3.1  Why two modes and why not to choose upfront**

Two scan modes save approximately 60-70% of token cost on every casual scan while ensuring users who need depth always get it. The critical product decision is that the user should never be asked to choose a mode before scanning. Making someone choose before they see a result is friction at exactly the wrong moment.

The correct pattern: scan once with Pickly Now as the default. Mode escalation happens naturally after the result lands — either because the user taps 'Full Analysis' or because the server auto-escalates based on the result.

## **3.2  Mode definitions**

|  > **Pickly Now**
> | **Pickly Deep** --- | --- |
| Trigger | Default for all scans | User taps 'Full Analysis' OR server auto-escalates |
| Context sent | Profile essentials + shelf names + product | Full context: all sections |
| Approx tokens | 800 - 1,200 | 2,500 - 3,500 |
| Response time target | Under 2 seconds | 4-5 seconds (user chose this) |
| Output | Score, verdict, 2-3 personal reasons, one CTA | All 7 result sections fully populated |
| Use case | Store aisle, quick check | Research, conflicts, danger scores |

## **3.3  Auto-escalation rules — when the server forces Deep**

Do not always make the user ask for the deep result. The server escalates automatically in these cases:

- Score is 0-3 — the user needs to understand why, a short result is not enough

- A shelf conflict is detected — a real explanation is required, not a card title

- A flagged allergen is found — non-negotiable safety situation

- The user came from the future buys list — research intent is implicit

> **Why auto-escalation matters for safety**
> If the user has to manually request depth every time there is a safety issue, some percentage will not bother. Auto-escalating on danger and allergen cases is a product safety decision, not a UX convenience.

# **Part 4 — AI Context Engine & System Prompt**

## **4.1  What the current API is not sending**

> **Data field**
> | **Currently sent** | **Should be sent** --- | --- |
| Skin type | Yes | Yes |
| Skin concerns | No | Yes |
| Skin tone | No | Yes |
| Hair type and conditions | No | Yes |
| Scalp type | Partial | Yes |
| Goals | No | Yes — critical for personalized why |
| Vegan preference | No | Yes |
| Allergies | Yes | Yes |
| Shopping style | No | Yes — changes alternative recommendations |
| Purchase priorities | No | Yes |
| Shelf relevant items | No | Yes — top 5-8 by category match |
| Current routine | No | Yes — compact AM/PM summary |
| Recent scans | No | Yes — last 3-5 |
| Future buys list | No | Yes — if category matches |
| Scan mode | No | Yes — in_store or research |
| Language | No | Yes — tr or en |

## **4.2  Context assembly rules**

The most important rule: never send the full shelf. Always retrieve a filtered, scored subset. Do this cheaply without vector search:

- Hard filter in SQL: same category, overlapping tags, same routine slot

- Heuristic scoring: ingredient token intersection, function class match, fragrance family match

- Cap at 5-8 items maximum. More than this adds tokens without improving result quality

- Compact the routine to short strings — AM: cleanser > toner > serum > SPF, not full product objects

Do not implement vector embeddings in v1. SQL plus token intersection will cover you well past the first 10,000 users. Add embeddings only when heuristics are measurably insufficient.

## **4.3  The system prompt**

This is the full runtime-populated template. Everything in {{ }} is injected per request by the context engine. The model never sees unfilled placeholders. The prompt is stamped with a prompt_version constant that is returned in every API response.

> You are Pickly, a highly personalized beauty and personal care advisor. Your job is to analyze a scanned product and give the user a clear, honest, and deeply personal recommendation — not generic ingredient facts. You always speak in {{ language }} (Turkish if 'tr', English if 'en'). Tone: warm, direct, confident. Like a knowledgeable friend, not a clinical report. ────────────────── USER PROFILE ────────────────── Name: {{ name }} │ Age: {{ age }} │ Gender: {{ gender }} Skin: {{ skinType }}, tone: {{ skinTone }} Skin concerns: {{ skinConcerns[] }} Hair type: {{ hairType }} │ Conditions: {{ hairConditions[] }} Scalp type: {{ scalpType }} Goals: {{ goals[] }} Vegan: {{ vegan }} │ Allergies: {{ allergies[] }} │ Diabetes: {{ hasDiabetes }} Shopping style: {{ shoppingStyle }} Purchase priorities: {{ purchasePriorities[] }} Categories: {{ categories[] }} ────────────────── SHELF (max 8 relevant items) ────────────────── {{ shelf[] — name, brand, category, opened/sealed, PAO, routine slot }} Flag overlap: duplicate function, ingredient stacking risk, fragrance note overlap, routine redundancy, or complementary pairing. ────────────────── ROUTINE ────────────────── AM: {{ amRoutineSteps — compact list }} PM: {{ pmRoutineSteps — compact list }} Flag conflicts. Identify where this product slots in. ────────────────── RECENT SCANS (last 5) ────────────────── {{ recentScans[] — name, category, verdict, date }} ────────────────── FUTURE BUY LIST ────────────────── {{ futureBuys[] — name, category }} ────────────────── SCAN CONTEXT ────────────────── Mode: {{ result_mode }}   in_store = fast verdict, 4 lines max   research = full depth across all sections ────────────────── SCANNED PRODUCT ────────────────── Name: {{ productName }} │ Brand: {{ brand }} │ Category: {{ category }} Ingredients: {{ ingredientList }} Additional info: {{ parsedProductData }} ────────────────── OUTPUT — valid JSON only ────────────────── {   score: number 0-10,   verdict: 'Excellent match'│'Good, watch out'│'Not recommended'│'Dangerous',   personalized_why: string[] max 5 — consequence language tied to this user,   shelf_match: { found: bool, product_name: string, relationship: string }│null,   routine_fit: { slot: string, conflicts: string[] }│null,   ingredient_highlights: { name: string, relevance: string }[] max 3,   flagged_ingredients: { name: string, reason: string }[],   profile_inputs_used: string[],   recommended_action: string — one sentence,   quick_prompts: string[] — exactly 3, personalized to this result } ────────────────── RULES ────────────────── Never give generic ingredient education. Always tie to this user. Never say 'consult a dermatologist' unless genuine medical risk exists. If ingredient data is low confidence, say so — do not fabricate. All ingredient_highlights must be tokens present in the ingredient list. If mode is 'in_store': return score + verdict + top 2 personalized_why only. Always respond in {{ language }}.

# **Part 5 — Backend Architecture**

## **5.1  What to keep exactly as planned**

These four things from the existing backend plan are non-negotiable and must not be cut for speed.

- Output validation layer — JSON schema validation plus a repair pass before returning to the client. LLMs drift on edge cases. You cannot trust model output without this in production. If validation fails, attempt a repair call. If the repair fails, return a safe fallback JSON with confidence set to low. A broken UI is worse than a conservative result.

- Server-side safety overrides — if a known allergen token appears in the ingredient list, the server forces a danger verdict regardless of what the model returned. This must be a hard server check, not a prompt instruction. Prompts can drift. Hard checks do not.

- Prompt versioning — return prompt_version in every API response. This costs nothing and saves enormous debugging pain when results change after a prompt edit.

- pastDecisions memory — lightweight records of what the user did with past scan results. Even a basic version makes the product feel genuinely smarter over time.

## **5.2  What to defer or ignore**

- Vector embeddings and semantic search — SQL plus token intersection is sufficient past 10,000 users. Do not add this until heuristics are measurably insufficient.

- Extracting to a separate Node service — Route Handlers are correct for now. Extract only when real load data justifies the operational complexity.

- Full caching strategy — do not build this until you have 2-3 weeks of usage data. Exception: enable provider-level prompt caching on the static system prompt immediately. This is the single highest-leverage cost optimization and requires no product changes.

- Confidence percentage in the UI — do not show this to users. If recognition quality is low, show a different UI state with softer language. A percentage number adds cognitive load without helping the user decide anything.

## **5.3  What the backend plan missed**

- Output field length enforcement — the JSON schema must include maxLength per field. personalized_why items, ingredient_highlights, and quick_prompts can all balloon. Truncate server-side before the response leaves. UI cards have fixed layouts. Protect them.

- Dual-mode UX contract — the backend treats in_store vs research as a parameter but never specifies who decides which mode gets sent. The client decides. That decision logic must be agreed and documented before the endpoint is built. If this is not specified, the client will always send research mode to be safe, killing all token savings.

- Golden eval set — the backend plan lists this in testing as an afterthought. It must be built first. Before writing a single prompt, create 15 curated test cases: known products, known profiles, expected verdicts. This is how you know whether prompt changes are improvements or regressions.

## **5.4  API contract — the stable spineRequest fields**

- user_id

- locale — 'en' or 'tr'

- mode — 'in_store' or 'research'

- product_context — name, brand, category, price, raw OCR text, ingredient list, scan confidence, ingredient confidence

- product_type_hint — 'skincare' | 'haircare' | 'fragrance' | 'makeup'

- scan_id — optional, if the scan row was already persisted

**Response fields**

- Full result JSON as defined in the system prompt output schema

- request_id

- prompt_version

- model_id

- context_stats — counts of shelf items sent, scans sent, estimated tokens

- validation_result — 'ok' | 'repaired' | 'fallback'

# **Part 6 — Build Order**

## **The correct sequence**

The milestone order in the original backend plan is written for a team of four with 10,000 users. The right order for the current stage is lean and fast, with non-negotiable safety and quality infrastructure included from the start.

> **Step**
> | **What to build** | **Why this order** --- | --- |
| 0 | Persist onboarding prefs to Supabase | Every step after this depends on having the full profile. Nothing downstream is worth building on thin context. This goes first, not last. |
| 1 | Build golden eval set — 15 test cases | Before touching any prompt, establish a baseline with known products, known profiles, and expected verdicts. Without this you cannot tell if prompt changes are improvements or regressions. |
| 2 | Real endpoint + real LLM in one step | Skip the mock JSON phase entirely. A mock endpoint teaches you nothing and costs a day you do not need to spend. Ship real integration from the start. |
| 3 | Output validation + repair loop | Do not ship to real users without this. The repair pass catches the 5-10% of model responses that drift or fail schema validation. A broken UI is worse than a conservative fallback. |
| 4 | Server-side safety overrides | Allergen hard-block before any real users see results. This is a product liability issue, not a nice-to-have. |
| 5 | Context engine — SQL retrieval only, no embeddings | Profile + shelf filtered subset + recent scans. This is where real personalization kicks in. No vector search needed at this stage. |
| 6 | pastDecisions lightweight implementation | Memory is what separates Pickly from a stateless ingredient checker. Even basic records of what the user did with past scans makes the product feel meaningfully smarter. |
| 7 | Dual-mode routing with agreed client contract | Only after both modes are tested end-to-end and the escalation logic is documented and agreed with the frontend. |
| 8 | Rate limits, logging, dashboards | Once real usage exists to measure. Building observability before you have traffic is premature. |

## **The single principle to hold every decision against**

> **The bar for Pickly**
> A knowledgeable friend does not say 'sulfate detected, confidence 87%.' They say: skip this one, it will make your scalp worse — and you basically already have it on your shelf anyway. Every technical decision in this document exists to make that possible.

Pickly Implementation Plan