export type RuntimeUnit = 'tmdb' | 'semantic' | 'vision';
export type RuntimePhase = 'ready' | 'loading' | 'standby' | 'failed';
export type RuntimeSnapshot = Record<RuntimeUnit, RuntimePhase>;
const initial: RuntimeSnapshot = { tmdb: 'loading', semantic: 'standby', vision: 'standby' };
const key = '__seraRuntimeStatus';

export function runtimeSnapshot(): RuntimeSnapshot {
  if (typeof window === 'undefined') return initial;
  return { ...initial, ...(window as Window & { [key]?: RuntimeSnapshot })[key] };
}
export function setRuntimeStatus(unit: RuntimeUnit, phase: RuntimePhase) {
  if (typeof window === 'undefined') return;
  const scope = window as Window & { [key]?: RuntimeSnapshot };
  scope[key] = { ...runtimeSnapshot(), [unit]: phase };
  window.dispatchEvent(new CustomEvent('sera-runtime-status', { detail: scope[key] }));
}
