import { BackendApi } from '@/sync/BackendApi';
import { createContext } from 'react';

export const BackendApiContext = createContext<BackendApi | null>(null);
