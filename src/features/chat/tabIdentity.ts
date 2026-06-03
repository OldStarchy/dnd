const adjectivePool = [
	'Rapid',
	'Brisk',
	'Quiet',
	'Bright',
	'Nimble',
	'Sharp',
	'Calm',
	'Lucky',
	'Swift',
	'Bold',
];

const nounPool = [
	'Comet',
	'Falcon',
	'River',
	'Lantern',
	'Echo',
	'Voyager',
	'Circuit',
	'Pioneer',
	'Compass',
	'Signal',
];

function pick<T>(items: readonly T[], random: () => number): T {
	const index = Math.floor(random() * items.length);
	return items[Math.max(0, Math.min(items.length - 1, index))];
}

export function generateTabName(random: () => number = Math.random): string {
	const adjective = pick(adjectivePool, random);
	const noun = pick(nounPool, random);
	const suffix = Math.floor(random() * 900 + 100).toString();
	return `${adjective}${noun}${suffix}`;
}

export function getOrCreateTabName(random: () => number = Math.random): string {
	return generateTabName(random);
}
