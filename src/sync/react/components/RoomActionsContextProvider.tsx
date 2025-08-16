import { RoomActionsContext } from '@/sync/react/context/RoomActionsContext';
import RemoteRoom from '@/sync/room/RemoteRoom';
import Room from '@/sync/room/Room';
import type RoomApi from '@/sync/room/RoomApi';
import { useCallback, useState, type ReactNode } from 'react';
import { RoomContext } from '../context/RoomContext';
import { useRoomHost } from '../hooks/useRoomHost';

const Provider = RoomActionsContext.Provider;
const RoomProvider = RoomContext.Provider;

export default function RoomActionsContextProvider({
	children,
}: {
	children: ReactNode;
}) {
	const host = useRoomHost();
	const [room, setRoom] = useState<RoomApi | null>(null);

	const create = useCallback((...args: Parameters<typeof Room.create>) => {
		return Room.create(...args).then(setRoom);
	}, []);

	const reconnect = useCallback(
		(...args: Parameters<typeof Room.reconnect>) => {
			return Room.reconnect(...args).then(setRoom);
		},
		[],
	);

	const join = useCallback((...args: Parameters<typeof RemoteRoom.join>) => {
		return RemoteRoom.join(...args).then(setRoom);
	}, []);

	const rejoin = useCallback(
		(...args: Parameters<typeof RemoteRoom.reconnect>) => {
			return RemoteRoom.reconnect(...args).then(setRoom);
		},
		[],
	);

	const close = useCallback(async () => {
		if (room instanceof Room) await room.close();

		setRoom(null);
	}, [room]);

	return (
		<Provider value={{ create, reconnect, join, rejoin, close }}>
			<RoomProvider value={room}>{children}</RoomProvider>
		</Provider>
	);
}
