// Relix maturity levels — per-site level (1 Essential · 2 Advanced · 3 Expert) for each Relix concept.
// Storage cmms.maturity.v1 { [siteId]: { levels: {concept: 1|2|3}, log: [{at, by, concept, from, to}] } }. Event cmms-maturity. window.RelixMaturity.
// Configuration only for now — other modules do not read it yet.
const KEY = 'cmms.maturity.v1';
const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const wr = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
const emit = d => { try { window.dispatchEvent(new CustomEvent('cmms-maturity', { detail: d })); } catch (e) {} };

export const LEVELS = [[1, 'Essential'], [2, 'Advanced'], [3, 'Expert']];
// [key, name, icon, tagline, [L1, L2, L3] each [description, [what you can do…]]]
const C = [
  ['wo', 'Work orders', 'build', 'Report, follow and close maintenance jobs', [
    ['Create a job, assign it, close it. Everyone sees what needs to be done.', ['Simple job list', 'Priority & status', 'Close with a comment']],
    ['Plan jobs with dates, parts and checklists, and keep the team in the loop.', ['Board view', 'Parts & checklists', 'Work order chat']],
    ['Run every job end to end, with costs, history and root-cause analysis.', ['Costs per job', 'Full history', 'Root cause analysis']]]],
  ['cl', 'Checklists', 'checklist', 'Guide technicians step by step', [
    ['Simple linear checklists with basic steps to tick off.', ['Ordered steps', 'Done / not done', 'Notes']],
    ['More step types, photos, skills, mobile equipment and simple conditions.', ['Measures & choices', 'Photos & documents', 'Skills per step']],
    ['Full capabilities: advanced conditions, workflow view and complex execution flows.', ['Branching logic', 'Workflow view', 'Multiple endings']]]],
  ['plan', 'Planning', 'calendar_month', 'Organize the team’s week', [
    ['See who works on what this week, in one calendar.', ['Week calendar', 'Drag to schedule']],
    ['Balance the workload with shifts, absences and skills.', ['Workload per person', 'Shifts & absences', 'Skill check']],
    ['Plan around equipment, reservations and shutdowns, split jobs between people.', ['Equipment reservations', 'Split by skill', 'Smart suggestions']]]],
  ['prev', 'Preventive maintenance', 'event_repeat', 'Prevent breakdowns before they happen', [
    ['Repeat a few key jobs on a fixed calendar.', ['Calendar plans', 'Automatic work orders']],
    ['Plan by usage too — hours, cycles — and get reminded before it is due.', ['Meter-based plans', 'Due-soon reminders', 'Inspections & calibrations']],
    ['Prevention driven by data: readings, thresholds and predictive insights.', ['Condition monitoring', 'Recurring-failure alerts', 'Predictive insights']]]],
  ['assets', 'Assets', 'precision_manufacturing', 'Know your equipment', [
    ['A clear list of your equipment, where it is and who looks after it.', ['Equipment list', 'Location', 'QR labels']],
    ['A complete equipment sheet with specifications, documents and photos.', ['Plant hierarchy', 'Specs & photos', 'Mobile equipment']],
    ['Life-cycle view: meters, history, criticality and replacement planning.', ['Meters & history', 'Life-cycle & risk', 'Bulk import']]]],
  ['parts', 'Spare parts', 'inventory_2', 'Have the right part at the right time', [
    ['A simple list of the parts you keep and how many are left.', ['Parts list', 'Quantity in stock']],
    ['Storerooms, minimum stock and parts linked to equipment and checklists.', ['Storerooms', 'Low-stock alerts', 'Parts per equipment']],
    ['Consumables, suppliers, costs and stock forecasts.', ['Consumables', 'Suppliers & costs', 'Forecasts']]]],
  ['org', 'Maintenance organization', 'groups', 'Structure the team and its roles', [
    ['A small team: everyone can do everything.', ['Team members', 'One role']],
    ['Teams, roles and skills so the right person gets the job.', ['Several teams', 'Roles & rights', 'Skills']],
    ['Multi-team and multi-site organization with skill levels and automatic assignment.', ['Skill levels', 'Auto-assignment', 'Multi-site']]]],
  ['docs', 'Documents', 'description', 'Find the right document on the spot', [
    ['Keep manuals and procedures in one shared library.', ['Shared library', 'Search']],
    ['Link documents to equipment, jobs and checklist steps.', ['Linked documents', 'Categories']],
    ['Controlled documentation with versions and archiving.', ['Versions', 'Archive', 'Change notes']]]],
  ['notif', 'Alerts & notifications', 'notifications', 'Be told what matters', [
    ['Get notified when a job is assigned to you or becomes late.', ['Bell & badge', 'Assigned & overdue']],
    ['Choose what you receive, how, and when.', ['Personal preferences', 'Email & mobile', 'Quiet hours']],
    ['Site-wide alert rules on equipment, owners and recurring failures.', ['Alert rules', 'Recipients per rule', 'Recurring failures']]]],
  ['perf', 'Costs & performance', 'monitoring', 'Measure and improve', [
    ['A few simple indicators: open, late and done.', ['Open / late / done']],
    ['Track availability, repair times and preventive share.', ['MTTR & MTBF', 'Preventive vs corrective', 'Downtime']],
    ['Full cost control and continuous improvement.', ['Costs per asset', 'Budgets', 'Improvement actions']]]],
];
export const CONCEPTS = C.map(([key, name, icon, tagline, lv]) => ({ key, name, icon, tagline, levels: lv.map(([desc, can], i) => ({ n: i + 1, name: LEVELS[i][1], desc, can })) }));
// Starting point per site (demo data).
const DEF = { THO: { wo: 3, cl: 2, plan: 2, prev: 2, assets: 2, parts: 2, org: 2, docs: 1, notif: 1, perf: 1 }, SAU: { wo: 2, cl: 1, plan: 1, prev: 1, assets: 1, parts: 1, org: 1, docs: 1, notif: 1, perf: 1 } };
const def = site => DEF[site] || Object.fromEntries(CONCEPTS.map(c => [c.key, 1]));
export const levels = site => ({ ...def(site), ...((rd()[site] || {}).levels || {}) });
export const logOf = site => (rd()[site] || {}).log || [];
export const setLevel = (site, key, n, by = 'GD') => { const all = rd(), cur = all[site] || {}, lv = { ...levels(site) }, from = lv[key]; if (from === n) return; lv[key] = n;
  all[site] = { levels: lv, log: [{ at: Date.now(), by, concept: key, from, to: n }, ...(cur.log || [])].slice(0, 40) }; wr(all); emit({ site, key, from, to: n }); };
export const reset = site => { const all = rd(); delete all[site]; wr(all); emit({ site, reset: true }); };
export const score = site => { const lv = levels(site), earned = CONCEPTS.reduce((a, c) => a + (lv[c.key] || 1), 0); return { earned, max: CONCEPTS.length * 3, min: CONCEPTS.length }; };
// Journey stages (by share of stars). Every stage is a valid way of running maintenance.
export const STAGES = [[0, 'Getting started', 'The essentials are in place — a simple, solid way to run maintenance.'], [0.5, 'Building up', 'Your site uses Relix beyond the basics in several areas.'], [0.7, 'Well established', 'Most areas run at an advanced level.'], [0.9, 'Expert site', 'Your site uses Relix to its full potential.']];
export const stageOf = (earned, max) => { const r = earned / max; return STAGES.filter(s => r >= s[0]).pop(); };
if (typeof window !== 'undefined') window.RelixMaturity = { LEVELS, CONCEPTS, STAGES, levels, logOf, setLevel, reset, score, stageOf };
