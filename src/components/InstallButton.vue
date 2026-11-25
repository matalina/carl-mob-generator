<script setup lang="ts">
// An "Install app" button where the browser offers installing (Chrome, Edge, Android).
// Safari has no such event; there it's Share → Add to Home Screen (or Add to Dock).
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface InstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const deferred = ref<InstallPromptEvent | null>(null);

function onPrompt(e: Event) {
	e.preventDefault();
	deferred.value = e as InstallPromptEvent;
}
function onInstalled() {
	deferred.value = null;
}

onMounted(() => {
	window.addEventListener('beforeinstallprompt', onPrompt);
	window.addEventListener('appinstalled', onInstalled);
});
onBeforeUnmount(() => {
	window.removeEventListener('beforeinstallprompt', onPrompt);
	window.removeEventListener('appinstalled', onInstalled);
});

async function install() {
	const e = deferred.value;
	if (!e) return;
	await e.prompt();
	await e.userChoice;
	deferred.value = null;
}
</script>

<template>
	<button v-if="deferred" type="button" class="btn" @click="install">Install app</button>
</template>
