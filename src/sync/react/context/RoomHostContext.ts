import type RoomHost from '@/sync/room/RoomHost';
import { createContext } from 'react';

export const RoomHostContext = createContext<RoomHost | null>(null);
