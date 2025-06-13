import type { Creature } from '@/type/Creature';
import useJsonStorage from './useJsonStorage';

function useCustomCreatureList() {
	return useJsonStorage<Creature[]>('dnd.creatures', [
		{
			id: '1',
			name: 'Sybil Snow',
			hp: 11,
			maxHp: 11,
		},
	]);
}

export default useCustomCreatureList;
