import '@/index.css';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import type { Collection } from '@/db/Collection';
import { RamCollection } from '@/db/RamCollection';
import { Db } from '@/sync/room/RoomApi';
import { InitiativeTableEntryApi } from '@/type/EncounterApi';

import InitiativeTable from './InitiativeTable';
import ThemeProvider from '../../context/theme/ThemeProvider';
import {
	type InitiativeTableEntry,
	InitiativeTableEntryCollectionSchema,
	type InitiativeTableEntryRecord,
} from '../../db/record/InitiativeTableEntry';

describe('InitiativeTable', () => {
	let dummyDb: Collection<
		InitiativeTableEntryRecord,
		InitiativeTableEntryApi
	>;

	beforeEach(() => {
		dummyDb = new RamCollection<
			InitiativeTableEntryRecord,
			InitiativeTableEntryApi
		>(InitiativeTableEntryCollectionSchema, new Db());
	});

	function createCreature(data: InitiativeTableEntry) {
		return new InitiativeTableEntryApi(new BehaviorSubject(data), dummyDb);
	}

	it('shows the charactres info', async () => {
		const creature = createCreature({
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
					images: [],
					hp: 7,
					maxHp: 7,
					debuffs: [],
					description: undefined,
				},
			},
		});

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
		const creature1 = createCreature({
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
					images: [],
					debuffs: [],
					description: undefined,
					hp: 12,
					maxHp: 12,
				},
			},
		});
		const creature2 = createCreature({
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
					images: [],
					debuffs: [],
					description: undefined,
					hp: 12,
					maxHp: 12,
				},
			},
		});

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
		const creature = createCreature({
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
					images: [],
					debuffs: [],
					description: undefined,
					hp: 12,
					maxHp: 12,
				},
			},
		});

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
