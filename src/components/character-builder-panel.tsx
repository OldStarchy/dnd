import {useMemo, useReducer} from 'react';
import {Input} from './ui/input';
import {Label} from './ui/label';

type CharacterState = {
	race: string;
	classes: {
		[name: string]: number;
	};

	strength: number;
	dexterity: number;
	constitution: number;
	intelligence: number;
	wisdom: number;
	charisma: number;

	inspiration: number;

	proficiencyBonus: number;

	armorClass: number;
	initiative: number;
	speed: number;

	acrobatics: number;
	animalHandling: number;
	arcana: number;
	athletics: number;
	deception: number;
	history: number;
	insight: number;
	intimidation: number;
	investigation: number;
	medicine: number;
	nature: number;
	perception: number;
	performance: number;
	persuasion: number;
	religion: number;
	sleightOfHand: number;
	stealth: number;
	survival: number;
};

type ClassAttributes = {
	[name: string]: {
		level: number;
		hitDie: number;
		savingThrows: {
			[name: string]: number;
		};
		skills: {
			[name: string]: number;
		};
	};
};
type RaceAttributes = {
	[name: string]: {
		speed: number;
		abilityScoreIncrease: {
			[name: string]: number;
		};
		skills: {
			[name: string]: number;
		};
		languages: string[];
	};
};
type BackgroundAttributes = {
	[name: string]: {
		languages: string[];
		skills: {
			[name: string]: number;
		};
		equipment: {
			[name: string]: number;
		};
		tools: {
			[name: string]: number;
		};
		features: {
			[name: string]: number;
		};
	};
};
type EquipmentAttributes = {
	[name: string]: {
		weight: number;
		cost: number;
		damage: {
			[name: string]: number;
		};
		range: {
			[name: string]: number;
		};
		properties: {
			[name: string]: number;
		};
		features: {
			[name: string]: number;
		};
	};
}

type DerivedCharacterState = {
	strengthModifier: number;
	dexterityModifier: number;
	constitutionModifier: number;
	intelligenceModifier: number;
	wisdomModifier: number;
	charismaModifier: number;

	acrobaticsModifier: number;
	animalHandlingModifier: number;
	arcanaModifier: number;
	athleticsModifier: number;
	deceptionModifier: number;
	historyModifier: number;
	insightModifier: number;
	intimidationModifier: number;
	investigationModifier: number;
	medicineModifier: number;
	natureModifier: number;
	perceptionModifier: number;
	performanceModifier: number;
	persuasionModifier: number;
	religionModifier: number;
	sleightOfHandModifier: number;
	stealthModifier: number;
	survivalModifier: number;
};

function calculateDerivedCharacterState(state: CharacterState): DerivedCharacterState {
	return {
		strengthModifier: Math.floor((state.strength - 10) / 2),
		dexterityModifier: Math.floor((state.dexterity - 10) / 2),
		constitutionModifier: Math.floor((state.constitution - 10) / 2),
		intelligenceModifier: Math.floor((state.intelligence - 10) / 2),
		wisdomModifier: Math.floor((state.wisdom - 10) / 2),
		charismaModifier: Math.floor((state.charisma - 10) / 2),
	}
}




type CharacterAction =
	| { type: 'SET_ATTRIBUTE'; attribute: keyof CharacterState; value: number }
	| { type: 'RESET_ATTRIBUTES' };

function characterReducer(state: CharacterState, action: CharacterAction) {
	switch (action.type) {
		case 'SET_ATTRIBUTE':
			return {
				...state,
				[action.attribute]: action.value,
			};
		case 'RESET_ATTRIBUTES':
			return {
				STR: 10,
				DEX: 10,
				CON: 10,
				INT: 10,
				WIS: 10,
				CHA: 10,
			};
		default:
			return state;
	}
}

function CharacterBuilderPanel() {
	const [character, dispatch] = useReducer(characterReducer, {
		strength: 10,
		dexterity: 10,
		constitution: 10,
		intelligence: 10,
		wisdom: 10,
		charisma: 10,
	});

	const mods = useMemo(
		() => ({
			STR_MOD: Math.floor((character.strength - 10) / 2),
			DEX_MOD: Math.floor((character.dexterity - 10) / 2),
			CON_MOD: Math.floor((character.constitution - 10) / 2),
			INT_MOD: Math.floor((character.intelligence - 10) / 2),
			WIS_MOD: Math.floor((character.wisdom - 10) / 2),
			CHA_MOD: Math.floor((character.charisma - 10) / 2),
		}),
		[character],
	);

	return (
		<div>
			<h2>Character Builder</h2>
			<p>Build your character here!</p>

			<div className="flex gap-2">
				<div>
					{Object.entries(character).map(([key, value]) => (
						<div key={key} className="attribute">
							<Label htmlFor={key}>{key}</Label>
							<Input
								type="number"
								value={value}
								onChange={(e) =>
									dispatch({
										type: 'SET_ATTRIBUTE',
										attribute: key as keyof CharacterState,
										value: Number(e.target.value),
									})
								}
							/>
						</div>
					))}
				</div>
				<div>
					{Object.entries(mods).map(([key, value]) => (
						<div key={key} className="attribute">
							<Label htmlFor={key}>{key}</Label>
							<Input type="number" value={value} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default CharacterBuilderPanel;
