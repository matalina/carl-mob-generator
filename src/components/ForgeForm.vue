<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { levelRange, suggestLevel } from '../lib/generate';
import { SIZE_NAMES } from '../lib/stats';
import { CREATURE_TYPES, RANKS, ROLES } from '../lib/tables';
import type { SavedMob } from '../lib/types';

const entry = defineModel<SavedMob>({ required: true });
defineEmits<{ roll: [] }>();

const opts = computed(() => entry.value.opts);
const hint = computed(() => {
	const [lo, hi] = levelRange(opts.value.floor, opts.value.rank);
	return `Typical for a ${opts.value.rank.toLowerCase()} on floor ${opts.value.floor}: level ${lo}–${hi}.`;
});

function suggest() {
	opts.value.level = suggestLevel(opts.value.floor, opts.value.rank);
}

function setFloor(v: string) {
	opts.value.floor = Math.min(18, Math.max(1, Math.round(Number(v)) || 1));
	suggest();
}

const armor = computed({
	get: () => (opts.value.armor == null ? 'auto' : String(opts.value.armor)),
	set: (v: string) => (opts.value.armor = v === 'auto' ? null : Number(v)),
});

const traitList = ref<HTMLElement>();
async function addTrait() {
	entry.value.traits.push({ name: '', details: '' });
	await nextTick();
	traitList.value?.querySelector<HTMLInputElement>('li:last-child input')?.focus();
}
</script>

<template>
	<form class="panel space-y-4" @submit.prevent="$emit('roll')">
		<h2 class="panel-title">Forge</h2>

		<label class="field">
			<span>Name</span>
			<input v-model="entry.name" class="input" placeholder="Scrap rat" />
		</label>

		<div class="grid grid-cols-2 gap-3">
			<label class="field">
				<span>Floor</span>
				<input :value="opts.floor" type="number" min="1" max="18" class="input" @change="setFloor(($event.target as HTMLInputElement).value)" />
			</label>
			<label class="field">
				<span>Rank</span>
				<select v-model="opts.rank" class="input" @change="suggest">
					<option v-for="r in RANKS" :key="r" :value="r">{{ r }}</option>
				</select>
			</label>
		</div>

		<div>
			<label class="field">
				<span>Level</span>
				<div class="flex gap-2">
					<input v-model.number="opts.level" type="number" min="1" class="input" />
					<button type="button" class="btn shrink-0" title="Suggest a level for this floor and rank" @click="suggest">Suggest</button>
				</div>
			</label>
			<p class="mt-1 text-xs text-stone-500">{{ hint }}</p>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<label class="field">
				<span>Size</span>
				<select v-model.number="opts.size" class="input">
					<option v-for="(name, i) in SIZE_NAMES" :key="name" :value="i + 1">{{ name }} ({{ i + 1 }})</option>
				</select>
			</label>
			<label class="field">
				<span>Type</span>
				<input v-model="opts.creature" class="input" list="creature-types" maxlength="40" />
				<datalist id="creature-types">
					<option v-for="t in CREATURE_TYPES" :key="t" :value="t" />
				</datalist>
			</label>
			<label class="field">
				<span>Role</span>
				<select v-model="opts.role" class="input">
					<option v-for="(label, key) in ROLES" :key="key" :value="key">{{ label }}</option>
				</select>
			</label>
			<label class="field">
				<span>Armor</span>
				<select v-model="armor" class="input">
					<option value="auto">By role</option>
					<option value="0">None</option>
					<option value="1">Light armor, +1</option>
					<option value="2">Heavy armor, +2</option>
				</select>
			</label>
		</div>

		<label class="field">
			<span>AI description</span>
			<textarea v-model="entry.description" rows="4" class="input" placeholder="How the AI announces it, in its own snarky words." />
		</label>

		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<h3 class="text-xs font-medium tracking-wide text-stone-400 uppercase">Traits</h3>
				<button type="button" class="btn btn-ghost px-2 py-1 text-xs" @click="addTrait">+ Add trait</button>
			</div>
			<p v-if="!entry.traits.length" class="text-xs text-stone-500">No traits. They're kept when you roll again.</p>
			<ul ref="traitList" class="space-y-2">
				<li v-for="(t, i) in entry.traits" :key="i" class="space-y-1.5 rounded-lg border border-stone-800 p-2">
					<div class="flex gap-2">
						<input v-model="t.name" class="input" placeholder="Trait name" aria-label="Trait name" />
						<button type="button" class="btn btn-ghost px-2" aria-label="Remove trait" @click="entry.traits.splice(i, 1)">✕</button>
					</div>
					<textarea v-model="t.details" rows="2" class="input" placeholder="What it does" aria-label="Trait details" />
				</li>
			</ul>
		</div>

		<button type="submit" class="btn btn-primary w-full py-2 text-base">Roll</button>
	</form>
</template>
