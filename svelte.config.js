import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter()
	},
	paths: {
		base: '/doppel',
	},
	prerender: {
		// Not needed because the models overview page has links to all the models – and sveltekit will automatically pre-render all reachable links!
		// entries: ['*', ...files.map((file) => file.uri)],
		handleHttpError: 'warn',
	}
};

export default config;
