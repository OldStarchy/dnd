import type { CharacterVariablesTemplate } from './CharacterVariablesTemplate';

const Attribute = {
	STR: 'STR',
	DEX: 'DEX',
	CON: 'CON',
	INT: 'INT',
	WIS: 'WIS',
	CHA: 'CHA',
	STR_MOD: 'STR_MOD',
	DEX_MOD: 'DEX_MOD',
	CON_MOD: 'CON_MOD',
	INT_MOD: 'INT_MOD',
	WIS_MOD: 'WIS_MOD',
	CHA_MOD: 'CHA_MOD',
	HEALTH: 'HEALTH',
	MAX_HEALTH: 'MAX_HEALTH',
	INITIAL_HEALTH: 'INITIAL_HEALTH',
};

type Attribute = (typeof Attribute)[keyof typeof Attribute];

const template: CharacterVariablesTemplate = {
	[Attribute.STR]: {
		formula: '10',
		description: 'Strength',
	},
	[Attribute.DEX]: {
		formula: '10',
		description: 'Dexterity',
	},
	[Attribute.CON]: {
		formula: '10',
		description: 'Constitution',
	},
	[Attribute.INT]: {
		formula: '10',
		description: 'Intelligence',
	},
	[Attribute.WIS]: {
		formula: '10',
		description: 'Wisdom',
	},
	[Attribute.CHA]: {
		formula: '10',
		description: 'Charisma',
	},
	[Attribute.HEALTH]: {
		formula: '10',
		description: 'Current health',
	},
	[Attribute.MAX_HEALTH]: {
		formula: '10',
		description: 'Maximum health',
	},
	LEVEL: {
		formula: '1',
		description: 'Level of the character',
	},
	[Attribute.INITIAL_HEALTH]: {
		formula: 'LEVEL * (d(6) + CON_MOD)',
		description: 'Initial health',
	},
};

for (const attr of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const) {
	const mod = `${attr}_MOD` as Attribute;
	template[mod] = {
		formula: `floor((${attr} - 10) / 2)`,
		description: `Modifier for ${template[attr].description}. Add this to the results of associated rolls`,
	};
}

export const Dnd = {
	Attribute,
	template,
};
