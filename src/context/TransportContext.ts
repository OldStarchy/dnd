import { type Transport } from '@/sync/Transport';
import { createContext } from 'react';

export const TranpsortContext = createContext<Transport<string> | null>(null);
