import { CreatureListContext } from '@/context/CreatureListContext';
import useClient from '@/hooks/useClient';
import type { Merge } from '@/lib/changeSet';
import type { Creature } from '@/type/Creature';
import { useMemo } from 'react';

function RemoteCreatureListProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const remote = useClient();

	const api = useMemo(() => {
		if (!remote) {
			return null;
		}
		return {
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
			update: async (
				id: string | null,
				creature: Merge<Omit<Creature, 'id'>>['merge'],
			) => {
				return (await remote.request({
					type: 'creature-save',
					id,
					data: creature,
				})) as boolean;
			},

			create: async (creature: Omit<Creature, 'id'>) => {
				return (await remote.request({
					type: 'creature-save',
					data: creature,
				})) as boolean;
			},
		};
	}, [remote]);

	return (
		<CreatureListContext.Provider value={api}>
			{children}
		</CreatureListContext.Provider>
	);
}

export default RemoteCreatureListProvider;
