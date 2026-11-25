<script setup lang="ts">
// Tells the user when the app is ready offline and when a new version is waiting.
import { useRegisterSW } from 'virtual:pwa-register/vue';

const HOUR = 60 * 60 * 1000;

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
	// Tabs left open for days still hear about new versions.
	onRegisteredSW(_url, registration) {
		if (registration) setInterval(() => void registration.update(), HOUR);
	},
});

function close() {
	offlineReady.value = false;
	needRefresh.value = false;
}
</script>

<template>
	<div
		v-if="offlineReady || needRefresh"
		role="alert"
		class="fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm shadow-2xl shadow-black/60"
	>
		<p class="flex-1">
			<template v-if="needRefresh">A new version of Mob forge is ready. Save your work, then update.</template>
			<template v-else>Mob forge now works offline.</template>
		</p>
		<button v-if="needRefresh" type="button" class="btn btn-primary" @click="updateServiceWorker(true)">Update</button>
		<button type="button" class="btn btn-ghost px-2" aria-label="Dismiss" @click="close">✕</button>
	</div>
</template>
