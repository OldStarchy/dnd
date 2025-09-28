/// <reference types="@vitest/browser/matchers" />
/// <reference types="vitest/config" />
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const aliasConfig = {
	'@': path.resolve(__dirname, './src'),
};

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: ['src/generated/**', '**/use[A-Z]*.ts'],
				},
				resolve: {
					alias: aliasConfig,
				},
			},
			{
				plugins: [react(), tailwindcss()],
				test: {
					name: 'browser',
					environment: 'browser',
					include: ['src/**/*.test.tsx', 'src/**/use[A-Z]*.test.ts'],
					exclude: ['src/generated/**'],
					css: true,
					browser: {
						enabled: true,
						headless: true,
						provider: 'playwright',
						// https://vitest.dev/guide/browser/playwright
						instances: [{ browser: 'chromium' }],
					},
				},
				resolve: {
					alias: aliasConfig,
				},
			},
		],
		coverage: {
			include: ['src/**/*.{ts,tsx}'],
		},
	},
});
