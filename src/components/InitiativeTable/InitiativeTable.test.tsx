import '@/index.css';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import InitiativeTable from './InitiativeTable';
import { ThemeProvider } from '../../context/theme/ThemeProvider';
import type { InitiativeTableEntry } from '../../db/record/InitiativeTableEntry';

describe('InitiativeTable', () => {
	it('shows the charactres info', async () => {
		const creature: InitiativeTableEntry = {
			id: '1' as InitiativeTableEntry['id'],
			encounterId: 'enc1' as InitiativeTableEntry['encounterId'],
			revision: 0,
			initiative: 15,
			healthDisplay: 'Healthy',
			effect: undefined,
			creature: {
				type: 'generic',
				data: {
					name: 'Goblin',
					race: 'Goblin',
					hp: 7,
					maxHp: 7,
					debuffs: [],
					description: undefined,
				},
			},
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
			id: '1' as InitiativeTableEntry['id'],
			revision: 0,
			encounterId: 'enc1' as InitiativeTableEntry['encounterId'],
			initiative: 15,
			healthDisplay: 'Healthy',
			effect: undefined,
			creature: {
				type: 'generic',
				data: {
					name: 'Goblin',
					race: 'Goblin',
					debuffs: [],
					description: undefined,
					hp: 12,
					maxHp: 12,
				},
			},
		};
		const creature2: InitiativeTableEntry = {
			id: '2' as InitiativeTableEntry['id'],
			revision: 0,
			encounterId: 'enc1' as InitiativeTableEntry['encounterId'],
			initiative: 10,
			healthDisplay: 'Wounded',
			effect: undefined,
			creature: {
				type: 'generic',
				data: {
					name: 'Orc',
					race: 'Orc',
					debuffs: [],
					description: undefined,
					hp: 12,
					maxHp: 12,
				},
			},
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
			id: '1' as InitiativeTableEntry['id'],
			revision: 0,
			encounterId: 'enc1' as InitiativeTableEntry['encounterId'],
			initiative: 15,
			healthDisplay: 'Healthy',
			effect: undefined,
			creature: {
				type: 'generic',
				data: {
					name: 'Goblin',
					race: 'Goblin',
					debuffs: [],
					description: undefined,
					hp: 12,
					maxHp: 12,
				},
			},
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
