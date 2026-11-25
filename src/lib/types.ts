import type { ForgedMob, ForgeOptions } from './generate';

export interface Trait {
	name: string;
	details: string;
}

/** A mob kept in the library (local storage). */
export interface SavedMob {
	/** Stable id, reused as the Crawler Forge piece id so re-imports match. */
	id: string;
	name: string;
	/** Flavor text: the note's callout and Crawler Forge's "how the AI announces it". */
	description: string;
	opts: ForgeOptions;
	mob: ForgedMob;
	traits: Trait[];
	createdAt: string;
	updatedAt: string;
	/** When it was last downloaded as a note or in a pack. */
	exportedAt?: string;
}

export const displayName = (m: Pick<SavedMob, 'name'>) => m.name.trim() || 'Unnamed mob';

export function newId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return 'mob-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
