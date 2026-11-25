// Table 9: Stat Mods — [minimum stat value, modifier], highest first.
const STAT_MODS: [min: number, mod: number][] = [
	[300, 10],
	[200, 9],
	[150, 8],
	[100, 7],
	[50, 6],
	[20, 5],
	[10, 4],
	[6, 3],
	[3, 2],
	[1, 1],
];

export function statMod(value: number): number {
	return STAT_MODS.find(([min]) => value >= min)?.[1] ?? 0;
}

export function formatMod(mod: number): string {
	return mod < 0 ? String(mod) : `+${mod}`;
}

// Table 9: Creature Size — value 1–8.
export const SIZE_NAMES = ['Tiny', 'Small', 'Petite', 'Medium', 'Large', 'Huge', 'Colossal', 'Gargantuan'];

export const sizeName = (value: number) => SIZE_NAMES[value - 1] ?? String(value);

export const titleCase = (text: string) => text.replace(/\b\w/g, (c) => c.toUpperCase());
