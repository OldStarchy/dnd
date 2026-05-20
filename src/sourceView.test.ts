import { describe, expect, test } from 'vitest';
import SourceView from './SourceView.ts';

describe('SourceView', () => {
	test('constructs', () => {
		const sourceOfTruth = new SourceView();
		expect(sourceOfTruth).toBeInstanceOf(SourceView);
	});

	test('initializes dmData', () => {
		const sourceOfTruth = new SourceView();
		expect(sourceOfTruth.getData()).toEqual({ creatures: {} });
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
				sourceOfTruth.addCreature({
					id: '1',
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: true,
				});

				expect(otherPlayer.getData().creatures).toEqual(sourceOfTruth.getData().creatures);
			});

			test('syncs changed to data to player', () => {
				const sourceOfTruth = new SourceView();
				sourceOfTruth.addCreature({
					id: '1',
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: true,
				});

				sourceOfTruth.addCreature({
					id: '2',
					name: 'Orc',
					description: 'A large, brutish creature.',
				});

				expect(otherPlayer.getData().creatures).toEqual(sourceOfTruth.getData().creatures);
			});
		});

		describe('syncAll: false', () => {
			test('does not syncs initial to data to player', () => {
				const sourceOfTruth = new SourceView();
				sourceOfTruth.addCreature({
					id: '1',
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: false,
				});

				expect(otherPlayer.getData().creatures).toEqual({});
			});
		});

		describe('publishCreature', () => {
			test('syncs published creatures to player', () => {
				const sourceOfTruth = new SourceView();
				sourceOfTruth.addCreature({
					id: '1',
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				sourceOfTruth.addCreature({
					id: '2',
					name: 'Big Bad Boss Guy',
					description: 'A large, brutish creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: false,
				});

				sourceOfTruth.publishCreature('1', otherPlayer.id, { syncAll: true });
				sourceOfTruth.publishCreature('2', otherPlayer.id, {
					obfuscator: (creature) => ({
						...creature,
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					}),
				});

				expect(otherPlayer.getData().creatures).toEqual({
					'1': {
						id: '1',
						name: 'Goblin',
						description: 'A small, green creature.',
					},
					'2': {
						id: '2',
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					},
				});
			});

			test('obfuscates updates to creatures', () => {
				const sourceOfTruth = new SourceView();
				sourceOfTruth.addCreature({
					id: '1',
					name: 'Goblin',
					description: 'A small, green creature.',
				});

				sourceOfTruth.addCreature({
					id: '2',
					name: 'Big Bad Boss Guy',
					description: 'A large, brutish creature.',
				});

				const otherPlayer = sourceOfTruth.addPlayer('Alice', {
					syncAll: false,
				});

				sourceOfTruth.publishCreature('1', otherPlayer.id, { syncAll: true });
				sourceOfTruth.publishCreature('2', otherPlayer.id, {
					obfuscator: (creature) => ({
						...creature,
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					}),
				});

				expect(otherPlayer.getData().creatures).toEqual({
					'1': {
						id: '1',
						name: 'Goblin',
						description: 'A small, green creature.',
					},
					'2': {
						id: '2',
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					},
				});

				sourceOfTruth.updateCreature('1', { name: 'Barry' });
				sourceOfTruth.updateCreature('2', { description: 'A very dangerous creature.' });

				expect(otherPlayer.getData().creatures).toEqual({
					'1': {
						id: '1',
						name: 'Barry',
						description: 'A small, green creature.',
					},
					'2': {
						id: '2',
						name: 'Unknown Creature',
						description: 'An unknown creature.',
					},
				});
			});
		});
	});
});
