import { createContext } from 'react';

import type RoomHost from '@/sync/room/RoomHost';

export const RoomHostContext = createContext<RoomHost | null>(null);
