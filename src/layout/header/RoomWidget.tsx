import { Button } from '@/components/ui/button';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';
import useRoomActionsContext from '@/sync/react/hooks/useRoomActionsContext';
import useRoomContext from '@/sync/react/hooks/useRoomContext';
import type RoomApi from '@/sync/room/RoomApi';
import { Copy, Settings } from 'lucide-react';
import { Link } from 'react-router';

export default function RoomWidget() {
	const room = useRoomContext();
	const roomActions = useRoomActionsContext();

	if (room) {
		return <RoomWidgetInner room={room} />;
	} else {
		return (
			<Button
				onClick={() =>
					roomActions
						?.create({ name: 'My Room' })
						.catch(console.error)
				}
			>
				Create Room
			</Button>
		);
	}
}

function RoomWidgetInner({ room }: { room: RoomApi }) {
	const roomCode = useBehaviorSubject(room.code$);

	return (
		<>
			<span className="font-bold">
				{room.meta.data.getValue().name || 'Unnamed Room'}
			</span>
			<Link to="/room" title="Room Settings">
				<Button variant="outline" size="icon">
					<Settings />
				</Button>
			</Link>
			{roomCode && (
				<Button
					variant="outline"
					onClick={() => {
						navigator.clipboard
							.writeText(roomCode)
							.catch(console.error);
					}}
				>
					<code>{roomCode}</code>
					<Copy />
				</Button>
			)}
		</>
	);
}
