import type { ClientHandler } from '@/sync/RemoteClient';
import { createContext } from 'react';

export const ClientContext = createContext<Partial<ClientHandler> | null>(null);
