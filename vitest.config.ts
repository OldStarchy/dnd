import react from '@vitejs/plugin-react';
import { playwright } from 'vitest/browser-playwright';
import { defineConfig, ViteUserConfig } from 'vitest/config';

export default defineConfig(
	(_env): ViteUserConfig => ({
		plugins: [react()],
		test: {
			include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
			coverage: {
				enabled: true,
				provider: 'v8',
			},
			projects: [
				{
					test: {
						include: ['src/**/*.test.ts'],
					},
				},
				{
					test: {
						include: ['src/**/*.test.tsx'],
						browser: {
							enabled: true,
							provider: playwright(),
							headless: true,
							instances: [
								{ browser: 'chromium' },

								// webkit doesn't work with v8 coverage, and there's no good way to check if coverage is enabled (via
								// --coverage) to exclude it; checking process.argv doesn't work when running from the vitest test
								// explorer in vscode.
								// {
								// 	browser: 'webkit',

								// 	//webkit only works in headless mode
								// 	headless: true,
								// },
							],
						},
					},
				},
			],
		},
	}),
);
