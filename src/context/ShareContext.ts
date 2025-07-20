import {createContext} from 'react';

export const ShareContext = createContext<{roomCode: string} | null>(null);
