import {type TransportFactory} from '@/sync/Transport';
import {createContext} from 'react';

export const TransportContext = createContext<TransportFactory<string> | null>(
	null,
);
