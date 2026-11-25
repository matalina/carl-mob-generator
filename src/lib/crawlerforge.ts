// Crawler Forge pack files (https://crawlerforge.com/guides/file-formats), schema version 106.
// Only what the forge makes is written; Crawler Forge works out Surprise, Evade, Health,
// to-hit and base DR from level, stats and floor, so those are left to it.
import type { ForgedAttack, ForgedMob } from './generate';
import { sizeName } from './stats';
import type { StatKey } from './tables';
import { displayName, type SavedMob } from './types';

export const SCHEMA_VERSION = 106;

const STAT_IDS: Record<StatKey, 'str' | 'int' | 'con' | 'dex' | 'cha'> = {
	strength: 'str',
	intelligence: 'int',
	constitution: 'con',
	dexterity: 'dex',
	charisma: 'cha',
};

// Forge radius areas are centred on the target: a Blast in Crawler Forge's words.
const AREA_SHAPES = { cone: 'cone', line: 'line', radius: 'blast' } as const;

export interface PackOptions {
	author: string;
	name?: string;
	license?: 'private' | 'CC-BY-SA-4.0';
}

function attack(a: ForgedAttack, id: string) {
	const area = a.area
		? { shape: AREA_SHAPES[a.area.field], feet: a.area.feet, ...(a.splash ? { splashFeet: 5 } : {}) }
		: undefined;
	const range = a.kind === 'melee' ? (a.rangeFt <= 5 ? 'melee' : `reach ${a.rangeFt} ft`) : `${a.rangeFt} ft`;
	const notes = [a.armorPiercing ? 'Armor-Piercing.' : '', !a.area && a.splash ? '+5ft Splash.' : '']
		.filter(Boolean)
		.join(' ');

	return {
		id,
		name: a.name,
		stat: STAT_IDS[a.stat],
		diceCount: a.diceCount,
		die: a.die,
		damageType: a.damageType.toLowerCase(),
		range,
		...(area ? { area } : {}),
		...(a.debuff?.on === 'majorFail' ? { onFail: [a.debuff.name] } : {}),
		...(a.debuff?.on === 'hit' ? { onHit: { debuff: a.debuff.name } } : {}),
		notes,
		...(a.kind === 'spell' ? { spell: true as const } : {}),
	};
}

function overrides(mob: ForgedMob) {
	const out: { move?: number; drBonus?: number } = {};
	if (mob.move !== 20) out.move = mob.move;
	if (mob.dr !== mob.floor) out.drBonus = mob.dr - mob.floor;
	return out;
}

export function crawlerForgeMob(saved: SavedMob) {
	const { mob } = saved;
	const boss = mob.rank !== 'Mob';
	return {
		id: saved.id,
		name: displayName(saved),
		updatedAt: new Date(saved.updatedAt).toISOString(),
		description: saved.description.trim(),
		tags: ['mob-forge'],
		kind: boss ? 'boss' : 'mob',
		...(boss ? { bossTier: mob.rank.split(' ')[0]!.toLowerCase() } : {}),
		type: mob.creature.slice(0, 40) || 'Humanoid',
		size: { name: sizeName(mob.size), value: mob.size },
		level: Math.min(999, mob.level),
		homeFloor: mob.floor,
		stats: Object.fromEntries(Object.entries(STAT_IDS).map(([k, id]) => [id, Math.min(999, mob.stats[k as StatKey])])),
		overrides: overrides(mob),
		attacks: mob.attacks.map((a, i) => attack(a, `${saved.id}-attack-${i + 1}`)),
		damageResponses: [],
		abilities: saved.traits
			.filter((t) => t.name.trim())
			.map((t, i) => ({
				id: `${saved.id}-ability-${i + 1}`,
				name: t.name.trim(),
				text: (t.details.trim() || t.name.trim()).slice(0, 600),
			})),
		notes: '',
	};
}

export function crawlerForgePack(mobs: SavedMob[], opts: PackOptions) {
	return {
		schemaVersion: SCHEMA_VERSION,
		id: 'carl-mob-forge',
		name: opts.name?.trim() || 'Mob forge mobs',
		version: 1,
		description: `${mobs.length} mob${mobs.length === 1 ? '' : 's'} from Carl mob forge.`,
		author: { displayName: opts.author.trim() || 'Mob forge' },
		provenance: 'homebrew',
		license: opts.license ?? 'private',
		tags: ['mobs'],
		mobs: mobs.map(crawlerForgeMob),
	};
}
