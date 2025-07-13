import { type TransportFactory } from '@/sync/Transport';
import { createContext } from 'react';

export const TranpsortContext = createContext<TransportFactory<string> | null>(
	null,
);
