import '@/index.css';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { ThemeProvider } from '../theme-provider';
import InitiativeTable from './InitiativeTable';
import type { InitiativeTableEntry } from './InitiativeTableRow';

describe('InitiativeTable', () => {
	it('shows the charactres info', async () => {
		const creature: InitiativeTableEntry = {
			id: '1',
			name: 'Goblin',
			race: 'Goblin',
			initiative: 15,
			healthDisplay: 'Healthy',
			debuffs: [],
			effect: undefined,
			description: undefined,
		};

		const screen = render(
			<ThemeProvider>
				<InitiativeTable entries={[creature]} />
			</ThemeProvider>,
		);

		await expect(screen.getByText('Goblin').first()).toBeInTheDocument();
		await expect(screen.getByText('15')).toBeInTheDocument();
		await expect(screen.getByText('Healthy')).toBeInTheDocument();
	});

	it('triggers onSwap when an entity is dragged and dropped', async () => {
		const creature1: InitiativeTableEntry = {
			id: '1',
			name: 'Goblin',
			race: 'Goblin',
			initiative: 15,
			healthDisplay: 'Healthy',
			debuffs: [],
			effect: undefined,
			description: undefined,
		};
		const creature2: InitiativeTableEntry = {
			id: '2',
			name: 'Orc',
			race: 'Orc',
			initiative: 10,
			healthDisplay: 'Wounded',
			debuffs: [],
			effect: undefined,
			description: undefined,
		};

		const onSwapMock = vi.fn();

		const screen = render(
			<ThemeProvider>
				<InitiativeTable
					entries={[creature1, creature2]}
					onSwapEntities={onSwapMock}
				/>
			</ThemeProvider>,
		);

		const goblinRow = screen.getByText('Goblin').first();
		const orcRow = screen.getByText('Orc').first();

		await goblinRow.dropTo(orcRow);

		expect(onSwapMock).toHaveBeenCalledWith(0, 1);
	});

	it('shows actions for entities', async () => {
		const creature: InitiativeTableEntry = {
			id: '1',
			name: 'Goblin',
			race: 'Goblin',
			initiative: 15,
			healthDisplay: 'Healthy',
			debuffs: [],
			effect: undefined,
			description: undefined,
		};

		const screen = render(
			<ThemeProvider>
				<InitiativeTable
					entries={[creature]}
					actions={(_, index) => <button>Attack {index}</button>}
				/>
			</ThemeProvider>,
		);

		await expect(screen.getByText('Attack 0')).toBeInTheDocument();
	});
});
