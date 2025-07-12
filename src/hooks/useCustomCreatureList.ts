import sybilProfile from '@/components/InitiativeTable/fixtures/sybil_profile.png';
import type { Creature } from '@/type/Creature';
import type { Dispatch, SetStateAction } from 'react';
import useJsonStorage from './useJsonStorage';

declare global {
	interface LocalStorageKeys {
		'custom-characters': string;
	}
}

function useCustomCreatureList(): [
	Creature[],
	Dispatch<SetStateAction<Creature[]>>,
] {
	return useJsonStorage<'custom-characters', Creature[]>(
		'custom-characters',
		[
			{
				id: crypto.randomUUID(),
				name: 'Sybil Snow',
				race: 'Human',
				images: [sybilProfile],
				notes: "Sybil is a cool chick who doesn't afraid of anything.",
				hp: 11,
				maxHp: 11,
				debuffs: [],
				ac: 10,
				speed: { walk: '30 ft.' },
				attributes: {
					strength: 16,
					dexterity: 10,
					constitution: 12,
					intelligence: 16,
					wisdom: 11,
					charisma: 12,
				},
			},
		],
	);
}

export default useCustomCreatureList;
