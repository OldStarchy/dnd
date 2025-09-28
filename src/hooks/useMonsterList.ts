import { useEffect, useState } from 'react';

import { dnd5eApi } from '@/dnd5eApi';

function useMonsterList() {
	const [monsters, setMonsters] = useState<
		{
			name: string;
			index: string;
		}[]
	>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchMonsters = async () => {
			try {
				const { data, error } =
					await dnd5eApi.GET('/api/2014/monsters');
				if (data) {
					setMonsters(
						data.results!.map((r) => ({
							name: r.name!,
							index: r.index!,
						})),
					);
				} else {
					console.error('No results found in the response: ', error);
				}
			} catch (error) {
				console.error('Error fetching monsters:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchMonsters();
	}, []);
	return { monsters, loading } as const;
}

export default useMonsterList;
