import { describe, expect, test, vi } from 'vitest';
import * as Y from 'yjs';
import EncounterFragment, { type Encounter } from './EncounterFragment';

describe('EncounterFragment', () => {
	test('constructs', () => {
		const map = new Y.Map<Encounter[keyof Encounter]>();
		const fragment = new EncounterFragment(map);
		expect(fragment).toBeInstanceOf(EncounterFragment);
	});

	test('constructs with data', () => {
		const { map } = EncounterFragment.create({
			name: 'Encounter Name',
			description: 'Encounter Description.',
			creatureIds: ['Creature ID'],
		});
		const fragment = new EncounterFragment(map);

		const doc = new Y.Doc();
		doc.getMap('data').set('Encounter', map);

		expect(fragment.name).toBe('Encounter Name');
		expect(fragment.description).toBe('Encounter Description.');
		expect(fragment.creatureIds.toArray()).toEqual(['Creature ID']);
	});

	test('throws if subscribed to early', () => {
		const { map } = EncounterFragment.create({
			name: 'Encounter Name',
			description: 'Encounter Description.',
			creatureIds: ['Creature ID'],
		});
		const fragment = new EncounterFragment(map);

		const errFn = vi.fn();

		fragment.change$.subscribe({ error: errFn });

		expect(errFn).toHaveBeenCalled();
	});

	test('import export', () => {
		const { map } = EncounterFragment.create({
			name: 'Encounter Name',
			description: 'Encounter Description.',
			creatureIds: ['Creature ID'],
		});
		const fragment = new EncounterFragment(map);

		const doc = new Y.Doc();
		doc.getMap('data').set('Encounter', map);

		const data = {
			name: 'Different Encounter Name',
			description: 'Different Encounter Description.',
			creatureIds: [],
		};
		fragment.import(data);

		expect(fragment.name).toBe('Different Encounter Name');
		expect(fragment.description).toBe('Different Encounter Description.');

		const exported = fragment.export();
		expect(exported).toEqual({
			name: 'Different Encounter Name',
			description: 'Different Encounter Description.',
			creatureIds: [],
		});
	});

	test('transact', () => {
		const { map } = EncounterFragment.create({
			name: 'Encounter Name',
			description: 'Encounter Description.',
			creatureIds: ['Creature ID'],
		});
		const fragment = new EncounterFragment(map);

		const doc = new Y.Doc();
		doc.getMap('data').set('Encounter', map);

		const cb = vi.fn();
		fragment.change$.subscribe(cb);

		fragment.transact(() => {
			fragment.name = 'Different Encounter Name';
			fragment.description = 'Different Encounter Description.';
			fragment.creatureIds.push(['Different Creature ID']);
		});

		expect(cb).toHaveBeenCalledTimes(1);
		expect(fragment.name).toBe('Different Encounter Name');
		expect(fragment.description).toBe('Different Encounter Description.');
		expect(fragment.creatureIds.toArray()).toEqual(['Creature ID', 'Different Creature ID']);
	});

	test('change$ emits on changes', () => {
		const { map } = EncounterFragment.create({
			name: 'Encounter Name',
			description: 'Encounter Description.',
			creatureIds: ['Creature ID'],
		});
		const fragment = new EncounterFragment(map);

		const doc = new Y.Doc();
		doc.getMap('data').set('Encounter', map);

		const cb = vi.fn();
		const sub = fragment.change$.subscribe(cb);

		fragment.name = 'Different Encounter Name';
		expect(cb).toHaveBeenCalledTimes(1);

		fragment.description = 'Different Encounter Description.';
		expect(cb).toHaveBeenCalledTimes(2);

		fragment.creatureIds.push(['Different Creature ID']);
		expect(cb).toHaveBeenCalledTimes(3);

		sub.unsubscribe();
	});
});
