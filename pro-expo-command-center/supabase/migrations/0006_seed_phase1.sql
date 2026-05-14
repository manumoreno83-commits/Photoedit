-- Phase 1 seed: 15 Must-Ask pre-pitch questions, Pro Expo Voice doc, Tiering
-- rubric and Sustainability starter rubric. All idempotent.

-- 15 Must-Ask pre-pitch questions (from PrePitchQuestions V3) -------------

insert into pre_pitch_questions (category, ordinal, question_en, question_es, is_must_ask) values
  ('Strategy & Objectives', 1, 'What is the main objective of your presence at this event?',
     '¿Cuál es el principal objetivo de vuestra presencia en este evento?', true),
  ('Strategy & Objectives', 2, 'What KPI will define success for you (leads, branding, sales, PR)?',
     '¿Qué KPI define el éxito? (leads, branding, percepción, ventas, PR)', true),
  ('Strategy & Objectives', 3, 'What key message should visitors remember after leaving your stand?',
     '¿Qué mensaje clave debe llevarse el visitante al salir?', true),
  ('Brand & Positioning',   4, 'How do you want to be perceived versus your competitors?',
     '¿Cómo queréis ser percibidos frente a la competencia?', true),
  ('Brand & Positioning',   5, 'What brand elements or attributes are non-negotiable?',
     '¿Qué atributos de marca son innegociables?', true),
  ('Brand & Positioning',   6, 'Are you looking for something more disruptive or more corporate?',
     '¿Preferís algo más disruptivo o más corporativo?', true),
  ('Space & Design',        7, 'What type of stand do you envision (open, closed, hybrid)?',
     '¿Qué tipo de stand encaja mejor (abierto, cerrado, híbrido)?', true),
  ('Space & Design',        8, 'What elements are essential (meeting rooms, bar, demo areas)?',
     '¿Qué elementos son imprescindibles (salas, bar, zonas demo)?', true),
  ('Space & Design',        9, 'Are there any references you like or anything you want to avoid?',
     '¿Tenéis referencias que os gusten o cosas que evitar?', true),
  ('Visitor Journey',      10, 'What is the ideal journey a visitor should take through your stand?',
     '¿Cuál es el recorrido ideal del visitante?', true),
  ('Visitor Journey',      11, 'Where does the key interaction or conversation moment happen?',
     '¿Dónde sucede la interacción o conversación clave?', true),
  ('Engagement',           12, 'What type of engagement are you aiming for (educational, immersive, commercial)?',
     '¿Qué tipo de engagement buscáis (educativo, inmersivo, comercial)?', true),
  ('Engagement',           13, 'Do you want interactive or technology-driven experiences, and at what level?',
     '¿Queréis experiencias interactivas o tech, y a qué nivel?', true),
  ('Product & Content',    14, 'What products or solutions must be showcased, and how?',
     '¿Qué productos deben demostrarse y cómo?', true),
  ('Decision Factors',     15, 'What will ultimately drive your decision: design impact, budget, or both?',
     '¿Qué pesa más en la decisión: impacto de diseño, presupuesto o ambos?', true)
on conflict do nothing;

-- Pro Expo Voice (knowledge_documents type=voice) -------------------------

insert into knowledge_documents (type, name, version, content, embeddings_status) values
('voice', 'Pro Expo Voice', 'v1.0',
$$Pro Expo Voice — distilled from Manuel Moreno''s comms, Ops Manual v6 and the
Workshop deck.

PRINCIPLES
1. Direct, no filler. The reader is busy. Skip the preamble.
2. Short sentences. Each one earns its length.
3. Evidence over adjectives. "ZTE MWC, 2256 sqm, signed" beats "a large project".
4. Decisive. Use "Recommendation:" for binary calls, never "we could consider".
5. No emojis in client communications. Internally lowercase and ES/EN mix is fine.
6. Owns mistakes plainly. Not defensive. "This did not work because X. We changed it to Y."
7. Always cite 2-3 past projects with sqm and event when proposing.
8. Spanish for internal team. English for international clients. Stay consistent within a thread.

WORDS WE DO NOT USE
- leverage, seamless, synergies, robust, holistic, best-in-class, end-to-end
- "we are excited", "we are thrilled", "thrilled to announce"
- em dashes — use a comma, a colon, or two sentences

NUMBERS
- Always specify currency (EUR by default).
- Use European thousands: 237.400 € not $237,400.
- sqm not m², always.

TONE BY AUDIENCE
- Client (corporate, brand-sensitive): formal, evidence-led, brand-respecting.
- Client (experience-seeker): direct but allows a bigger creative claim.
- Internal team: lowercase, fast, decisions on the table, owners named.
- Suppliers: clear specs, deadlines, payment terms upfront.

OPENING / CLOSING
- Skip "I hope this email finds you well".
- Open with the answer. Detail follows.
- Close with the next concrete action and who owns it.$$,
'pending')
on conflict do nothing;

-- Tiering rubric (knowledge_documents type=tiering) ----------------------

