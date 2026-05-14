-- Seed data extracted from Ops Manual v6, Comparativa Carpinteros 2026 and
-- Capacity Dashboard. Re-run safely (uses ON CONFLICT).

insert into suppliers (name, tier, country, category, max_concurrent, active_projects, rating, notes) values
  ('Gualoga',    1, 'Spain',  'Carpentry',              4, 3, 4.4, 'Strong on premium custom. Reliable but full Q1.'),
  ('Idea Expo',  1, 'Poland', 'Carpentry / Modular',    5, 2, 4.6, 'Best PL pricing for 200-400 sqm builds. Direct via Lukasz.'),
  ('Plus Expo',  1, 'Poland', 'Carpentry / Modular',    3, 3, 4.3, 'Full capacity. Soft-reserve required for Sep-Oct 2026.'),
  ('Neo Expo',   1, 'Poland', 'Carpentry',              3, 1, 4.2, 'Reliable. Slower comms.'),
  ('Reflex',     1, 'Poland', 'Carpentry / AV-heavy',   4, 2, 3.7, 'Watch. ISE Focal incident — packaging/rigging failures.'),
  ('INTEA',      2, 'Spain',  'Carpentry',              3, 1, 4.0, 'Used for sub-50K projects.'),
  ('One Group',  1, 'Poland', 'Carpentry / Strategic',  3, 1, 4.7, 'Lukasz/Kamil. Default recommendation when saving > 20% vs local.'),
  ('CBS',        1, 'Spain',  'Premium Custom',         3, 2, 4.1, 'Premium finishes. Caution: concurrent load.')
on conflict (name) do nothing;

insert into projects (code, client, event, venue, hall, stand_no, sqm, pvp_client, precio_objetivo, classification, client_typology, stage, pm_initials, creative_lead, event_date, setup_start) values
  ('ALSTOM-IT26',  'Alstom',       'InnoTrans 2026', 'Messe Berlin',   '21', null,    600,  1250000, 760000, 'strategic',  'experience_seeker','design',     'MM', 'Patricia Ceuca', '2026-09-22', '2026-09-16'),
  ('ZTE-MWC26',    'ZTE',          'MWC 2026',       'Fira Gran Via',  '3',  '3F30',  2256, 638500,  null,   'strategic',  'brand_sensitive',  'production', 'MM', 'Patricia Ceuca', '2026-02-23', '2026-02-17'),
  ('FOCAL-ISE26',  'Focal & Naim', 'ISE 2026',       'Fira Gran Via',  '2',  '2G420', 144,  112000,  89686,  'functional', 'price_sensitive',  'closed',     'IA', null,             '2026-02-02', '2026-01-27'),
  ('BOSCH-ISE26',  'Bosch',        'ISE 2026',       'Fira Gran Via',  '3',  '3B300', 204,  237400,  110000, 'strategic',  'brand_sensitive',  'won',        'EC', 'Patricia Ceuca', '2026-02-02', '2026-01-27'),
  ('LOEWE-ISE26',  'Loewe',        'ISE 2026',       'Fira Gran Via',  '2',  '2E500', 96,   68000,   40000,  'functional', 'repeat',           'quotation',  'MG', null,             '2026-02-02', '2026-01-27'),
  ('RICOH-ISE26',  'Ricoh',        'ISE 2026',       'Fira Gran Via',  '2',  '2V130', 126,  163866,  90000,  'strategic',  'brand_sensitive',  'production', 'MO', 'Patricia Ceuca', '2026-02-02', '2026-01-27'),
  ('BAYER-CPHI26', 'Bayer',        'CPHI 2026',      'Frankfurt Messe',null, null,    182,  239000,  null,   'strategic',  'experience_seeker','quotation',  'EC', 'Patricia Ceuca', '2026-10-12', '2026-10-07'),
  ('PANDROL-26',   'Pandrol',      'Railway Tech 2026', null,          null, null,    416,  400000,  250000, 'strategic',  'brand_sensitive',  'briefing',   'GV', null,             '2026-11-10', '2026-11-05')
on conflict (code) do nothing;

insert into knowledge_entries (category, title, body, tags) values
  ('voice',           'Pro Expo voice — short form',                   'Direct, calm, decisive. We prefer evidence over adjectives. Sentences earn their length. No emojis in client comms.',                                              array['voice','comms']),
  ('margins',         'Standard markups (Ops Manual §3.4)',            'Construction 45% · AV 20% · Logistics 25% · Venue services 15% (pass-through) · Design 50-80% · Reused inventory 60-80%.',                                       array['margins','pricing']),
  ('margins',         'Pre-Costing typology (Ops Manual §3.2)',        'Standard Custom 250-380 €/sqm · Premium 400-580 · Double Height 480-750 · AV-Heavy 400-650 · Modular 180-280. Island +15-20%.',                                  array['pricing','typology']),
  ('sustainability',  'Reuse credit & Inventory Reuse Protocol',       'Deduct 40-60% of new-build cost for warehouse assets. Reuse decision: PM-led (<90k) or DT-led (>90k); final call always PM.',                                     array['sustainability','reuse']),
  ('suppliers',       'Tier 1 builders (active rate cards)',           'Gualoga (ES), Idea Expo (PL), Plus Expo (PL), Neo Expo (PL), CBS (ES), One Group (PL). Polish default when saving > 20%.',                                       array['suppliers','tier1']),
  ('venues',          'Fira Gran Via — Barcelona',                     'Floor load varies by hall. Rigging certification mandatory. ISE / MWC peak windows: Jan-Feb / Feb-Mar. Loading dock access hours strict.',                       array['venue','fira','barcelona'])
on conflict do nothing;
