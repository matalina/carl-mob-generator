// Obsidian notes in the shape of the obsidian-carlrpg plugin's mob template: the same
// frontmatter order and fields, then the heading, the danger callout and a carl-creature block.
import { damageText, effectText, evadeText, moveText, surpriseText, toHitText } from './generate';
import { sizeName } from './stats';
import { STAT_KEYS } from './tables';
import { displayName, type SavedMob, type Trait } from './types';

// Quotes a YAML scalar when it would otherwise be misread.
export function scalar(value: string | number): string {
	const text = String(value);
	return /^[\s]|[\s]$|[:#[\]{}&*!|>'"%@`,]|^-/.test(text) ? `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : text;
}

function line(key: string, value: string | number | null, indent = ''): string {
	return value === null || value === '' ? `${indent}${key}:` : `${indent}${key}: ${scalar(value)}`;
}

function traitLines(traits: Trait[]): string[] {
	return traits
		.filter((t) => t.name.trim())
		.map((t) => line(`  - ${scalar(t.name.trim())}`, t.details.replace(/\s*\n\s*/g, ' ').trim() || null));
}

export function mobFrontmatter(saved: SavedMob, tag = 'carl/creature'): string {
	const { mob } = saved;
	const attacks = mob.attacks.flatMap((a) => {
		const ind = '      ';
		return [
			`  - ${a.name}:`,
			line('to-hit', toHitText(a), ind),
			line('damage', damageText(a), ind),
			line('range', `${a.rangeFt}ft`, ind),
			line('cone', a.area?.field === 'cone' ? `${a.area.feet}ft` : null, ind),
			line('radius', a.area?.field === 'radius' ? `${a.area.feet}ft` : null, ind),
			line('line', a.area?.field === 'line' ? `${a.area.feet}ft` : null, ind),
			line('limit', null, ind),
			line('effect', effectText(a), ind),
		];
	});

	return [
		'---',
		'tags:',
		`  - ${tag}`,
		line('level', mob.level),
		line('type', mob.rank.toLowerCase()),
		line('size', sizeName(mob.size)),
		line('creature', mob.creature),
		line('hp-slots', mob.hpSlots),
		line('hp-current', mob.hpSlots),
		line('surprise', surpriseText(mob)),
		line('evade', evadeText(mob)),
		line('move', moveText(mob)),
		line('dr', mob.dr),
		...STAT_KEYS.map((k) => line(k, mob.stats[k])),
		'attacks:',
		...attacks,
		'traits:',
		...traitLines(saved.traits),
		'source:',
		'page:',
		'---',
	].join('\n');
}

export function mobNote(saved: SavedMob): string {
	const name = displayName(saved);
	const description = saved.description.trim() || "(ai's description)";
	const callout = description
		.split(/\r?\n/)
		.map((l) => (l.trim() ? `> ${l}` : '>'))
		.join('\n');
	return `${mobFrontmatter(saved)}
# ${name}

(details)

> [!danger] ${name}, Level ${saved.mob.level}
>
${callout}

\`\`\`carl-creature
\`\`\`
`;
}

/** A file name Obsidian (and every OS) accepts. */
export function noteFileName(saved: SavedMob): string {
	return `${displayName(saved).replace(/[\\/:*?"<>|#^[\]]/g, '').trim() || 'Unnamed mob'}.md`;
}
