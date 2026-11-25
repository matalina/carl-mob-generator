import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { crawlerForgePack } from '../src/lib/crawlerforge';
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
