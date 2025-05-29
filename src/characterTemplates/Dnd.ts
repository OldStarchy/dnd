import type { CharacterVariablesTemplate } from './CharacterVariablesTemplate';

const Ability = {
	STRENGTH: 'STRENGTH',
	DEXTERITY: 'DEXTERITY',
	CONSTITUTION: 'CONSTITUTION',
	INTELLIGENCE: 'INTELLIGENCE',
	WISDOM: 'WISDOM',
	CHARISMA: 'CHARISMA',
} as const;
type Ability = (typeof Ability)[keyof typeof Ability];

type RaceTraits = {
	abilityScoreIncrease: Partial<Record<Ability, number>>;
	ageOfAdulthood: number;
	size: 'small' | 'medium';
	speed: number;
	languages: string[];
	other: Trait[];
};

type AbilityTraits = Partial<
	Pick<RaceTraits, 'abilityScoreIncrease' | 'speed'>
>;

type TraitImpl = {
	id: string;
	name: string;
	description?: string; //todo;
	traits?: AbilityTraits;
};

const traits = [
	{
		id: 'DARKVISION',
		name: 'Darkvision',
		description:
			"You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.",
	},
	{
		id: 'TOOL_PROFICIENCY',
		name: 'Tool Proficiency',
		description:
			"You have Proficiency in choice of Smith's Tools, Brewer's Supplies, or Mason's Tools.",
	},
	{
		id: 'DWARVEN_RESILIENCE',
		name: 'Dwarven Resilience',
		description:
			'You have advantage on saving throws against poison, and you have resistance against poison damage.',
	},
	{
		id: 'DWARVEN_COMBAT_TRAINING',
		name: 'Dwarven Combat Training',
		description:
			'YOu have proficiency with the battleaxe, handaxe, light hammer, and warhammer.',
	},
	{
		id: 'STONECUNNING',
		name: 'Stonecunning',
		description:
			'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check, instead of your normal proficiency bonus.',
	},
	{
		id: 'DWARVEN_TOUGHNESS',
		name: 'Dwarven Toughness',
		description:
			'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.',
	},
	{
		id: 'DWARVEN_ARMOR_TRAINING',
		name: 'Dwarven Armor Training',
		description: 'You have proficiency with light and medium armor.',
	},
	{ id: 'KEEN_SENSES', name: 'Keen Senses' },
	{ id: 'FEY_ANCESTRY', name: 'Fey Ancestry' },
	{ id: 'TRANCE', name: 'Trance' },
	{ id: 'ELF_WEAPON_TRAINING', name: 'Elf Weapon Training' },
	{ id: 'CANTRIP', name: 'Cantrip' },
	{ id: 'EXTRA_LANGUAGE', name: 'Extra Language' },
	{ id: 'ELF_WEAPON_TRAINING', name: 'Elf Weapon Training' },
	{ id: 'FLEET_OF_FOOT', name: 'Fleet of Foot' },
	{ id: 'MASK_OF_THE_WILD', name: 'Mask of the Wild' },
	{ id: 'SUPERIOR_DARKVISION', name: 'Superior Darkvision' },
	{ id: 'SUNLIGHT_SENSITIVITY', name: 'Sunlight Sensitivity' },
	{ id: 'DROW_MAGIC', name: 'Drow Magic' },
	{ id: 'DROW_WEAPON_TRAINING', name: 'Drow Weapon Training' },
] as const satisfies TraitImpl[];

type Trait = (typeof traits)[number]['id'];
const Trait = Object.fromEntries(traits.values().map((v) => [v.id, v.id])) as {
	[K in Trait]: K;
};

type RaceImpl = {
	name: string;
	traits: RaceTraits;
	subraces: SubraceImpl[];
};

type SubraceImpl = {
	name: string;
	traits: Partial<RaceImpl['traits']>;
};

const InformationSource = {
	PLAYERS_HANDBOOK_5e_2018: 'PLAYERS_HANDBOOK_5e_2018',
} as const;
type InformationSource = keyof typeof InformationSource;

type RaceInformation = {
	race: RaceImpl;
	source: InformationSource;
};

const races: RaceInformation[] = (
	[
		{
			name: 'Dwarf',
			traits: {
				abilityScoreIncrease: { [Ability.CONSTITUTION]: 2 },
				ageOfAdulthood: 50,
				size: 'medium',
				speed: 25,
				other: [
					Trait.DARKVISION,
					Trait.DWARVEN_RESILIENCE,
					Trait.DWARVEN_COMBAT_TRAINING,
					Trait.TOOL_PROFICIENCY,
					Trait.STONECUNNING,
				],
				languages: ['Common', 'Dwarvish'],
			},
			subraces: [
				{
					name: 'Hill Dwarf',
					traits: {
						abilityScoreIncrease: { [Ability.WISDOM]: 1 },
						other: Trait.DWARVEN_TOUGHNESS,
					},
				},
				{
					name: 'Mountain Dwarf',
					traits: {
						abilityScoreIncrease: { [Ability.STRENGTH]: 2 },
						other: [Trait.DWARVEN_ARMOR_TRAINING],
					},
				},
			],
		},
		{
			name: 'Elf',
			traits: {
				abilityScoreIncrease: { [Ability.DEXTERITY]: 2 },
				ageOfAdulthood: 100,
				size: 'medium',
				speed: 30,
				languages: ['Common', 'Elvish'],
				other: [
					Trait.DARKVISION,
					Trait.KEEN_SENSES,
					Trait.FEY_ANCESTRY,
					Trait.TRANCE,
				],
			},
			subraces: [
				{
					name: 'High Elf',
					traits: {
						abilityScoreIncrease: { [Ability.INTELLIGENCE]: 1 },
						other: [
							Trait.ELF_WEAPON_TRAINING,
							Trait.CANTRIP,
							Trait.EXTRA_LANGUAGE,
						],
					},
				},
				{
					name: 'Wood Elf',
					traits: {
						abilityScoreIncrease: { [Ability.WISDOM]: 1 },
						other: [
							Trait.ELF_WEAPON_TRAINING,
							Trait.FLEET_OF_FOOT,
							Trait.MASK_OF_THE_WILD,
						],
					},
				},
				{
					name: 'Dark Elf (Drow)',
					traits: {
						abilityScoreIncrease: { [Ability.CHARISMA]: 1 },
						other: [
							Trait.SUPERIOR_DARKVISION,
							Trait.SUNLIGHT_SENSITIVITY,
							Trait.DROW_MAGIC,
							Trait.DROW_WEAPON_TRAINING,
						],
					},
				},
			],
		},
	] as RaceImpl[]
).map((race) => ({
	race,
	source: InformationSource.PLAYERS_HANDBOOK_5e_2018,
}));

type Race = (typeof races)[number]['race']['name'];
const Race = Object.fromEntries(
	races.map((r) => r.race.name).map((r) => [r, r]),
) as { [K in Race]: K };

console.log(races);
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
