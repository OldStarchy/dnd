import { CreatureListContext } from '@/context/CreatureListContext';
import useLocalStorageCreatureList from '@/hooks/useLocalStorageCreatureList';
import { applyChangeset, type Merge } from '@/lib/changeSet';
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
	const [creatures, setCreatures] = useLocalStorageCreatureList();

	const api = useMemo(
		() => ({
			list: async () => {
				return creatures;
			},
			get: async (id: string) => {
				return creatures.find((c) => c.id === id) || null;
			},
			update: async (
				id: string,
				creature: Merge<Omit<Creature, 'id'>>['merge'],
			) => {
				const existingIndex = creatures.findIndex((c) => c.id === id);
				if (existingIndex !== -1) {
					const updatedCreatures = [...creatures];
					updatedCreatures[existingIndex] = applyChangeset(
						updatedCreatures[existingIndex],
						{ merge: creature },
					);
					setCreatures(updatedCreatures);
					return true;
				}
				return false;
			},
			create: async (creature: Omit<Creature, 'id'>) => {
				const newCreature = {
					...creature,
					id: crypto.randomUUID(),
				};
				setCreatures([...creatures, newCreature]);
				return true;
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
