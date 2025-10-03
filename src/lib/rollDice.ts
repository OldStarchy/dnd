/**
 * eg.
 *
 * ```ts
 * rollDice("1d20") // rolls one 20-sided die
 * rollDice("2d6+3") // rolls two six-sided dice and adds 3 to the result
 * ```
 */
export default function rollDice(str: string): number {
	const { count, sides, modifier } = parseDiceString(str);

	let total = 0;
	for (let i = 0; i < count; i++) {
		total += Math.floor(Math.random() * sides) + 1;
	}

	return total + modifier;
}

const diceRegex = /^(?<count>\d+)d(?<sides>\d+)(?<modifier>[+-]\d+)?$/;
function parseDiceString(str: string): {
	count: number;
	sides: number;
	modifier: number;
} {
	const match = diceRegex.exec(str);

	if (!match) {
		throw new Error(`Invalid dice format: ${str}`);
	}

	const { count, sides, modifier } = match.groups as {
		count: string;
		sides: string;
		modifier?: string;
	};

	return {
		count: Number.parseInt(count, 10),
		sides: Number.parseInt(sides, 10),
		modifier: modifier ? Number.parseInt(modifier, 10) : 0,
	} as const;
}
