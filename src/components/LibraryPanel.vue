<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { downloadNotes, downloadPack } from '../lib/download';
import { mobs, removeMob, settings } from '../lib/library';
import { displayName, type SavedMob } from '../lib/types';

defineProps<{ activeId: string | null }>();
const emit = defineEmits<{ open: [mob: SavedMob]; removed: [id: string] }>();

const selected = ref<Set<string>>(new Set());
const query = ref('');

// Drop selections for mobs that no longer exist.
watch(mobs, (list) => {
	const ids = new Set(list.map((m) => m.id));
	selected.value = new Set([...selected.value].filter((id) => ids.has(id)));
});

const shown = computed(() => {
	const q = query.value.trim().toLowerCase();
	return q ? mobs.value.filter((m) => `${m.name} ${m.mob.rank} ${m.mob.creature}`.toLowerCase().includes(q)) : mobs.value;
});
const chosen = computed(() => mobs.value.filter((m) => selected.value.has(m.id)));
const allShown = computed(() => shown.value.length > 0 && shown.value.every((m) => selected.value.has(m.id)));

function toggle(id: string) {
	const next = new Set(selected.value);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	selected.value = next;
}

function toggleAll() {
	selected.value = allShown.value ? new Set() : new Set(shown.value.map((m) => m.id));
}

function remove(mob: SavedMob) {
	if (!confirm(`Delete ${displayName(mob)} from your library? This can't be undone.`)) return;
	removeMob(mob.id);
	emit('removed', mob.id);
}

const exportPack = () => downloadPack(chosen.value, { author: settings.value.author, name: settings.value.packName });
</script>

<template>
	<section class="panel flex flex-col gap-3">
		<div class="flex items-center justify-between">
			<h2 class="panel-title">Library</h2>
			<span class="text-xs text-stone-500">{{ mobs.length }} saved</span>
		</div>

		<input v-if="mobs.length > 5" v-model="query" class="input" placeholder="Search mobs" aria-label="Search mobs" />

		<p v-if="!mobs.length" class="text-sm text-stone-500">
			Nothing saved yet. Roll a mob and select <strong class="text-stone-300">Save to library</strong>. Mobs stay in this browser only.
		</p>

		<template v-else>
			<label class="flex items-center gap-2 text-xs text-stone-400">
				<input type="checkbox" class="accent-amber-500" :checked="allShown" @change="toggleAll" />
				Select all
			</label>
			<ul class="max-h-[28rem] space-y-1 overflow-y-auto pr-1">
				<li
					v-for="m in shown"
					:key="m.id"
					class="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-stone-800"
					:class="{ 'bg-stone-800 ring-1 ring-amber-600/60': m.id === activeId }"
				>
					<input type="checkbox" class="accent-amber-500" :checked="selected.has(m.id)" :aria-label="`Select ${displayName(m)}`" @change="toggle(m.id)" />
					<button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="emit('open', m)">
						<span class="block truncate text-sm font-medium text-stone-100">{{ displayName(m) }}</span>
						<span class="block truncate text-xs text-stone-500">Level {{ m.mob.level }} {{ m.mob.rank.toLowerCase() }} · floor {{ m.mob.floor }}</span>
					</button>
					<button type="button" class="btn btn-ghost px-2 py-1 text-xs opacity-60 group-hover:opacity-100" :aria-label="`Delete ${displayName(m)}`" @click="remove(m)">✕</button>
				</li>
			</ul>
		</template>

		<div class="space-y-2 border-t border-stone-800 pt-3">
			<h3 class="text-xs font-medium tracking-wide text-stone-400 uppercase">Export {{ chosen.length || '' }} selected</h3>
			<div class="grid grid-cols-2 gap-2">
				<button type="button" class="btn" :disabled="!chosen.length" @click="downloadNotes(chosen)">Obsidian notes</button>
				<button type="button" class="btn" :disabled="!chosen.length" @click="exportPack">Crawler Forge pack</button>
			</div>
			<p class="text-xs text-stone-500">Notes download as .md (several as a .zip) for the Carl RPG plugin. The pack is a .json file to import in Crawler Forge.</p>
			<details class="text-sm">
				<summary class="cursor-pointer text-xs text-stone-400">Pack details</summary>
				<div class="mt-2 space-y-2">
					<label class="field">
						<span>Author</span>
						<input v-model="settings.author" class="input" placeholder="Your name, shown with the pack" />
					</label>
					<label class="field">
						<span>Pack name</span>
						<input v-model="settings.packName" class="input" placeholder="Mob forge mobs" />
					</label>
				</div>
			</details>
		</div>
	</section>
</template>
