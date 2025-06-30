export const DebuffType = {
	stunned: {
		name: 'Stunned',
		description:
			'The creature is incapacitated and can only take actions that do not require movement.',
		color: 'bg-red-500',
	},
	poisoned: {
		name: 'Poisoned',
		description:
			'The creature has disadvantage on attack rolls and ability checks.',
		color: 'bg-green-500',
	},
	blinded: {
		name: 'Blinded',
		description:
			'The creature cannot see and automatically fails any ability check that requires sight.',
		color: 'bg-blue-500',
	},
	paralyzed: {
		name: 'Paralyzed',
		description: 'The creature is incapacitated and cannot move or speak.',
		color: 'bg-yellow-500',
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

	flat(debuff: Debuff): {
		name: string;
		color: string;
		description?: string;
		notes?: string;
	} {
		if (debuff.kind === 'preset') {
			const preset = DebuffType[debuff.type];
			return {
				name: preset.name,
				color: preset.color,
				description: preset.description,
				notes: debuff.notes,
			};
		} else {
			return {
				name: debuff.name,
				color: debuff.color,
				description: debuff.description,
				notes: debuff.notes,
			};
		}
	},
};
