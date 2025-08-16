import type RoomApi from '@/sync/room/RoomApi';
import { createContext } from 'react';

export const RoomContext = createContext<RoomApi | null>(null);
