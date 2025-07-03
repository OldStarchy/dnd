import sybilProfile from '@/components/InitiativeTable/fixtures/sybil_profile.png';
import '@/index.css';
import { Debuff } from '@/type/Debuff';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ThemeProvider } from '../theme-provider';
import { Table } from '../ui/table';
import { type InitiativeTableEntry } from './InitiativeTableEntry';
import InitiativeTableRow from './InitiativeTableRow';

describe('InitiativeTableRow', () => {
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
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow entry={creature} />
				</Table>
			</ThemeProvider>,
		);

		await expect(screen.getByText('Goblin').first()).toBeInTheDocument();
		await expect(screen.getByText('15')).toBeInTheDocument();
		await expect(screen.getByText('Healthy')).toBeInTheDocument();
	});

	it('does not show descriptions when not expanded', async () => {
		const creature: InitiativeTableEntry = {
			id: '1',
			name: 'Goblin',
			race: 'Goblin',
			initiative: 15,
			healthDisplay: 'Healthy',
			debuffs: [],
			effect: undefined,
			description: 'This is a goblin, a small and mischievous creature.',
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow entry={creature} />
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
			id: '1',
			name: 'Goblin',
			race: 'Goblin',
			initiative: 15,
			healthDisplay: 'Healthy',
			debuffs: [],
			effect: undefined,
			description: 'This is a goblin, a small and mischievous creature.',
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow entry={creature} />
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
			id: '1',
			name: 'Goblin',
			race: 'Goblin',
			initiative: 15,
			healthDisplay: 'Healthy',
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
			effect: undefined,
			description: undefined,
		};
		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow entry={creature} />
				</Table>
			</ThemeProvider>,
		);
		await expect(screen.getByText('Poisoned')).toBeInTheDocument();
		await expect(screen.getByText('Slowed')).toBeInTheDocument();
	});

	it('shows actions', async () => {
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
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow
						entry={creature}
						actions={() => (
							<>
								<button>Attack</button>
							</>
						)}
					/>
				</Table>
			</ThemeProvider>,
		);

		await expect(screen.getByText('Attack')).toBeInTheDocument();
	});

	it.skip('shows profile images', async () => {
		const creature: InitiativeTableEntry = {
			id: '1',
			name: 'Sybil Snow',
			race: 'Human',
			initiative: 18,
			healthDisplay: '10 / 11',
			debuffs: [],
			effect: undefined,
			description: undefined,
			image: sybilProfile,
		};

		const screen = render(
			<ThemeProvider defaultTheme="dark">
				<Table>
					<InitiativeTableRow entry={creature} />
				</Table>
			</ThemeProvider>,
		);

		const icon = await screen.getByAltText('Sybil Snow');
		await expect(icon).toBeInTheDocument();
		await expect(icon).toHaveAttribute('src', sybilProfile);
	});

	it('clicking a profile image in the extended description shows a larger version', async () => {
		const creature: InitiativeTableEntry = {
			id: '1',
			name: 'Sybil Snow',
			race: 'Human',
			initiative: 18,
			healthDisplay: '10 / 11',
			debuffs: [],
			effect: undefined,
			description: undefined,
			image: sybilProfile,
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
