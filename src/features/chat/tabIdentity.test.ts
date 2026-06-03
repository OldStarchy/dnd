import { describe, expect, test } from 'vitest';
import { generateTabName } from './tabIdentity';

describe('tabIdentity', () => {
	describe('generateTabName', () => {
		test('creates deterministic name when random source is deterministic', () => {
			let call = 0;
			const sequence = [0.0, 0.1, 0.2];
			const random = () => {
				const value = sequence[Math.min(call, sequence.length - 1)];
				call += 1;
				return value;
			};

			expect(generateTabName(random)).toBe('RapidFalcon280');
		});
	});
});
