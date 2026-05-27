import { describe, expect, test, vi } from 'vitest';
import * as Y from 'yjs';
import CreatureFragment, { type Creature } from './CreatureFragment';

describe('CreatureFragment', () => {
	test('constructs', () => {
		const map = new Y.Map<Creature[keyof Creature]>();
		const fragment = new CreatureFragment(map);
		expect(fragment).toBeInstanceOf(CreatureFragment);
	});

	test('constructs with data', () => {
		const { id, map } = CreatureFragment.create({
			name: 'Goblin',
			description: 'A small, green creature.',
		});
		const fragment = new CreatureFragment(map);

		const doc = new Y.Doc();
		doc.getMap('data').set('creature', map);

		expect(fragment.id).toBe(id);
		expect(fragment.name).toBe('Goblin');
		expect(fragment.description).toBe('A small, green creature.');
	});

	test('import export', () => {
		const { id, map } = CreatureFragment.create({
			name: 'Goblin',
			description: 'A small, green creature.',
		});
		const fragment = new CreatureFragment(map);

		const doc = new Y.Doc();
		doc.getMap('data').set('creature', map);

		const data = {
			name: 'Orc',
			description: 'A large, brutish creature.',
		};
		fragment.import(data);

		expect(fragment.name).toBe('Orc');
		expect(fragment.description).toBe('A large, brutish creature.');

		const exported = fragment.export();
		expect(exported).toEqual({
			id: id,
			name: 'Orc',
			description: 'A large, brutish creature.',
		});
	});

	test('transact', () => {
		const { map } = CreatureFragment.create({
			name: 'Goblin',
			description: 'A small, green creature.',
		});
		const fragment = new CreatureFragment(map);

		const doc = new Y.Doc();
		doc.getMap('data').set('creature', map);

		const cb = vi.fn();
		fragment.change$.subscribe(cb);

		fragment.transact(() => {
			fragment.name = 'Orc';
			fragment.description = 'A large, brutish creature.';
		});

		expect(cb).toHaveBeenCalledTimes(1);
		expect(fragment.name).toBe('Orc');
		expect(fragment.description).toBe('A large, brutish creature.');
	});

	test('change$ emits on changes', () => {
		const { map } = CreatureFragment.create({
			name: 'Goblin',
			description: 'A small, green creature.',
		});
		const fragment = new CreatureFragment(map);

		const doc = new Y.Doc();
		doc.getMap('data').set('creature', map);

		const cb = vi.fn();
		fragment.change$.subscribe(cb);

		fragment.name = 'Orc';
		expect(cb).toHaveBeenCalledTimes(1);

		fragment.description = 'A large, brutish creature.';
		expect(cb).toHaveBeenCalledTimes(2);
	});
});
