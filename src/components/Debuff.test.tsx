import '@/index.css';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import type { Debuff as DebuffObj } from '@/type/Debuff';

import Debuff from './Debuff';
import { ThemeProvider } from './theme-provider';

describe('Debuff', () => {
	it('renders without notes', () => {
		const debuff: DebuffObj = {
			name: 'Stunned',
			color: 'bg-red-500',
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Debuff debuff={debuff} data-testid="debuff-badge" />
			</ThemeProvider>,
		);

		expect(screen.getByText('Stunned')).toBeInTheDocument();
		expect(screen.getByTestId('debuff-badge')).toHaveClass('bg-red-500');
	});

	it.skip('renders notes only on hover', async () => {
		const debuff: DebuffObj = {
			name: 'Poisoned',
			color: 'bg-green-500',
			notes: 'Takes damage over time',
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Debuff debuff={debuff} />
			</ThemeProvider>,
		);

		await expect(screen.getByText('Poisoned')).toBeInTheDocument();
		await expect(
			screen.getByText('Takes damage over time').query(),
		).toBeNull();

		await screen.getByText('Poisoned').hover();

		await new Promise((resolve) => setTimeout(resolve, 5000));

		await expect(
			await screen.getByText('Takes damage over time'),
		).toBeInTheDocument();
	});
});
