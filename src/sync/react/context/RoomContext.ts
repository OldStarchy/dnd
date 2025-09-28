import { createContext } from 'react';

import type RoomApi from '@/sync/room/RoomApi';

export const RoomContext = createContext<RoomApi | null>(null);
