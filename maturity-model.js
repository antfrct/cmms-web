// Relix maturity levels — per-site level (1 Essential · 2 Advanced · 3 Expert) for each Relix concept, plus per-feature overrides (custom mode).
// Storage cmms.maturity.v1 { [siteId]: { levels: {concept: 1|2|3}, over: {featureId: bool}, log: [{at, by, concept, from, to, feature, on}] } }. Event cmms-maturity. window.RelixMaturity.
// A feature is on when: its override says so, else its level <= the concept's level; and its `req` feature is on. Core features are always on.
// UI gating: every page that loads this module gets a <style id="relix-maturity"> hiding [data-feature~="<id>"] for features that are off;
// Sidebar + TopBar guard use pageFeature(path); pages may call on(id) for logic (wizard steps, default views).
const KEY = 'cmms.maturity.v1';
const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const wr = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
const emit = d => { try { window.dispatchEvent(new CustomEvent('cmms-maturity', { detail: d })); } catch (e) {} };
const curSite = () => { try { return localStorage.getItem('cmms.site') || 'THO'; } catch (e) { return 'THO'; } };

export const LEVELS = [[1, 'Essential'], [2, 'Advanced'], [3, 'Expert']];
// [id, level, name, where it shows in Relix, opts]  opts: core (always on), req (needs another feature), ai (also needs Advanced features switch)
const FT = {
  wo: [
    ['wo.core', 1, 'Interventions', 'Create, assign, follow and close interventions — asset, what to do, priority, type', { core: 1 }],
    ['wo.checklists', 1, 'Checklists on interventions', 'Pick checklists when creating or editing an intervention and run them step by step', { core: 1 }],
    ['wo.quick', 1, 'Quick intervention', 'Start a job in two steps from the top bar and Home'],
    ['wo.chat', 1, 'Intervention discussion', 'Discussion panel on the intervention and chat during the intervention'],
    ['wo.followup', 2, 'Follow-up people', '“Include in follow-up” field — people kept informed without being assigned'],
    ['wo.fields', 2, 'Analysis fields', 'Failure origin and custom fields on interventions (added on demand in forms)'],
    ['wo.history', 2, 'Change history', 'History section on the intervention'],
    ['wo.strict', 3, 'Complete data entry', 'Description, request date and failure origin shown by default — description required'],
    ['wo.costs', 3, 'Costs per intervention', 'Cost card, cost center and external services / rentals on the intervention'],
    ['wo.rca', 3, 'Root cause analysis', 'Root cause and preventive actions on corrective interventions']],
  cl: [
    ['cl.core', 1, 'Basic checklists', 'Instruction, tick list, yes / no, measure, comment and photo steps — help text and expected result', { core: 1 }],
    ['cl.types', 2, 'All step types', 'Choices, text, file, spare parts and consumables steps; photo or comment required per answer'],
    ['cl.media', 2, 'Photos, videos & documents on steps', 'Attachments in the step editor'],
    ['cl.skills', 2, 'Skills & duration per step', '“Who and how long” in the step editor'],
    ['cl.tools', 2, 'Mobile equipment per step', 'Equipment needed by a step, reserved in Planning', { req: 'assets.mobile' }],
    ['cl.workflow', 3, 'Branching, conditions & workflow view', '“Then go to…” per answer, branch-only steps and the Workflow view'],
    ['cl.ai', 3, 'Checklist from a document', 'AI generation in Checklists', { ai: 1 }]],
  plan: [
    ['plan.module', 1, 'Planning calendar', 'Planning page — schedule interventions by drag & drop'],
    ['plan.workload', 2, 'Workload per technician', 'Workload bars in the Planning week view', { req: 'plan.module' }],
    ['plan.auto', 3, 'Autonomous maintenance track', 'Operator routines track in Planning', { req: 'plan.module' }],
    ['plan.optimize', 3, 'Schedule optimization', 'AI optimization in Planning', { req: 'plan.module', ai: 1 }]],
  prev: [
    ['prev.module', 1, 'Maintenance plans', 'Maintenance plans page — calendar plans generate interventions'],
    ['prev.meters', 2, 'Meters & preventive per asset', 'Preventive tab on the asset (meter readings, plans)', { req: 'prev.module' }],
    ['prev.ai', 3, 'Plans from manufacturer manuals', 'AI plan generation in Maintenance plans', { req: 'prev.module', ai: 1 }]],
  assets: [
    ['assets.core', 1, 'Equipment list & sheet', 'Assets list, asset detail, location', { core: 1 }],
    ['assets.qr', 1, 'QR labels', 'QR code buttons, label printing and label formats'],
    ['assets.import', 1, 'Import from Excel / CSV', 'Bring an existing equipment list into Relix in one go'],
    ['assets.views', 2, 'Hierarchy & plant layout views', 'Hierarchy and Plant layout views of Assets'],
    ['assets.mobile', 2, 'Mobile equipment & reservations', 'Reservations tab on mobile assets, required equipment on interventions'],
    ['assets.history', 2, 'Asset history', 'History tab on the asset'],
    ['assets.risk', 3, 'Life-cycle, risk & live monitoring', 'Lifecycle and Live monitoring tabs, fleet risk view', { ai: 1 }]],
  parts: [
    ['parts.module', 1, 'Spare parts & stock', 'Spare parts page — list and quantities in stock, parts on interventions'],
    ['parts.consumables', 2, 'Consumables', 'Replacement parts / Consumables filter and consumables configuration', { req: 'parts.module' }],
    ['parts.stores', 2, 'Storerooms', 'Storage area filter and stock per storeroom', { req: 'parts.module' }],
    ['parts.catalog', 2, 'Catalog view', 'Picture catalog of spare parts', { req: 'parts.module' }],
    ['parts.suppliers', 2, 'Suppliers', 'Suppliers page', { req: 'parts.module' }],
    ['parts.forecast', 3, 'Stock forecast', 'AI forecast in Spare parts', { req: 'parts.module', ai: 1 }]],
  org: [
    ['org.core', 1, 'Users, teams & roles', 'Teams & users page', { core: 1 }],
    ['org.skills', 2, 'Skills', 'Skills in Site configuration, on profiles and assignment suggestions'],
    ['org.avail', 2, 'Shifts & absences', 'Availability tab on profiles']],
  docs: [
    ['docs.module', 1, 'Document library', 'Documents page — shared manuals and procedures'],
    ['docs.links', 2, 'Linked documents', 'Documents on assets, interventions and checklist steps', { req: 'docs.module' }]],
  notif: [
    ['notif.core', 1, 'Bell & badge', 'Notifications in the top bar', { core: 1 }],
    ['notif.prefs', 2, 'Personal preferences', 'Notification settings — choose what you are notified about, email for urgent ones']],
  perf: [
    ['perf.core', 1, 'Home indicators', 'Open, late and done on Home', { core: 1 }],
    ['perf.dashboard', 2, 'Site dashboard', 'Site dashboard page — MTTR, downtime, preventive share']],
};
// [key, name, icon, tagline, [L1, L2, L3 descriptions]]
const C = [
  ['wo', 'Interventions', 'build', 'Report, follow and close maintenance jobs', ['Create a job in a few taps, add a checklist, assign it, close it. Optional fields only when you need them.', 'Follow-up people, failure origin, custom fields and change history.', 'Complete data entry, costs per job and root-cause analysis.']],
  ['cl', 'Checklists', 'checklist', 'Guide technicians step by step', ['Simple linear checklists: instructions, ticks, yes / no, measures, comments, photos.', 'Every step type, plus photos, skills, durations and mobile equipment on steps.', 'Branching, conditions, workflow view and generation from documents.']],
  ['plan', 'Planning', 'calendar_month', 'Organize the team’s week', ['See who works on what, in one calendar.', 'Balance the workload of each technician.', 'Plan operator routines too, and optimize the schedule.']],
  ['prev', 'Preventive maintenance', 'event_repeat', 'Prevent breakdowns before they happen', ['Repeat key jobs on a fixed calendar.', 'Plan by usage too — meters and readings per asset.', 'Build plans directly from manufacturer manuals.']],
  ['assets', 'Assets', 'precision_manufacturing', 'Know your equipment', ['A clear list of your equipment, where it is, with QR labels — import it from Excel.', 'Plant hierarchy, plant layout, mobile equipment and asset history.', 'Life-cycle, risk and live monitoring.']],
  ['parts', 'Spare parts', 'inventory_2', 'Have the right part at the right time', ['A simple list of the parts you keep and how many are left.', 'Consumables, storerooms, suppliers and a picture catalog.', 'Stock forecasts.']],
  ['org', 'Maintenance organization', 'groups', 'Structure the team and its roles', ['Users, teams and roles.', 'Skills, shifts and absences so the right person gets the job.', 'Multi-team and multi-site organization.']],
  ['docs', 'Documents', 'description', 'Find the right document on the spot', ['Keep manuals and procedures in one shared library.', 'Link documents to equipment, jobs and checklist steps.', 'Controlled documentation with versions and archiving.']],
  ['notif', 'Alerts & notifications', 'notifications', 'Be told what matters', ['Get notified when a job is assigned to you or becomes late.', 'Choose what you are notified about, and get urgent ones by email.', 'Site-wide alert rules (coming later).']],
  ['perf', 'Costs & performance', 'monitoring', 'Measure and improve', ['A few simple indicators: open, late and done.', 'Site dashboard: MTTR, downtime, preventive vs corrective.', 'Full cost control and continuous improvement.']],
];
export const FEATURES = [];
Object.entries(FT).forEach(([concept, list]) => list.forEach(([id, level, name, where, o = {}]) => FEATURES.push({ id, concept, level, name, where, core: !!o.core, req: o.req || null, ai: !!o.ai })));
export const feature = id => FEATURES.find(f => f.id === id);
export const CONCEPTS = C.map(([key, name, icon, tagline, descs]) => ({ key, name, icon, tagline,
  features: FEATURES.filter(f => f.concept === key),
  levels: descs.map((desc, i) => { const can = FEATURES.filter(f => f.concept === key && f.level === i + 1).map(f => f.name); return { n: i + 1, name: LEVELS[i][1], desc, can: can.length ? can : ['Coming soon'] }; }) }));
