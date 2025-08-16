import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [
					[
						'@babel/plugin-transform-typescript',
						{
							allowDeclareFields: true,
							isTSX: true,
						},
					],
					[
						'@babel/plugin-proposal-decorators',
						{ version: '2023-11' },
					],
				],
			},
		}),
		tailwindcss(),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		host: true, // equivalent to 0.0.0.0
		port: 5173,
		hmr: {
			protocol: 'ws',
			clientPort: 5173,
		},
	},
	base: (process.env.VITE_BASE_URL || '/').replace(/\/?$/, '/'),
});
