import { strToU8, zipSync } from 'fflate';
import { crawlerForgePack, type PackOptions } from './crawlerforge';
import { mobNote, noteFileName } from './markdown';
import type { SavedMob } from './types';

function saveBlob(blob: Blob, fileName: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One mob as a .md file; several as a .zip of notes, with matching names numbered. */
export function downloadNotes(mobs: SavedMob[]) {
	if (mobs.length === 1) {
		saveBlob(new Blob([mobNote(mobs[0]!)], { type: 'text/markdown' }), noteFileName(mobs[0]!));
		return;
	}
	const files: Record<string, Uint8Array> = {};
	for (const mob of mobs) {
		let name = noteFileName(mob);
		for (let n = 2; files[name]; n++) name = noteFileName(mob).replace(/\.md$/, ` ${n}.md`);
		files[name] = strToU8(mobNote(mob));
	}
	saveBlob(new Blob([zipSync(files)], { type: 'application/zip' }), 'mobs.zip');
}

export function downloadPack(mobs: SavedMob[], opts: PackOptions) {
	const json = JSON.stringify(crawlerForgePack(mobs, opts), null, 2);
	saveBlob(new Blob([json], { type: 'application/json' }), 'mob-forge-pack.json');
}

export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
