import { describe, expect, test, vi } from 'vitest';
import PlayerDoc from './PlayerDoc';

describe('PlayerDoc', () => {
	test('constructs', () => {
		new PlayerDoc();
	});

	describe('encounter', () => {
		test('initially null', () => {
			const doc = new PlayerDoc();
			expect(doc.encounter).toBeNull();
		});
		test('start encounter', () => {
			const doc = new PlayerDoc();

			const newEncounter = doc.startEncounter({
				name: 'Encounter Name',
				description: 'Encounter Description.',
				creatureIds: [],
			});

			expect(newEncounter).toBeDefined();
			expect(doc.encounter).toBeDefined();
		});

		test('start a second encounter throws', () => {
			const doc = new PlayerDoc();
			doc.startEncounter({
				name: 'Encounter Name',
				description: 'Encounter Description.',
				creatureIds: [],
			});

			expect(() => {
				doc.startEncounter({
					name: 'Another Encounter Name',
					description: 'Another Encounter Description.',
					creatureIds: [],
				});
			}).toThrow('Encounter already in progress');
		});

		test('stop encounter throws if no encounter in progress', () => {
			const doc = new PlayerDoc();

			expect(() => {
				doc.endEncounter();
			}).toThrow('No encounter in progress');
		});

		test('stop encounter deletes the encounter', () => {
			const doc = new PlayerDoc();
			doc.startEncounter({
				name: 'Encounter Name',
				description: 'Encounter Description.',
				creatureIds: [],
			});

			doc.endEncounter();

			expect(doc.encounter).toBeNull();
		});

		test('import export', () => {
			const doc = new PlayerDoc();
			const { id } = doc.createCreature({
				name: 'Goblin',
				description: 'A small, green creature.',
			});
			doc.startEncounter({
				name: 'Encounter Name',
				description: 'Encounter Description.',
				creatureIds: [],
			});

			const exported = doc.export();

			const newDoc = new PlayerDoc();
			newDoc.import(exported);

			expect(newDoc.export()).toEqual({
				creatures: {
					[id]: {
						id: id,
						name: 'Goblin',
						description: 'A small, green creature.',
					},
				},
				encounter: {
					name: 'Encounter Name',
					description: 'Encounter Description.',
					creatureIds: [],
				},
			});
		});

		test('import overwrite existing encounter', () => {
			const doc = new PlayerDoc();
			const { id } = doc.createCreature({
				name: 'Goblin',
				description: 'A small, green creature.',
			});
			doc.startEncounter({
				name: 'Encounter Name',
				description: 'Encounter Description.',
				creatureIds: [],
			});

			const exported = doc.export();

			const newDoc = new PlayerDoc();
			newDoc.startEncounter({
				name: 'Old Encounter Name',
				description: 'Old Encounter Description.',
				creatureIds: [],
			});
			newDoc.import(exported);

			expect(newDoc.export()).toEqual({
				creatures: {
					[id]: {
						id: id,
						name: 'Goblin',
						description: 'A small, green creature.',
					},
				},
				encounter: {
					name: 'Encounter Name',
					description: 'Encounter Description.',
					creatureIds: [],
				},
			});
		});

		test('import delete existing encounter', () => {
			const doc = new PlayerDoc();
			const { id } = doc.createCreature({
				name: 'Goblin',
				description: 'A small, green creature.',
			});

			const exported = doc.export();

			const newDoc = new PlayerDoc();
			newDoc.startEncounter({
				name: 'Old Encounter Name',
				description: 'Old Encounter Description.',
				creatureIds: [],
			});
			newDoc.import(exported);

			expect(newDoc.export()).toEqual({
				creatures: {
					[id]: {
						id: id,
						name: 'Goblin',
						description: 'A small, green creature.',
					},
				},
				encounter: null,
			});
		});
	});

	describe('creatures', () => {
		test('publish creature', () => {
			const doc = new PlayerDoc();
			const creature = {
				id: 'creature-id',
				name: 'Goblin',
				description: 'A small, green creature.',
			};
			doc.publishCreature(creature);

			expect(doc.creatures).toEqual({
				[creature.id]: expect.objectContaining({
					id: creature.id,
					name: creature.name,
					description: creature.description,
				}),
			});
		});

		test('import replace creatures existing encounter', () => {
			const doc = new PlayerDoc();
			const { id } = doc.createCreature({
				name: 'Goblin',
				description: 'A small, green creature.',
			});
			const { id: id2 } = doc.createCreature({
				name: 'Troll',
				description: 'A large, regenerating creature.',
			});

			const exported = doc.export();

			const newDoc = new PlayerDoc();
			newDoc.publishCreature({
				id,
				name: 'Goblin',
				description: 'A small, green creature.',
			});
			newDoc.createCreature({
				name: 'Orc',
				description: 'A large, brutish creature.',
			});

			newDoc.import(exported);

			expect(newDoc.export()).toEqual({
				creatures: {
					[id]: {
						id: id,
						name: 'Goblin',
						description: 'A small, green creature.',
					},
					[id2]: {
						id: id2,
						name: 'Troll',
						description: 'A large, regenerating creature.',
					},
				},
				encounter: null,
			});
		});

		test('creature$ emits on creature add', () => {
			const doc = new PlayerDoc();
			const creature = {
				id: 'creature-id',
				name: 'Goblin',
				description: 'A small, green creature.',
			};

			const done = vi.fn();
			doc.creature$.subscribe((value) => {
				if (typeof value === 'string') {
					return;
				}

				expect(value.id).toBe(creature.id);
				expect(value.name).toBe(creature.name);
				expect(value.description).toBe(creature.description);
				done();
			});

			doc.publishCreature(creature);
			expect(done).toHaveBeenCalled();
		});

		test('creature$ emits on creature update', () => {
			const doc = new PlayerDoc();
			const creature = {
				id: 'creature-id',
				name: 'Goblin',
				description: 'A small, green creature.',
			};
			doc.publishCreature(creature);

			const done = vi.fn();
			doc.creature$.subscribe((value) => {
				if (typeof value === 'string') {
					return;
				}

				expect(value.id).toBe(creature.id);
				expect(value.name).toBe('Updated Goblin');
				expect(value.description).toBe('An updated description.');
				done();
			});

			doc.publishCreature({
				id: creature.id,
				name: 'Updated Goblin',
				description: 'An updated description.',
			});
			expect(done).toHaveBeenCalled();
		});

		test('creature$ emits creature id on creature delete', () => {
			const doc = new PlayerDoc();
			const creature = {
				id: 'creature-id',
				name: 'Goblin',
				description: 'A small, green creature.',
			};
			doc.publishCreature(creature);

			const done = vi.fn();
			doc.creature$.subscribe((value) => {
				if (typeof value === 'string') {
					expect(value).toBe(creature.id);
					done();
				}
			});

			doc.deleteCreature(creature.id);
			expect(done).toHaveBeenCalled();
		});
	});
});
