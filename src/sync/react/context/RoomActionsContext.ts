import type RemoteRoom from '@/sync/room/RemoteRoom';
import type Room from '@/sync/room/Room';
import { createContext } from 'react';

export const RoomActionsContext = createContext<{
	create: (...args: Parameters<typeof Room.create>) => Promise<void>;
	reconnect: (...args: Parameters<typeof Room.reconnect>) => Promise<void>;
	join: (...args: Parameters<typeof RemoteRoom.join>) => Promise<void>;
	rejoin: (...args: Parameters<typeof RemoteRoom.reconnect>) => Promise<void>;
	close: () => Promise<void>;
} | null>(null);
