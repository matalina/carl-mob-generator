// The mob library, kept in this browser's local storage. Nothing leaves the device.
import { ref, watch } from 'vue';
import type { SavedMob } from './types';

const MOBS_KEY = 'carl-mob-forge:mobs';
const SETTINGS_KEY = 'carl-mob-forge:settings';

export interface Settings {
	author: string;
	packName: string;
}

function load<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function persist(key: string, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage full or blocked (private mode): the library still works for this visit.
	}
}

export const mobs = ref<SavedMob[]>(load<SavedMob[]>(MOBS_KEY, []).filter((m) => m && m.id && m.mob));
export const settings = ref<Settings>({ author: '', packName: '', ...load<Partial<Settings>>(SETTINGS_KEY, {}) });

watch(mobs, (v) => persist(MOBS_KEY, v), { deep: true });
watch(settings, (v) => persist(SETTINGS_KEY, v), { deep: true });

export function saveMob(mob: SavedMob) {
	const copy: SavedMob = JSON.parse(JSON.stringify(mob));
	const i = mobs.value.findIndex((m) => m.id === copy.id);
	// The library's own record of the last export wins over the editor's copy.
	if (i !== -1) copy.exportedAt = mobs.value[i]!.exportedAt;
	if (i === -1) mobs.value.unshift(copy);
	else mobs.value.splice(i, 1, copy);
}

export function removeMob(id: string) {
	mobs.value = mobs.value.filter((m) => m.id !== id);
}

/** Exported, and not changed since. */
export const isExported = (m: SavedMob) => !!m.exportedAt && m.exportedAt >= m.updatedAt;

export function markExported(ids: string[]) {
	const now = new Date().toISOString();
	const set = new Set(ids);
	for (const m of mobs.value) if (set.has(m.id)) m.exportedAt = now;
}

/** Removes every mob that has been exported and not changed since; returns their ids. */
export function removeExported(): string[] {
	const gone = mobs.value.filter(isExported).map((m) => m.id);
	mobs.value = mobs.value.filter((m) => !isExported(m));
	return gone;
}

export function removeAll(): string[] {
	const gone = mobs.value.map((m) => m.id);
	mobs.value = [];
	return gone;
}

// Keep other tabs in step.
window.addEventListener('storage', (e) => {
	if (e.key === MOBS_KEY) mobs.value = load<SavedMob[]>(MOBS_KEY, []);
	if (e.key === SETTINGS_KEY) settings.value = { author: '', packName: '', ...load<Partial<Settings>>(SETTINGS_KEY, {}) };
});
