import type RemoteRoom from '@/sync/room/RemoteRoom';
import type Room from '@/sync/room/Room';
import { createContext } from 'react';

export const RoomContext = createContext<Room | RemoteRoom | null>(null);
