<script setup lang="ts">
// Tells the user when the app is ready offline and when a new version is waiting.
import { ref } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const HOUR = 60 * 60 * 1000;

let registration: ServiceWorkerRegistration | undefined;
const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
	onRegisteredSW(_url, r) {
		registration = r;
		// Tabs left open for days still hear about new versions.
		if (r) setInterval(() => void r.update(), HOUR);
	},
});

const updating = ref(false);

// The plugin only reloads when it sees the new version take over as an "update", which it
// misses when the version was found while the app was open (the hourly check, or another
// window). So reload here as soon as the new version is in control, whatever started it.
async function update() {
	if (updating.value) return;
	updating.value = true;
	const reload = () => window.location.reload();
	navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true });
	// Already took over (another window updated first): nothing left to wait for.
	if (!registration?.waiting) return reload();
	await updateServiceWorker(true);
	// Last resort if the takeover is never reported.
	setTimeout(reload, 4000);
}

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
		<button v-if="needRefresh" type="button" class="btn btn-primary" :disabled="updating" @click="update">
			{{ updating ? 'Updating…' : 'Update' }}
		</button>
		<button v-if="!updating" type="button" class="btn btn-ghost px-2" aria-label="Dismiss" @click="close">✕</button>
	</div>
</template>
