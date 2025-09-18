import { AsyncResult } from '@/lib/AsyncResult';
import type { Result } from '@/lib/Result';
import type RemoteRoom from '@/sync/room/RemoteRoom';
import type Room from '@/sync/room/Room';
import { createContext } from 'react';

export const RoomActionsContext = createContext<{
	create: (...args: Parameters<typeof Room.create>) => Promise<void>;
	reconnect: (
		...args: Parameters<typeof Room.reconnect>
	) => AsyncResult<void, Result.InferErr<typeof Room.reconnect>>;
	join: (
		...args: Parameters<typeof RemoteRoom.join>
	) => AsyncResult<void, Result.InferErr<typeof RemoteRoom.join>>;
	rejoin: (
		...args: Parameters<typeof RemoteRoom.reconnect>
	) => AsyncResult<void, Result.InferErr<typeof RemoteRoom.reconnect>>;
	close: () => Promise<void>;
} | null>(null);
