// Relix alert rules — trigger × asset scope × recipients (storage cmms.alert.rules.v1, event cmms-alert-rules). window.RelixAlerts.
// Evaluated on each page load by the TopBar; matching rules notify their recipients once per rule × asset × day (type 'alert-rule').
import * as C from './collab-model.js';
import * as PL from './plant-model.js';
import * as P from './plans-model.js';
const KEY = 'cmms.alert.rules.v1';
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const emit = () => { try { window.dispatchEvent(new CustomEvent('cmms-alert-rules')); } catch (e) {} };
export const TRIGGERS = {
  recurring: ['Recurring failures', 'repeat', 'N corrective work orders on the same asset within a time window'],
  overdue: ['Work order overdue', 'schedule', 'An open work order passes its planned date by N days'],
  stopped: ['Equipment stopped', 'report', 'An asset in scope is Stopped or Out of service'],
  control: ['Control / calibration due', 'verified', 'An inspection or calibration plan falls due within N days'],
};
export const SCOPES = { all: 'All assets', asset: 'Specific assets', owner: 'Assets owned by', zone: 'Plant zone', crit: 'Criticality' };
// Corrective history used for recurring-failure detection (last 30 days) + corrective work orders created in Relix.
const FAILS = [['V-12', '2026-09-03'], ['V-12', '2026-09-11'], ['V-12', '2026-09-22'], ['V-12', '2026-09-29'], ['CV-L3', '2026-09-08'], ['CV-L3', '2026-09-19'], ['CV-L3', '2026-09-28'], ['P-101', '2026-09-14'], ['P-101', '2026-09-27'], ['PH-030', '2026-09-10'], ['PH-030', '2026-09-26'], ['TB-01', '2026-09-29'], ['BC-548', '2026-09-17']];
const SEED = [
  { id: 'ar1', name: 'Recurring failures', trigger: 'recurring', n: 3, days: 30, scope: 'all', values: [], recipients: ['GD', 'CM'], active: true },
  { id: 'ar2', name: 'Critical equipment stopped', trigger: 'stopped', n: 0, days: 0, scope: 'crit', values: ['Critical'], recipients: ['GD', 'LB'], active: true },
  { id: 'ar3', name: 'Regulatory controls & calibrations', trigger: 'control', n: 14, days: 14, scope: 'all', values: [], recipients: ['GD', 'ER'], active: true },
  { id: 'ar4', name: 'Float Line overdue work', trigger: 'overdue', n: 2, days: 0, scope: 'owner', values: ['MD'], recipients: ['MD', 'GD'], active: false },
];
export const all = () => rd(KEY, null) || SEED.map(r => ({ ...r }));
export const save = r => { const rows = all(), i = rows.findIndex(x => x.id === r.id); if (i >= 0) rows[i] = { ...rows[i], ...r }; else rows.push({ ...r, id: r.id || 'ar' + Date.now().toString(36) }); wr(KEY, rows); emit(); };
export const remove = id => { wr(KEY, all().filter(r => r.id !== id)); emit(); };
export const reset = () => { try { localStorage.removeItem(KEY); } catch (e) {} emit(); };
const inScope = (r, a) => { if (!a) return false; const v = r.values || []; switch (r.scope) { case 'asset': return v.includes(a.id); case 'owner': return v.includes(a.owner); case 'zone': return v.includes((PL.zoneOf(a.loc) || {}).id); case 'crit': return v.includes(a.crit); default: return true; } };
export const failuresOf = (assetId, days = 30) => { const a = PL.asset(assetId), since = P.addDays(P.TODAY, -days);
  const store = C.createdWos().filter(w => w.type === 'Corrective' && (w.assetCode === assetId || (a && w.asset === a.name))).map(w => new Date(w.createdAt || Date.now()).toISOString().slice(0, 10));
  return [...FAILS.filter(f => f[0] === assetId).map(f => f[1]), ...store].filter(d => d >= since); };
// Current matches of a rule: [{ assetId, asset, detail, href }]
export const matches = r => {
  const assets = PL.assets().filter(a => inScope(r, a));
  if (r.trigger === 'recurring') return assets.map(a => ({ a, n: failuresOf(a.id, +r.days || 30).length })).filter(x => x.n >= (+r.n || 3)).map(({ a, n }) => ({ assetId: a.id, asset: a.name, detail: `${n} corrective work orders in ${r.days || 30} days`, href: 'AssetDetail.dc.html?id=' + encodeURIComponent(a.id) + '&tab=wo' }));
  if (r.trigger === 'stopped') return assets.filter(a => a.status !== 'In service').map(a => ({ assetId: a.id, asset: a.name, detail: a.status, href: 'AssetDetail.dc.html?id=' + encodeURIComponent(a.id) }));
  if (r.trigger === 'control') return P.reminders(+r.n || 14).filter(x => x.days <= (+r.n || 14) && (!x.assetId || inScope(r, PL.asset(x.assetId)))).map(x => ({ assetId: x.assetId, asset: x.asset, detail: `${x.title} · ${x.days < 0 ? 'overdue' : x.days === 0 ? 'today' : 'in ' + x.days + ' d'}`, href: x.href }));
  if (r.trigger === 'overdue') return C.createdWos().filter(w => w.status !== 'Completed' && w.due && P.daysFrom(w.due.slice(0, 10)) <= -(+r.n || 0) && inScope(r, PL.asset(w.assetCode || w.asset))).map(w => ({ assetId: w.assetCode, asset: w.asset, detail: `${w.task} · ${-P.daysFrom(w.due.slice(0, 10))} d late`, href: C.woHref(w.key) }));
  return [];
};
export const evaluate = () => { all().filter(r => r.active && (r.recipients || []).includes(C.ME)).forEach(r => matches(r).slice(0, 3).forEach(m => C.notify({ id: `rule-${r.id}-${m.assetId}-${P.TODAY}`, type: 'alert-rule', lvl: r.trigger === 'stopped' ? 'crit' : 'imp', icon: TRIGGERS[r.trigger][1], kind: `Alert rule · ${r.name}`, title: m.asset, sub: m.detail, href: m.href }))); };
if (typeof window !== 'undefined') window.RelixAlerts = { TRIGGERS, SCOPES, all, save, remove, reset, matches, evaluate, failuresOf };