// Starting point per site (demo data).
const DEF = { THO: { wo: 3, cl: 2, plan: 2, prev: 2, assets: 2, parts: 2, org: 2, docs: 1, notif: 1, perf: 1 }, SAU: { wo: 2, cl: 1, plan: 1, prev: 1, assets: 1, parts: 1, org: 1, docs: 1, notif: 1, perf: 1 } };
const def = site => DEF[site] || Object.fromEntries(CONCEPTS.map(c => [c.key, 1]));
export const levels = (site = curSite()) => ({ ...def(site), ...((rd()[site] || {}).levels || {}) });
export const overrides = (site = curSite()) => (rd()[site] || {}).over || {};
export const logOf = (site = curSite()) => (rd()[site] || {}).log || [];
const byLevel = (f, lv) => f.level <= (lv[f.concept] || 1);
// own = the feature's own choice (ignores req); on = effective.
export const own = (id, site = curSite()) => { const f = feature(id); if (!f) return true; if (f.core) return true; const o = overrides(site); return id in o ? !!o[id] : byLevel(f, levels(site)); };
export const on = (id, site = curSite()) => { const f = feature(id); if (!f) return true; if (!own(id, site)) return false; return f.req ? on(f.req, site) : true; };
export const isCustom = (site = curSite()) => Object.keys(overrides(site)).length > 0;
export const customOf = (key, site = curSite()) => { const o = overrides(site); return FEATURES.filter(f => f.concept === key && f.id in o).length; };
const save = (site, fn, logEntry) => { const all = rd(), cur = all[site] || {}; const next = fn({ levels: { ...levels(site) }, over: { ...(cur.over || {}) } });
  all[site] = { ...next, log: logEntry ? [{ at: Date.now(), by: 'GD', ...logEntry }, ...(cur.log || [])].slice(0, 60) : (cur.log || []) }; wr(all); };
