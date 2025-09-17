import useRoomSession from '@/hooks/room/useRoomSession';
import { useLocalConfig } from '@/hooks/useLocalConfig';
import { RoomActionsContext } from '@/sync/react/context/RoomActionsContext';
import RemoteRoom from '@/sync/room/RemoteRoom';
import Room from '@/sync/room/Room';
import type RoomApi from '@/sync/room/RoomApi';
import RoomHost from '@/sync/room/RoomHost';
import {
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { filter, take } from 'rxjs';
import { RoomContext } from '../context/RoomContext';

const Provider = RoomActionsContext.Provider;
const RoomProvider = RoomContext.Provider;

export default function RoomActionsContextProvider({
	children,
}: {
	children: ReactNode;
}) {
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
		return RemoteRoom.join(...args).then((room) => {
			setRoom(room);
			room.connection.state$
				.pipe(
					filter((state) => state === 'closed'),
					take(1),
				)
				.subscribe(() => setRoom(null));
		});
	}, []);

	const rejoin = useCallback(
		(...args: Parameters<typeof RemoteRoom.reconnect>) => {
			return RemoteRoom.reconnect(...args).then((room) => {
				setRoom(room);
				room.connection.state$
					.pipe(
						filter((state) => state === 'closed'),
						take(1),
					)
					.subscribe(() => setRoom(null));
			});
		},
		[],
	);

	const close = useCallback(async () => {
		if (room instanceof Room) await room.close();

		if (room instanceof RemoteRoom) await room.leave();

		setRoom(null);
	}, [room]);

	return (
		<Provider value={{ create, reconnect, join, rejoin, close }}>
			<RoomProvider value={room}>
				<ReloadRoomOnLoad />
				{children}
			</RoomProvider>
		</Provider>
	);
}

function ReloadRoomOnLoad() {
	const roomActions = useContext(RoomActionsContext);
	const room = useContext(RoomContext);
	const [session] = useRoomSession();
	const [localConfig] = useLocalConfig();

	const once = useRef(false);

	useEffect(() => {
		if (once.current) return;
		once.current = true;

		if (!localConfig.reconnectOnPageLoad) return;
		if (!roomActions) return;
		if (room) return;
		if (session.lastRoom === null) return;

		const lastRoom = session.lastRoom;
		(async () => {
			if (lastRoom.type === 'hosted') {
				await roomActions.reconnect(
					RoomHost.get(lastRoom.host),
					lastRoom.membershipToken,
				);
			} else if (lastRoom.type === 'joined') {
				await roomActions.rejoin(
					RoomHost.get(lastRoom.host),
					lastRoom.membershipToken,
				);
			}
		})();
	}, [roomActions, room, session.lastRoom, localConfig.reconnectOnPageLoad]);

	return null;
}
