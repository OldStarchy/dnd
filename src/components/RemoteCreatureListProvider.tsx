import { CreatureListContext } from '@/context/CreatureListContext';
import { useClient } from '@/hooks/useClient';
import type { Creature } from '@/type/Creature';
import { useMemo } from 'react';

function RemoteCreatureListProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const remote = useClient();

	const api = useMemo(
		() => ({
			list: async () => {
				return (await remote.request({
					type: 'creature-list',
				})) as Creature[];
			},
			get: async (id: string) => {
				return (await remote.request({
					type: 'creature-get',
					id,
				})) as Creature | null;
			},
			save: async (id: string | null, creature: Omit<Creature, 'id'>) => {
				return (await remote.request({
					type: 'creature-save',
					id,
					data: creature,
				})) as boolean;
			},
		}),
		[remote],
	);

	return (
		<CreatureListContext.Provider value={api}>
			{children}
		</CreatureListContext.Provider>
	);
}

export default RemoteCreatureListProvider;
