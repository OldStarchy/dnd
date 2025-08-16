import type { Merge } from '@/lib/changeSet';
import type { Creature } from '@/type/Creature';
import { createContext } from 'react';

export const CreatureListContext = createContext<{
	list(): Promise<Creature[]>;
	get(id: string): Promise<Creature | null>;
	update: (
		id: string,
		creature: Merge<Omit<Creature, 'id'>>['merge'],
	) => Promise<boolean>;
	create: (creature: Omit<Creature, 'id'>) => Promise<boolean>;
} | null>(null);
