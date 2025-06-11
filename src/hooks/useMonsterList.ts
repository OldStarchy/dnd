import { Dnd5eApi } from '@/generated/dnd5eapi/Dnd5eApi';
import { useEffect, useState } from 'react';

const api = new Dnd5eApi();
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
				const response = await api.api._2014Detail('monsters');
				if (response.ok && response.data) {
					setMonsters(
						response.data.results!.map((r) => ({
							name: r.name!,
							index: r.index!,
						})),
					);
				} else {
					console.error('No results found in the response');
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
