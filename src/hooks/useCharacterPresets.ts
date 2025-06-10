import useJsonStorage from './useJsonStorage';

export type Character = {
	id: string;
	name: string;
	health: number;
	maxHealth: number;
};

function useCharacterPresets() {
	return useJsonStorage<Character[]>('dnd.characters', [
		{
			id: '1',
			name: 'Hero One',
			health: 100,
			maxHealth: 100,
		},
		{
			id: '2',
			name: 'Hero Two',
			health: 80,
			maxHealth: 100,
		},
	]);
}

export default useCharacterPresets;
