import '@/index.css';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ModeToggle } from './mode-toggle';
import { ThemeProvider } from './theme-provider';

describe('ModeToggle', () => {
	it('switches to the selected theme', async () => {
		// Render a React element into the DOM
		const screen = render(
			<ThemeProvider storageKey="vite-ui-theme">
				<ModeToggle />
			</ThemeProvider>,
		);

		await screen.getByRole('button', { name: 'Toggle theme' }).click();
		await screen.getByText('Light').click();
		await expect(localStorage.getItem('vite-ui-theme')).toBe('light');

		await screen.getByRole('button', { name: 'Toggle theme' }).click();
		await screen.getByText('Dark').click();
		await expect(localStorage.getItem('vite-ui-theme')).toBe('dark');

		await screen.getByRole('button', { name: 'Toggle theme' }).click();
		await screen.getByText('System').click();
		await expect(localStorage.getItem('vite-ui-theme')).toBe('system');
	});
});
