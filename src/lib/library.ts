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
	if (i === -1) mobs.value.unshift(copy);
	else mobs.value.splice(i, 1, copy);
}

export function removeMob(id: string) {
	mobs.value = mobs.value.filter((m) => m.id !== id);
}

// Keep other tabs in step.
window.addEventListener('storage', (e) => {
	if (e.key === MOBS_KEY) mobs.value = load<SavedMob[]>(MOBS_KEY, []);
	if (e.key === SETTINGS_KEY) settings.value = { author: '', packName: '', ...load<Partial<Settings>>(SETTINGS_KEY, {}) };
});
