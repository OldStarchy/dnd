import sybilProfile from '@/components/InitiativeTable/fixtures/sybil_profile.png';
import { CreatureListContext } from '@/context/CreatureListContext';
import useJsonStorage from '@/hooks/useJsonStorage';
import type { Creature } from '@/type/Creature';
import { useMemo } from 'react';

declare global {
	interface LocalStorageKeys {
		'custom-characters': string;
	}
}

function LocalStorageCreatureListProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [creatures, setCreatures] = useJsonStorage<
		'custom-characters',
		Creature[]
	>('custom-characters', [
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
	]);

	const api = useMemo(
		() => ({
			list: async () => {
				return creatures;
			},
			get: async (id: string) => {
				return creatures.find((c) => c.id === id) || null;
			},
			save: async (id: string | null, creature: Omit<Creature, 'id'>) => {
				if (id !== null) {
					const existingIndex = creatures.findIndex(
						(c) => c.id === id,
					);
					if (existingIndex !== -1) {
						const updatedCreatures = [...creatures];
						updatedCreatures[existingIndex] = { ...creature, id };
						setCreatures(updatedCreatures);
						return true;
					}
					return false;
				} else {
					const newCreature = {
						...creature,
						id: crypto.randomUUID(),
					};
					setCreatures([...creatures, newCreature]);
					return true;
				}
			},
		}),
		[creatures, setCreatures],
	);

	return (
		<CreatureListContext.Provider value={api}>
			{children}
		</CreatureListContext.Provider>
	);
}

export default LocalStorageCreatureListProvider;
