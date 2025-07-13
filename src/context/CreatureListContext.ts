import type { Creature } from '@/type/Creature';
import { createContext } from 'react';

export const CreatureListContext = createContext<{
	list(): Promise<Creature[]>;
	get(id: string): Promise<Creature | null>;
	save: (
		id: string | null,
		creature: Omit<Creature, 'id'>,
	) => Promise<boolean>;
} | null>(null);
