import { CreatureListContext } from '@/context/CreatureListContext';
import { useContext } from 'react';

declare global {
	interface LocalStorageKeys {
		'custom-characters': string;
	}
}

function useCustomCreatureList() {
	const context = useContext(CreatureListContext);

	if (!context) {
		throw new Error(
			'useCustomCreatureList must be used within a CreatureListProvider',
		);
	}

	return context;
}

export default useCustomCreatureList;