insert into knowledge_documents (type, name, version, content, embeddings_status) values
('tiering', 'Key Accounts Tiering — Whale to Sardine', 'v1.0',
$$Source: Pro Expo Workshop Jan 2026, "Key Accounts Tiering — The Sardine Tax".
Used by the RFP Triage Agent to classify every incoming opportunity.

WHALE  (~15% of revenue, one-shots, attention-heavy)
- sqm: > 1500
- Strategic / portfolio client
- Bid effort: HARD
- Risk: consumes PM bandwidth like crazy. Tax on the rest of the portfolio.

TUNA  (~10% of revenue, key differentiated)
- sqm: 800 - 2000
- Key client, differentiated value
- Bid effort: HARD

SALMON  (~33% of revenue, healthiest segment)
- sqm: 200 - 700
- Goldilocks zone. Healthiest margin and repeatability.
- Bid effort: HARD. Growth should be built here, not on Whales.

FISH TANK  (~57% of revenue if treated right — the hidden gem)
- sqm: 30 - 100
- Recurring small projects. Treated today as Sardines, but they are the
  long-term margin base.
- Bid effort: LIGHT
- Action: FARM via Account Managers, build relationship, not chase.

SARDINE  (residual, the Sardine Tax)
- sqm: < 30, low margin, one-time
- Bid effort: PASS or refer
- Risk: distracts PMs from Salmons and Whales. Saying no is a feature.

DECISION RULES (RFP Triage)
- Auto-pass any Sardine that is not a strategic referral.
- Promote a Fish Tank to "FARM track" if the same client has 2+ recurring asks.
- Whales need OD sign-off before bidding (see Ops Manual §1.2 borderline rule).$$,
'pending')
on conflict do nothing;

-- Sustainability rubric (knowledge_documents type=sustainability) --------

insert into knowledge_documents (type, name, version, content, embeddings_status) values
('sustainability', 'Sustainability Starter Rubric — EcoVadis Bronze + Better Stands Gold', 'v0.1-DRAFT',
$$Owner: Irazu (Sustainability Lead). Status: DRAFT — needs Q3 review with Irazu.
Used by the Sustainability Audit Agent.

Score 0-100. Bronze threshold: ≥45. Gold threshold: ≥75.

CRITERIA (with weights)
1. Reusable material % (30 pts)
   - Bronze: ≥60%   |   Gold: ≥90%
2. Modular vs custom build (15 pts)
   - Bronze: hybrid |   Gold: ≥70% modular
3. Single-use materials prohibited (15 pts)
   - Bronze: zero foam, zero PVC
   - Gold: zero foam, zero PVC, zero non-FSC wood
4. Transport (km, total truck distance) (10 pts)
   - Bronze: < 1500 km |   Gold: < 800 km
5. Stand peak power consumption (10 pts)
   - Bronze: < 8 kW per 100 sqm |   Gold: < 5 kW per 100 sqm
6. Lighting (5 pts)
   - Bronze: 100% LED |   Gold: 100% LED + occupancy sensors
7. Confirmed post-event reuse (15 pts)
   - Bronze: WH inventory return |   Gold: client signs reuse-back commitment

FLAGS (auto-block, regardless of score)
- Any single-use plastic giveaway → block.
- Any non-disclosed material origin → block.
- Any PM not certified on the Reuse Protocol → flag for OD review.

OUTPUT
- Score 0-100 + tier (None / Bronze / Gold).
- Top 3 swap recommendations with EUR cost delta.
- Slack post to #sustainability with Irazu as owner.$$,
'pending')
on conflict do nothing;

-- Margin policy (knowledge_documents type=margin_policy) -----------------

insert into knowledge_documents (type, name, version, content, embeddings_status) values
('margin_policy', 'Standard Markups & Pre-Costing Matrix', 'v1.0',
$$Source: Ops Manual v6 §3.2 - §3.4.

STANDARD MARKUPS
- Construction (carpentry, flooring, graphics): 45%
- AV (screens, LED, sound): 20%
- Logistics / transport: 25%
- Venue services (electricity, rigging, cleaning, badge scanners): 15% (pass-through service fee)
- Design / creative direction: 50-80%
- Reused inventory items: 60-80% (near-zero base cost)

PRE-COSTING TYPOLOGY (EUR / sqm production cost)
- Standard Custom (single height): 250-380
- Premium Custom (high finishes):  400-580
- Double Height:                    480-750
- AV-Heavy (LED walls, interactive): 400-650
- Modular / Hybrid:                  180-280
- Island 4-open: add 15-20% over base

REUSE CREDIT
- Deduct 40-60% of new-build cost for warehouse assets reused.
- Final reuse decision: PM-led (<90k) or DT-led (>90k); final call is always PM.

SANITY CHECK (RFP Triage Agent uses this)
- If quoted EUR / sqm > 15% above the typology range → flag for review.
- If sell_price / target_cost margin < 35% → flag at OD for sign-off.$$,
'pending')
on conflict do nothing;
