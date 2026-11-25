<script setup lang="ts">
import { ref } from 'vue';
import { blankAttack, damageText, DAMAGE_TYPE_NAMES, DIE_NAMES, type ForgedAttack, toHitText } from '../lib/generate';
import { statMod, titleCase } from '../lib/stats';
import { DEBUFFS, STAT_KEYS, type StatKey } from '../lib/tables';
import type { SavedMob } from '../lib/types';

const entry = defineModel<SavedMob>({ required: true });

const KINDS = { melee: 'Melee', ranged: 'Ranged', spell: 'Spell' } as const;
const DEBUFF_NAMES = DEBUFFS.map(([name]) => name).sort();

/** Index of the attack open for editing. */
const open = ref<number | null>(null);

function setStat(a: ForgedAttack, stat: StatKey) {
	a.stat = stat;
	a.mod = statMod(entry.value.mob.stats[stat]);
}

function setArea(a: ForgedAttack, field: string) {
	if (field === 'none') {
		a.area = null;
		a.splash = false;
	} else {
		a.area = { field: field as 'cone' | 'radius' | 'line', feet: a.area?.feet ?? 15 };
	}
}

function setDebuff(a: ForgedAttack, name: string) {
	a.debuff = name.trim() ? { name, on: a.debuff?.on ?? 'hit' } : null;
}

function add() {
	entry.value.mob.attacks.push(blankAttack(entry.value.mob));
	open.value = entry.value.mob.attacks.length - 1;
}

function remove(i: number) {
	entry.value.mob.attacks.splice(i, 1);
	open.value = null;
}

function move(i: number, by: number) {
	const list = entry.value.mob.attacks;
	const j = i + by;
	if (j < 0 || j >= list.length) return;
	[list[i], list[j]] = [list[j]!, list[i]!];
	open.value = j;
}
</script>

<template>
	<section class="panel @container space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="panel-title">Attacks</h2>
			<button type="button" class="btn btn-ghost px-2 py-1 text-xs" @click="add">+ Add attack</button>
		</div>
		<p v-if="!entry.mob.attacks.length" class="text-xs text-stone-500">No attacks. Add one, or roll again.</p>

		<ul class="space-y-2">
			<li v-for="(a, i) in entry.mob.attacks" :key="i" class="rounded-lg border border-stone-800">
				<button
					type="button"
					class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-800/60"
					:aria-expanded="open === i"
					@click="open = open === i ? null : i"
				>
					<span class="text-stone-500">{{ open === i ? '▾' : '▸' }}</span>
					<strong class="shrink-0 whitespace-nowrap text-amber-300">{{ a.name || 'Attack' }}</strong>
					<span class="min-w-0 truncate text-stone-400">{{ toHitText(a) }} · {{ damageText(a) }}</span>
				</button>

				<div v-if="open === i" class="grid grid-cols-2 gap-3 border-t border-stone-800 p-3 @lg:grid-cols-4">
					<label class="field col-span-2">
						<span>Name</span>
						<input v-model="a.name" class="input" />
					</label>
					<label class="field">
						<span>Kind</span>
						<select v-model="a.kind" class="input">
							<option v-for="(label, k) in KINDS" :key="k" :value="k">{{ label }}</option>
						</select>
					</label>
					<label class="field">
						<span>Stat</span>
						<select :value="a.stat" class="input" @change="setStat(a, ($event.target as HTMLSelectElement).value as StatKey)">
							<option v-for="k in STAT_KEYS" :key="k" :value="k">{{ titleCase(k.slice(0, 3)) }} ({{ entry.mob.stats[k] }})</option>
						</select>
					</label>

					<label class="field">
						<span>Dice</span>
						<input v-model.number="a.diceCount" type="number" min="1" max="30" class="input" />
					</label>
					<label class="field">
						<span>Die</span>
						<select v-model="a.die" class="input">
							<option v-for="d in DIE_NAMES" :key="d" :value="d">{{ d }}</option>
						</select>
					</label>
					<label class="field col-span-2">
						<span>Damage type</span>
						<select v-model="a.damageType" class="input">
							<option v-for="t in DAMAGE_TYPE_NAMES" :key="t" :value="t">{{ t }}</option>
						</select>
					</label>

					<label class="field">
						<span>Range (ft)</span>
						<input v-model.number="a.rangeFt" type="number" min="0" step="5" class="input" />
					</label>
					<label class="field">
						<span>Area</span>
						<select :value="a.area?.field ?? 'none'" class="input" @change="setArea(a, ($event.target as HTMLSelectElement).value)">
							<option value="none">None</option>
							<option value="cone">Cone</option>
							<option value="radius">Radius</option>
							<option value="line">Line</option>
						</select>
					</label>
					<label v-if="a.area" class="field">
						<span>Area (ft)</span>
						<input v-model.number="a.area.feet" type="number" min="5" step="5" class="input" />
					</label>
					<div class="col-span-2 flex flex-wrap items-end gap-4 pb-1.5 text-sm" :class="{ '@lg:col-span-1': a.area }">
						<label v-if="a.area" class="flex items-center gap-1.5">
							<input v-model="a.splash" type="checkbox" class="accent-amber-500" /> +5ft splash
						</label>
						<label class="flex items-center gap-1.5">
							<input v-model="a.armorPiercing" type="checkbox" class="accent-amber-500" /> Armor-piercing
						</label>
					</div>

					<label class="field col-span-2">
						<span>Debuff</span>
						<input
							:value="a.debuff?.name ?? ''"
							class="input"
							list="debuff-names"
							maxlength="80"
							placeholder="None"
							@input="setDebuff(a, ($event.target as HTMLInputElement).value)"
						/>
					</label>
					<label class="field col-span-2">
						<span>Debuff lands</span>
						<select v-if="a.debuff" v-model="a.debuff.on" class="input">
							<option value="hit">On any hit</option>
							<option value="majorFail">On an Evade Major Fail or worse</option>
						</select>
						<select v-else class="input" disabled><option>Pick a debuff first</option></select>
					</label>

					<label class="field col-span-2 @lg:col-span-4">
						<span>Notes</span>
						<textarea v-model="a.notes" rows="2" maxlength="300" class="input" placeholder="Anything else about the attack" />
					</label>

					<div class="col-span-2 flex gap-2 @lg:col-span-4">
						<button type="button" class="btn btn-ghost px-2 text-xs" :disabled="i === 0" @click="move(i, -1)">Move up</button>
						<button type="button" class="btn btn-ghost px-2 text-xs" :disabled="i === entry.mob.attacks.length - 1" @click="move(i, 1)">Move down</button>
						<span class="flex-1" />
						<button type="button" class="btn btn-ghost px-2 text-xs text-red-400" @click="remove(i)">Remove attack</button>
					</div>
				</div>
			</li>
		</ul>
		<datalist id="debuff-names">
			<option v-for="d in DEBUFF_NAMES" :key="d" :value="d" />
		</datalist>
		<p class="text-xs text-stone-500">To hit and damage use the attack's stat mod. Rolling again replaces the attacks.</p>
	</section>
</template>
