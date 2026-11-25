<script setup lang="ts">
import { computed, ref } from 'vue';
import AppUpdate from './components/AppUpdate.vue';
import AttacksEditor from './components/AttacksEditor.vue';
import InstallButton from './components/InstallButton.vue';
import ForgeForm from './components/ForgeForm.vue';
import LibraryPanel from './components/LibraryPanel.vue';
import MobCard from './components/MobCard.vue';
import { crawlerForgePack } from './lib/crawlerforge';
import { copyText } from './lib/download';
import { forgeMob, type ForgeOptions } from './lib/generate';
import { mobs, saveMob, settings } from './lib/library';
import { mobNote } from './lib/markdown';
import { displayName, newId, type SavedMob } from './lib/types';

const version = __APP_VERSION__;
const commit = __APP_COMMIT__;
const built = new Date(__BUILD_DATE__).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const DEFAULTS: ForgeOptions = { floor: 3, level: 14, rank: 'Mob', size: 4, creature: 'Humanoid', role: 'brute', armor: null };

function blank(opts: ForgeOptions = DEFAULTS): SavedMob {
	const now = new Date().toISOString();
	return { id: newId(), name: '', description: '', opts: { ...opts }, mob: forgeMob(opts), traits: [], createdAt: now, updatedAt: now };
}

const draft = ref<SavedMob>(blank());
const saved = computed(() => mobs.value.find((m) => m.id === draft.value.id) ?? null);
const status = ref('');
let statusTimer: number | undefined;

function flash(text: string) {
	status.value = text;
	clearTimeout(statusTimer);
	statusTimer = window.setTimeout(() => (status.value = ''), 2500);
}

function roll() {
	draft.value.mob = forgeMob(draft.value.opts);
}

function save() {
	draft.value.updatedAt = new Date().toISOString();
	saveMob(draft.value);
	flash(`Saved ${displayName(draft.value)}.`);
}

function saveAsNew() {
	const now = new Date().toISOString();
	draft.value = { ...JSON.parse(JSON.stringify(draft.value)), id: newId(), createdAt: now, updatedAt: now };
	save();
}

function startNew() {
	draft.value = blank(draft.value.opts);
}

function open(mob: SavedMob) {
	draft.value = JSON.parse(JSON.stringify(mob));
}

function onRemoved(ids: string[]) {
	if (ids.includes(draft.value.id)) startNew();
}

const dirty = computed(() => {
	if (!saved.value) return true;
	const { updatedAt: _a, exportedAt: _c, ...a } = saved.value;
	const { updatedAt: _b, exportedAt: _d, ...b } = draft.value;
	return JSON.stringify(a) !== JSON.stringify(b);
});

async function copyNote() {
	flash((await copyText(mobNote(draft.value))) ? 'Copied the Obsidian note.' : "Couldn't copy to the clipboard.");
}

async function copyJson() {
	const pack = crawlerForgePack([draft.value], { author: settings.value.author, name: settings.value.packName });
	flash((await copyText(JSON.stringify(pack, null, 2))) ? 'Copied the Crawler Forge pack.' : "Couldn't copy to the clipboard.");
}
</script>

<template>
	<div class="mx-auto max-w-7xl px-4 py-6">
		<header class="mb-6 flex flex-wrap items-end justify-between gap-2">
			<div>
				<h1 class="font-display text-3xl font-semibold tracking-wide text-stone-50">
					Mob <span class="text-amber-400">forge</span>
					<span class="ml-1 align-middle rounded-full border border-stone-700 px-2 py-0.5 font-sans text-xs font-medium tracking-normal text-stone-400">v{{ version }}</span>
				</h1>
				<p class="text-sm text-stone-400">Roll mobs and bosses for the Dungeon Crawler Carl RPG.</p>
			</div>
			<InstallButton />
		</header>

		<main class="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)_19rem]">
			<ForgeForm v-model="draft" @roll="roll" />

			<div class="space-y-3">
				<div class="flex flex-wrap items-center gap-2">
					<button type="button" class="btn btn-primary" :disabled="!dirty" @click="save">
						{{ saved ? 'Save changes' : 'Save to library' }}
					</button>
					<button v-if="saved" type="button" class="btn" @click="saveAsNew">Save as new</button>
					<button type="button" class="btn" @click="startNew">New mob</button>
					<span class="flex-1" />
					<button type="button" class="btn btn-ghost" @click="copyNote">Copy note</button>
					<button type="button" class="btn btn-ghost" @click="copyJson">Copy JSON</button>
				</div>
				<p class="h-5 text-sm text-amber-300" role="status">
					{{ status || (saved && dirty ? 'Unsaved changes.' : '') }}
				</p>
				<MobCard :entry="draft" />
				<AttacksEditor v-model="draft" />
			</div>

			<LibraryPanel :active-id="saved?.id ?? null" @open="open" @removed="onRemoved" />
		</main>

		<footer class="mt-10 text-center text-xs text-stone-500">
			Built from the Core Rulebook's "Create Your Own Mobs and Bosses" (Tables 50 and 51). Your mobs are stored in this browser only.
			<p class="mt-1">
				Version {{ version }}<template v-if="commit">
					·
					<a :href="`https://github.com/matalina/carl-mob-generator/commit/${commit}`" class="underline decoration-stone-700 hover:text-stone-300" target="_blank" rel="noopener">{{ commit }}</a></template>
				· built {{ built }}
			</p>
		</footer>
		<AppUpdate />
	</div>
</template>
