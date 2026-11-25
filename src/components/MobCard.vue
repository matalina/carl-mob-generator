<script setup lang="ts">
import { computed } from 'vue';
import { damageText, effectText, evadeText, type ForgedAttack, moveText, surpriseText, toHitText } from '../lib/generate';
import { formatMod, sizeName, statMod, titleCase } from '../lib/stats';
import { STAT_KEYS } from '../lib/tables';
import { displayName, type SavedMob } from '../lib/types';

const props = defineProps<{ entry: SavedMob }>();
const mob = computed(() => props.entry.mob);
const conMod = computed(() => statMod(mob.value.stats.constitution));

const summary = computed(() => [
	['Level', String(mob.value.level)],
	['Surprise', surpriseText(mob.value)],
	['Evade', evadeText(mob.value)],
	['Move', moveText(mob.value)],
	['DR', String(mob.value.dr)],
]);

const stats = computed(() =>
	STAT_KEYS.map((k) => [titleCase(k.slice(0, 3)), `${mob.value.stats[k]} (${formatMod(statMod(mob.value.stats[k]))})`]),
);

function attackLine(a: ForgedAttack): string {
	const parts = [`${toHitText(a)} to hit`, damageText(a), `range ${a.rangeFt}ft`];
	if (a.area) parts.push(`${a.area.field} ${a.area.feet}ft`);
	return parts.join(', ');
}

const slotStyle = (i: number, total: number) => ({
	background: `linear-gradient(90deg, hsl(${(120 * i) / total} 70% 38%), hsl(${(120 * (i + 1)) / total} 70% 38%))`,
});
const traits = computed(() => props.entry.traits.filter((t) => t.name.trim()));
</script>

<template>
	<article class="overflow-hidden rounded-xl border border-stone-700 bg-stone-900 shadow-xl shadow-black/40">
		<header class="border-b border-stone-700 bg-gradient-to-r from-red-950/70 to-stone-900 px-4 py-3">
			<h2 class="font-display text-2xl font-semibold tracking-wide text-stone-50">{{ displayName(entry) }}</h2>
			<p class="text-sm text-stone-400">
				{{ mob.rank }}; {{ sizeName(mob.size) }} ({{ mob.size }}), {{ mob.creature }} · floor {{ mob.floor }}
			</p>
		</header>

		<div class="space-y-4 p-4">
			<aside v-if="entry.description.trim()" class="rounded-lg border-l-4 border-red-600 bg-red-950/40 px-3 py-2 text-sm">
				<p class="mb-1 font-semibold text-red-300">{{ displayName(entry) }}, Level {{ mob.level }}</p>
				<p class="whitespace-pre-line text-stone-200">{{ entry.description }}</p>
			</aside>

			<div class="flex flex-wrap gap-1" :aria-label="`${mob.hpSlots} health slots of ${conMod}`">
				<div v-for="i in mob.hpSlots" :key="i" class="flex w-9 flex-col items-center gap-0.5">
					<div class="w-full rounded-sm py-0.5 text-center text-xs font-semibold text-white" :style="slotStyle(i - 1, mob.hpSlots)">
						{{ conMod }}
					</div>
					<div class="text-[10px] text-stone-500">{{ Math.round((100 * i) / mob.hpSlots) }}%</div>
				</div>
			</div>

			<dl class="grid grid-cols-5 divide-x divide-stone-700 rounded-lg border border-stone-700 text-center">
				<div v-for="[label, value] in summary" :key="label" class="px-1 py-2">
					<dt class="text-[11px] tracking-wide text-stone-400 uppercase">{{ label }}</dt>
					<dd class="font-semibold text-stone-100">{{ value }}</dd>
				</div>
			</dl>

			<dl class="grid grid-cols-5 divide-x divide-stone-700 rounded-lg border border-stone-700 text-center">
				<div v-for="[label, value] in stats" :key="label" class="px-1 py-2">
					<dt class="text-[11px] tracking-wide text-stone-400 uppercase">{{ label }}</dt>
					<dd class="text-sm font-semibold text-stone-100">{{ value }}</dd>
				</div>
			</dl>

			<section class="space-y-2">
				<div v-for="(a, i) in mob.attacks" :key="i" class="rounded-lg bg-stone-800/60 px-3 py-2 text-sm">
					<p>
						<strong class="text-amber-300">{{ a.name || 'Attack' }}:</strong> {{ attackLine(a) }}
					</p>
					<p v-if="effectText(a)" class="mt-0.5 text-stone-400 italic">{{ effectText(a) }}</p>
				</div>
			</section>

			<section v-if="traits.length" class="space-y-1 text-sm">
				<p v-for="(t, i) in traits" :key="i">
					<strong v-if="i === 0" class="text-stone-300">Notes: </strong>
					<em class="text-stone-100">{{ t.name }}</em><span v-if="t.details.trim()" class="text-stone-300">—{{ t.details }}</span>
				</p>
			</section>

		</div>
	</article>
</template>