// Picking a level resets that area's custom choices.
export const setLevel = (site, key, n) => { const from = levels(site)[key], had = customOf(key, site); if (from === n && !had) return;
  save(site, s => { s.levels[key] = n; FEATURES.filter(f => f.concept === key).forEach(f => delete s.over[f.id]); return s; }, { concept: key, from, to: n }); emit({ site, key, from, to: n }); };
export const setFeature = (site, id, val) => { const f = feature(id); if (!f || f.core) return; const lvOn = byLevel(f, levels(site));
  save(site, s => { if (val === lvOn) delete s.over[id]; else s.over[id] = !!val; return s; }, { concept: f.concept, feature: id, on: !!val }); emit({ site, feature: id, on: !!val }); };
export const resetCustom = (site, key) => { save(site, s => { FEATURES.filter(f => !key || f.concept === key).forEach(f => delete s.over[f.id]); return s; }, { concept: key || null, feature: null, resetCustom: true }); emit({ site, resetCustom: key || true }); };
export const reset = site => { const all = rd(); delete all[site]; wr(all); emit({ site, reset: true }); };
export const score = (site = curSite()) => { const lv = levels(site), earned = CONCEPTS.reduce((a, c) => a + (lv[c.key] || 1), 0); return { earned, max: CONCEPTS.length * 3, min: CONCEPTS.length }; };
export const counts = (site = curSite()) => { const opt = FEATURES.filter(f => !f.core); return { on: opt.filter(f => on(f.id, site)).length, total: opt.length }; };
export const STAGES = [[0, 'Getting started', 'The essentials are in place — a simple, solid way to run maintenance.'], [0.5, 'Building up', 'Your site uses Relix beyond the basics in several areas.'], [0.7, 'Well established', 'Most areas run at an advanced level.'], [0.9, 'Expert site', 'Your site uses Relix to its full potential.']];
export const stageOf = (earned, max) => { const r = earned / max; return STAGES.filter(s => r >= s[0]).pop(); };
// Maturity only changes what is shown and offered — never stored data. Fields that already hold a value stay visible, and
// existing checklists run in full in Intervention whatever the level (authoring is gated, execution is not).
// Whole pages switched off by maturity (TopBar guard + Sidebar).
export const PAGE_FEATURE = [[/Planning/i, 'plan.module'], [/MaintenancePlans|Maintenance Plans/i, 'prev.module'], [/Documents/i, 'docs.module'], [/Suppliers/i, 'parts.suppliers'], [/SpareParts|Spare Parts/i, 'parts.module'], [/SiteDashboard|Site Dashboard/i, 'perf.dashboard'], [/NotificationSettings|Notification Settings/i, 'notif.prefs']];
export const pageFeature = p => { const f = decodeURIComponent((p || '').split('/').pop() || ''); const m = PAGE_FEATURE.find(([re]) => re.test(f)); return m ? m[1] : null; };
export const applyCSS = () => { if (typeof document === 'undefined') return; let el = document.getElementById('relix-maturity'); if (!el) { el = document.createElement('style'); el.id = 'relix-maturity'; document.head.appendChild(el); }
  const off = FEATURES.filter(f => !on(f.id)); el.textContent = off.map(f => `[data-feature~="${f.id}"]`).join(',') + (off.length ? '{display:none!important}' : ''); };
if (typeof window !== 'undefined') {
  window.RelixMaturity = { LEVELS, CONCEPTS, FEATURES, STAGES, feature, levels, overrides, logOf, own, on, isCustom, customOf, setLevel, setFeature, resetCustom, reset, score, counts, stageOf, pageFeature, applyCSS };
  if (!window.__relixMatCSS) { window.__relixMatCSS = 1; applyCSS(); window.addEventListener('cmms-maturity', applyCSS); window.addEventListener('cmms-site', () => setTimeout(applyCSS)); window.addEventListener('storage', e => { if (e.key === KEY) applyCSS(); }); emit({ ready: true }); }
}
