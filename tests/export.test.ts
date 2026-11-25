import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { crawlerForgePack } from '../src/lib/crawlerforge';
import { slugify } from '../src/lib/download';
import { forgeMob, type ForgeOptions } from '../src/lib/generate';
import { mobNote } from '../src/lib/markdown';
import { RANKS, ROLES, type Role } from '../src/lib/tables';
import type { SavedMob } from '../src/lib/types';

// pack.schema.json is Crawler Forge's published schema, from https://crawlerforge.com/schemas/pack.schema.json.
const schema = JSON.parse(readFileSync(new URL('./fixtures/pack.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats.default(ajv);
const validate = ajv.compile(schema);

function saved(opts: Partial<ForgeOptions>, i: number): SavedMob {
	const full: ForgeOptions = { floor: 3, level: 14, rank: 'Mob', size: 4, creature: 'Humanoid', role: 'brute', armor: null, ...opts };
	const now = new Date().toISOString();
	return {
		id: `mob-test-${i}`,
		name: `Test mob ${i}`,
		description: 'A test.\nTwo lines.',
		opts: full,
		mob: forgeMob(full),
		traits: [{ name: 'Bad reflux', details: 'Smells: awful' }, { name: 'Name only', details: '' }],
		createdAt: now,
		updatedAt: now,
	};
}

describe('Crawler Forge pack', () => {
	it('validates against the published schema for every rank, role, floor and size', () => {
		const mobs: SavedMob[] = [];
		let i = 0;
		for (let round = 0; round < 5; round++)
			for (const rank of RANKS)
				for (const role of Object.keys(ROLES) as Role[])
					for (const floor of [1, 6, 18])
						mobs.push(saved({ rank, role, floor, size: 1 + (i % 8), level: 1 + ((i * 37) % 400), armor: i % 4 === 0 ? 2 : null }, i++));
		const pack = crawlerForgePack(mobs, { author: '' });
		const ok = validate(pack);
		expect(ok ? [] : validate.errors?.slice(0, 5)).toEqual([]);
	});

	it('stays valid after hand edits to attacks', () => {
		const m = saved({}, 9);
		const [a] = m.mob.attacks;
		Object.assign(a!, {
			name: '  ',
			diceCount: 99,
			die: 'd20',
			damageType: 'Holy',
			rangeFt: -10,
			area: { field: 'radius', feet: 7 },
			splash: true,
			debuff: { name: '   ', on: 'hit' },
			notes: 'x'.repeat(500),
		});
		m.mob.attacks.push({ ...a!, name: 'Gaze: of doom', area: null, debuff: { name: 'Charmed', on: 'majorFail' }, notes: '' });
		const pack = crawlerForgePack([m], { author: 'GM' });
		expect(validate(pack) ? [] : validate.errors?.slice(0, 5)).toEqual([]);
		const attacks = pack.mobs[0]!.attacks;
		const [first, second] = [attacks[0], attacks.at(-1)];
		expect(first).toMatchObject({ name: 'Attack', diceCount: 30, damageType: 'holy', area: { shape: 'blast', feet: 5, splashFeet: 5 } });
		expect(first).not.toHaveProperty('onHit');
		expect(second).toMatchObject({ onFail: ['Charmed'] });
		expect(mobNote(m)).toContain('  - "Gaze: of doom":');
	});

	it('rejects a pack the schema does not allow', () => {
		const pack = crawlerForgePack([saved({}, 0)], { author: '' });
		(pack.mobs[0]!.attacks[0] as { damageType: string }).damageType = 'Bludgeoning';
		expect(validate(pack)).toBe(false);
	});

	it('maps bosses to a tier and keeps ids stable', () => {
		const m = saved({ rank: 'City Boss' }, 1);
		const out = crawlerForgePack([m], { author: 'GM' }).mobs[0]!;
		expect(out).toMatchObject({ id: 'mob-test-1', kind: 'boss', bossTier: 'city', homeFloor: 3 });
		expect(out.attacks[0]!.id).toBe('mob-test-1-attack-1');
	});
});

describe('pack file name', () => {
	it('slugifies the pack name', () => {
		expect(slugify('Floor 3: Gutter Kings & Co.')).toBe('floor-3-gutter-kings-co');
		expect(slugify('  Crème brûlée  ')).toBe('creme-brulee');
		expect(slugify('!!!')).toBe('');
	});
});

describe('Obsidian note', () => {
	it('matches the plugin template shape', () => {
		const note = mobNote(saved({}, 2));
		expect(note).toMatch(/^---\ntags:\n {2}- carl\/creature\nlevel: 14\ntype: mob\nsize: Medium\n/);
		expect(note).toContain('  - Bad reflux: "Smells: awful"');
		expect(note).toContain('  - Name only:\nsource:');
		expect(note).toContain('> [!danger] Test mob 2, Level 14\n>\n> A test.\n> Two lines.');
		expect(note).toContain('```carl-creature\n```');
	});
});
