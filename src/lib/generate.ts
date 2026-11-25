import { statMod } from './stats';
import {
	AREAS,
	type AreaField,
	ATTACK_LABELS,
	type AttackKind,
	BOSS_TIERS,
	DAMAGE_TYPES,
	DEBUFFS,
	DIE_SIZES,
	LEVEL_ROWS,
	RANGES,
	type Rank,
	type Role,
	ROLE_ATTACKS,
	ROLE_WEIGHTS,
	STAT_KEYS,
	type StatKey,
	type Weighted,
} from './tables';

export interface ForgeOptions {
	floor: number;
	level: number;
	rank: Rank;
	/** Size value 1–8. */
	size: number;
	creature: string;
	role: Role;
	/** Extra DR from armor or hide; null picks one from the role. */
	armor: number | null;
}

export interface ForgedAttack {
	name: string;
	kind: AttackKind;
	stat: StatKey;
	mod: number;
	diceCount: number;
	die: string;
	damageType: string;
	rangeFt: number;
	area: { field: AreaField; feet: number } | null;
	/** +5ft splash around an area attack. */
	splash: boolean;
	armorPiercing: boolean;
	debuff: { name: string; on: 'hit' | 'majorFail' } | null;
	/** Anything else about the attack, typed by hand. */
	notes?: string;
}

/** Damage types Crawler Forge knows; an attack's damage type is one of these. */
export const DAMAGE_TYPE_NAMES = [
	'Acid', 'Bludgeoning', 'Electric', 'Fire', 'Force', 'Holy', 'Ice',
	'Necrotic', 'Piercing', 'Poison', 'Psychic', 'Slashing', 'Sonic',
];
export const DIE_NAMES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

/** A plain attack to start from when adding one by hand. */
export function blankAttack(mob: ForgedMob): ForgedAttack {
	return {
		name: 'New attack',
		kind: 'melee',
		stat: 'strength',
		mod: statMod(mob.stats.strength),
		diceCount: diceForLevel(mob.level),
		die: 'd6',
		damageType: 'Bludgeoning',
		rangeFt: 5,
		area: null,
		splash: false,
		armorPiercing: false,
		debuff: null,
		notes: '',
	};
}

export interface ForgedMob {
	level: number;
	floor: number;
	rank: Rank;
	size: number;
	creature: string;
	hpSlots: number;
	/** Base move before + size, 20/30/40. */
	move: number;
	dr: number;
	stats: Record<StatKey, number>;
	attacks: ForgedAttack[];
}

const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

export function pick<T>(table: Weighted<T>): T {
	const total = table.reduce((sum, [, w]) => sum + w, 0);
	let x = Math.random() * total;
	for (const [value, weight] of table) {
		x -= weight;
		if (x <= 0) return value;
	}
	return table[0]![0];
}

function rowForFloor(floor: number): number {
	const f = Math.min(18, Math.max(1, floor));
	return LEVEL_ROWS.findIndex((row) => f >= row.floors[0] && f <= row.floors[1]);
}

function diceForLevel(level: number): number {
	return (LEVEL_ROWS.find((row) => level >= row.lo && level <= row.hi) ?? LEVEL_ROWS[LEVEL_ROWS.length - 1]!).dice;
}

/** Typical levels for a rank on a floor (Table 51, bosses one or two rows down). */
export function levelRange(floor: number, rank: Rank): [number, number] {
	let i = rowForFloor(floor);
	const tier = BOSS_TIERS[rank];
	if (!tier) return [LEVEL_ROWS[i]!.lo, LEVEL_ROWS[i]!.hi];
	i = Math.min(LEVEL_ROWS.length - 1, i + tier.step);
	const row = LEVEL_ROWS[i]!;
	const span = row.hi - row.lo;
	return [Math.round(row.lo + span * tier.part[0]), Math.round(row.lo + span * tier.part[1])];
}

export function suggestLevel(floor: number, rank: Rank): number {
	const [lo, hi] = levelRange(floor, rank);
	return randInt(lo, hi);
}

function rollStats(level: number, rank: Rank, role: Role): Record<StatKey, number> {
	const tier = BOSS_TIERS[rank];
	const base = tier ? 5 : 1;
	const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, base])) as Record<StatKey, number>;
	const weights: Weighted<StatKey> = STAT_KEYS.map((k) => [k, ROLE_WEIGHTS[role][k]]);
	for (let left = (tier ? tier.perLevel : 3) * level; left > 0; left--) stats[pick(weights)]++;
	return stats;
}

function moveFor(size: number): number {
	if (size >= 7) return Math.random() < 0.5 ? 30 : 40;
	if (size === 6) return 30;
	return 20;
}

