export const DebuffType = {
	stunned: {
		name: 'Stunned',
		description:
			'The creature is incapacitated and can only take actions that do not require movement.',
		color: '#FF0000', // Red
	},
	poisoned: {
		name: 'Poisoned',
		description:
			'The creature has disadvantage on attack rolls and ability checks.',
		color: '#00FF00', // Green
	},
	blinded: {
		name: 'Blinded',
		description:
			'The creature cannot see and automatically fails any ability check that requires sight.',
		color: '#0000FF', // Blue
	},
	paralyzed: {
		name: 'Paralyzed',
		description: 'The creature is incapacitated and cannot move or speak.',
		color: '#FFFF00', // Yellow
	},
} as const satisfies Record<
	string,
	{
		name: string;
		description: string;
		color: string;
	}
>;

export type DebuffType = keyof typeof DebuffType;

export type Debuff = {
	duration?: number;
	notes?: string;
} & (
	| {
			kind: 'preset';
			type: DebuffType;
	  }
	| {
			kind: 'custom';
			name: string;
			description?: string;
			color: string;
	  }
);

export const Debuff = {
	of(type: DebuffType): Debuff {
		return {
			kind: 'preset',
			type,
		};
	},

	flat(debuff: Debuff): { name: string; color: string; notes?: string } {
		if (debuff.kind === 'preset') {
			const preset = DebuffType[debuff.type];
			return {
				name: preset.name,
				color: preset.color,
				notes: debuff.notes,
			};
		} else {
			return {
				name: debuff.name,
				color: debuff.color,
				notes: debuff.notes,
			};
		}
	},
};
