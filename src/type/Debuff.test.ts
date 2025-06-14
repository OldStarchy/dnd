import { describe, expect, it } from 'vitest';
import { Debuff } from './Debuff';

describe('Debuff', () => {
	it('creates a preset debuff', () => {
		const debuff = Debuff.of('poisoned');
		expect(debuff).toEqual({
			kind: 'preset',
			type: 'poisoned',
		});
	});

	it('flattens a preset debuff', () => {
		const debuff = Debuff.of('poisoned');
		const flatDebuff = Debuff.flat(debuff);
		expect(flatDebuff).toEqual({
			name: 'Poisoned',
			color: '#00FF00',
			notes: undefined,
		});
	});

	it('creates a custom debuff', () => {
		const customDebuff: Debuff = {
			kind: 'custom',
			name: 'Custom Debuff',
			description: 'This is a custom debuff.',
			color: '#FF00FF',
			duration: 5,
			notes: 'Some notes about the custom debuff.',
		};
		expect(customDebuff).toEqual({
			kind: 'custom',
			name: 'Custom Debuff',
			description: 'This is a custom debuff.',
			color: '#FF00FF',
			duration: 5,
			notes: 'Some notes about the custom debuff.',
		});
	});
	it('flattens a custom debuff', () => {
		const customDebuff: Debuff = {
			kind: 'custom',
			name: 'Custom Debuff',
			description: 'This is a custom debuff.',
			color: '#FF00FF',
			duration: 5,
			notes: 'Some notes about the custom debuff.',
		};
		const flatCustomDebuff = Debuff.flat(customDebuff);
		expect(flatCustomDebuff).toEqual({
			name: 'Custom Debuff',
			color: '#FF00FF',
			notes: 'Some notes about the custom debuff.',
		});
	});
});