function rollDr(floor: number, role: Role, size: number, armor: number | null): number {
	if (armor != null) return floor + armor;
	if (role === 'caster') return Math.max(0, floor - randInt(1, 2));
	if (role === 'brute' && (size >= 5 || Math.random() < 0.5)) return floor + randInt(1, 2);
	return floor;
}

function rollAttacks(level: number, rank: Rank, role: Role, mods: Record<StatKey, number>): ForgedAttack[] {
	const boss = rank !== 'Mob';
	const count = boss ? 3 : level <= 4 ? 1 : 2;
	const kinds = ROLE_ATTACKS[role].slice(0, count);
	const baseDice = diceForLevel(level);
	const seen: Record<string, number> = {};

	return kinds.map((kind, i) => {
		const stat: StatKey =
			kind === 'melee' ? 'strength' : kind === 'ranged' ? 'dexterity' : role === 'showboat' ? 'charisma' : 'intelligence';
		seen[kind] = (seen[kind] ?? 0) + 1;
		const repeats = kinds.filter((k) => k === kind).length > 1;
		const name = repeats ? `${ATTACK_LABELS[kind]} ${seen[kind]}` : ATTACK_LABELS[kind];

		// Area attacks and attacks with a Debuff each lose 1d (p. 273).
		let dice = baseDice;
		let area: ForgedAttack['area'] = null;
		let splash = false;
		if (kind !== 'melee' && Math.random() < 0.3) {
			const [field, size] = pick(AREAS);
			area = { field, feet: parseInt(size, 10) };
			dice--;
			splash = Math.random() < 0.3;
		}
		const armorPiercing = kind !== 'spell' && Math.random() < 0.08;
		let debuff: ForgedAttack['debuff'] = null;
		const debuffChance = boss ? (i === 0 ? 0.9 : 0.5) : 0.45;
		if (Math.random() < debuffChance) {
			dice--;
			// Weak attacks apply the Debuff on any hit; strong ones on a Major Evade Fail (p. 273).
			debuff = { name: pick(DEBUFFS), on: dice <= 1 || Math.random() < 0.5 ? 'hit' : 'majorFail' };
		}

		return {
			name,
			kind,
			stat,
			mod: mods[stat],
			diceCount: Math.max(1, dice),
			die: pick(DIE_SIZES),
			damageType: pick(DAMAGE_TYPES[kind]),
			rangeFt: pick(RANGES[kind]),
			area,
			splash,
			armorPiercing,
			debuff,
		};
	});
}

export function forgeMob(opts: ForgeOptions): ForgedMob {
	const floor = Math.min(18, Math.max(1, Math.round(opts.floor)));
	const level = Math.max(1, Math.round(opts.level));
	const tier = BOSS_TIERS[opts.rank];
	const stats = rollStats(level, opts.rank, opts.role);
	const mods = Object.fromEntries(STAT_KEYS.map((k) => [k, statMod(stats[k])])) as Record<StatKey, number>;

	return {
		level,
		floor,
		rank: opts.rank,
		size: opts.size,
		creature: opts.creature,
		hpSlots: tier ? tier.hb + floor : Math.min(level, 10),
		move: moveFor(opts.size),
		dr: rollDr(floor, opts.role, opts.size, opts.armor),
		stats,
		attacks: rollAttacks(level, opts.rank, opts.role, mods),
	};
}

// Text forms, as the rulebook (and the Obsidian plugin) write them.
export const surpriseText = (mob: ForgedMob) => `${10 + statMod(mob.stats.intelligence)}+F`;
export const evadeText = (mob: ForgedMob) => `${10 + statMod(mob.stats.dexterity)}+F`;
export const moveText = (mob: ForgedMob) => `${mob.move}+S`;
export const toHitText = (a: ForgedAttack) => `${10 + a.mod}+F`;
export const damageText = (a: ForgedAttack) => `${a.diceCount}${a.die}+${a.mod} ${a.damageType}`;

export function effectText(a: ForgedAttack): string {
	const notes: string[] = [];
	if (a.splash) notes.push('+5ft Splash.');
	if (a.armorPiercing) notes.push('Armor-Piercing.');
	if (a.debuff?.name.trim()) {
		notes.push(
			a.debuff.on === 'hit'
				? `Any hit crawler gains the ${a.debuff.name} Debuff.`
				: `On an Evade Major Fail or worse, the crawler gains the ${a.debuff.name} Debuff.`,
		);
	}
	if (a.notes?.trim()) notes.push(a.notes.trim());
	return notes.join(' ');
}
