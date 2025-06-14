/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
	test: {
		include: ['src/**/*.test.{ts,tsx}'],
		exclude: ['src/generated/**'],
		coverage: {
			include: ['src/**/*.{ts,tsx}'],
		},
	},
});
