import { describe, expect, test } from 'vitest';
import SourceView from './SourceView.ts';

describe('SourceView', () => {
	test('constructs', () => {
		const sourceOfTruth = new SourceView();
		expect(sourceOfTruth).toBeInstanceOf(SourceView);
	});

	test('initializes dmData', () => {
		const sourceOfTruth = new SourceView();
		expect(sourceOfTruth.data).toBeDefined();
	});

	test('players are tracked', () => {
		const sourceOfTruth = new SourceView();
		sourceOfTruth.addPlayer('Alice', { syncAll: true });
		const players = sourceOfTruth.getPlayerNames();

		expect(players).toEqual(['Alice']);
	});

	describe('player data sync', () => {
		describe('syncAll: true', () => {
			test('syncs intial data to player', () => {
				const sourceOfTruth = new SourceView();
				sourceOfTruth.data.createCreature({
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: true,
				});

				expect(otherPlayer.data.export()).toEqual(sourceOfTruth.data.export());
			});

			test('syncs changed to data to player', () => {
				const sourceOfTruth = new SourceView();
				sourceOfTruth.data.createCreature({
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: true,
				});

				sourceOfTruth.data.createCreature({
					name: 'Orc',
					description: 'A large, brutish creature.',
				});

				expect(otherPlayer.data.export()).toEqual(sourceOfTruth.data.export());
			});
		});

		describe('syncAll: false', () => {
			test('does not syncs initial to data to player', () => {
				const sourceOfTruth = new SourceView();
				sourceOfTruth.data.createCreature({
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: false,
				});

				expect(otherPlayer.data.export().creatures).toEqual({});
			});
		});

		describe('publishCreature', () => {
			test('syncs published creatures to player', () => {
				const sourceOfTruth = new SourceView();
				const { id: id1 } = sourceOfTruth.data.createCreature({
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				const { id: id2 } = sourceOfTruth.data.createCreature({
					name: 'Big Bad Boss Guy',
					description: 'A large, brutish creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: false,
				});

				sourceOfTruth.publishCreature(id1, otherPlayer.id, { syncAll: true });
				sourceOfTruth.publishCreature(id2, otherPlayer.id, {
					obfuscator: (creature) => ({
						...creature,
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					}),
				});

				expect(otherPlayer.data.export().creatures).toEqual({
					[id1]: {
						id: id1,
						name: 'Goblin',
						description: 'A small, green creature.',
					},
					[id2]: {
						id: id2,
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					},
				});
			});

			test('obfuscates updates to creatures', () => {
				const sourceOfTruth = new SourceView();
				const { id: id1 } = sourceOfTruth.data.createCreature({
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				const { id: id2 } = sourceOfTruth.data.createCreature({
					name: 'Big Bad Boss Guy',
					description: 'A large, brutish creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: false,
				});

				sourceOfTruth.publishCreature(id1, otherPlayer.id, { syncAll: true });
				sourceOfTruth.publishCreature(id2, otherPlayer.id, {
					obfuscator: (creature) => ({
						...creature,
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					}),
				});

				expect(otherPlayer.data.export().creatures).toEqual({
					[id1]: {
						id: id1,
						name: 'Goblin',
						description: 'A small, green creature.',
					},
					[id2]: {
						id: id2,
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					},
				});

				sourceOfTruth.updateCreature(id1, { name: 'Barry' });
				sourceOfTruth.updateCreature(id2, { description: 'A very dangerous creature.' });

				expect(otherPlayer.data.export().creatures).toEqual({
					[id1]: {
						id: id1,
						name: 'Barry',
						description: 'A small, green creature.',
					},
					[id2]: {
						id: id2,
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					},
				});
			});
		});

		test('delete creature syncs to player', () => {
			const sourceOfTruth = new SourceView();
			const { id } = sourceOfTruth.data.createCreature({
				name: 'Goblin',
				description: 'A small, green creature.',
			});

			const otherPlayer = sourceOfTruth.addPlayer('Alice', {
				syncAll: true,
			});

			sourceOfTruth.data.deleteCreature(id);

			expect(otherPlayer.data.export().creatures).toEqual({});
		});
	});
});
