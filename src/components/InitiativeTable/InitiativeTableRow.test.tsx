import '@/index.css';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import sybilProfile from '@/components/InitiativeTable/fixtures/sybil_profile.png';
import { Table } from '@/components/ui/table';
import type { InitiativeTableEntry } from '@/db/record/InitiativeTableEntry';
import { Debuff } from '@/type/Debuff';

import type { FieldVisibility } from './InitiativeTable';
import InitiativeTableRow from './InitiativeTableRow';
import { ThemeProvider } from '../../context/theme/ThemeProvider';

const visibility: FieldVisibility = {
	initiative: true,
	name: true,
	race: true,
	ac: true,
	health: true,
	debuffs: true,
	description: true,
};

describe('InitiativeTableRow', () => {
	it('shows the charactres info', async () => {
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
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow
						entry={creature}
						fieldVisibility={visibility}
					/>
				</Table>
			</ThemeProvider>,
		);

		await expect(screen.getByText('Goblin').first()).toBeInTheDocument();
		await expect(screen.getByText('15')).toBeInTheDocument();
		await expect(screen.getByText('Healthy')).toBeInTheDocument();
	});

	it('does not show descriptions when not expanded', async () => {
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
					description:
						'This is a goblin, a small and mischievous creature.',
					hp: 12,
					maxHp: 12,
				},
			},
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow
						entry={creature}
						fieldVisibility={visibility}
					/>
				</Table>
			</ThemeProvider>,
		);

		await expect(
			screen
				.getByText(
					'This is a goblin, a small and mischievous creature.',
				)
				.query(),
		).toBeNull();
	});

	it('expands when clicked to show descriptions', async () => {
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
					description:
						'This is a goblin, a small and mischievous creature.',
					hp: 12,
					maxHp: 12,
				},
			},
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow
						entry={creature}
						fieldVisibility={visibility}
					/>
				</Table>
			</ThemeProvider>,
		);

		await screen.getByLabelText('Toggle Details').click();
		await expect(
			screen.getByText(
				'This is a goblin, a small and mischievous creature.',
			),
		).toBeInTheDocument();
	});

	it('shows debuffs', async () => {
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
					debuffs: [
						{
							...Debuff.poisoned,
							notes: "Hit by Such and Such's poison arrow",
						},
						{
							name: 'Slowed',
							color: 'bg-blue-500',
							description: 'Speed is halved',
						},
					],
					description:
						'This is a goblin, a small and mischievous creature.',
					hp: 12,
					maxHp: 12,
				},
			},
		};
		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow
						entry={creature}
						fieldVisibility={visibility}
					/>
				</Table>
			</ThemeProvider>,
		);
		await expect(screen.getByText('Poisoned')).toBeInTheDocument();
		await expect(screen.getByText('Slowed')).toBeInTheDocument();
	});

	it('shows actions', async () => {
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
					description:
						'This is a goblin, a small and mischievous creature.',
					hp: 12,
					maxHp: 12,
				},
			},
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow
						entry={creature}
						actions={() => (
							<>
								<button>Attack</button>
							</>
						)}
						fieldVisibility={visibility}
					/>
				</Table>
			</ThemeProvider>,
		);

		await expect(screen.getByText('Attack')).toBeInTheDocument();
	});

	it.skip('shows profile images', async () => {
		const creature: InitiativeTableEntry = {
			id: '1' as InitiativeTableEntry['id'],
			revision: 0,
			encounterId: 'enc1' as InitiativeTableEntry['encounterId'],
			initiative: 18,
			healthDisplay: '10 / 11',
			effect: undefined,
			creature: {
				type: 'generic',
				data: {
					name: 'Sybil Snow',
					race: 'Human',
					debuffs: [],
					description: undefined,
					images: [sybilProfile],
					hp: 10,
					maxHp: 11,
				},
			},
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow
						entry={creature}
						fieldVisibility={visibility}
					/>
				</Table>
			</ThemeProvider>,
		);

		const icon = await screen.getByAltText('Sybil Snow');
		await expect(icon).toBeInTheDocument();
		await expect(icon).toHaveAttribute('src', sybilProfile);
	});

	it('clicking a profile image in the extended description shows a larger version', async () => {
		const creature: InitiativeTableEntry = {
			id: '1' as InitiativeTableEntry['id'],
			revision: 0,
			encounterId: 'enc1' as InitiativeTableEntry['encounterId'],
			initiative: 18,
			healthDisplay: '10 / 11',
			effect: undefined,
			creature: {
				type: 'generic',
				data: {
					name: 'Sybil Snow',
					race: 'Human',
					debuffs: [],
					description: undefined,
					images: [sybilProfile],
					hp: 10,
					maxHp: 11,
				},
			},
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow
						entry={creature}
						actions={() => (
							<>
								<button>Attack</button>
							</>
						)}
						fieldVisibility={visibility}
					/>
				</Table>
			</ThemeProvider>,
		);

		await screen.getByAltText('Sybil Snow').click();

		const largeImage = await screen
			.getByRole('dialog')
			.getByAltText('Sybil Snow');
		await expect(largeImage).toBeInTheDocument();
	});
});
