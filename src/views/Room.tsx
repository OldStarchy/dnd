import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';
import useCollectionQuery from '@/hooks/useCollectionQuery';
import Logger from '@/lib/log';
import useRoomActionsContext from '@/sync/react/hooks/useRoomActionsContext';
import useRoomContext from '@/sync/react/hooks/useRoomContext';
import { useRoomHost } from '@/sync/react/hooks/useRoomHost';
import RemoteRoom from '@/sync/room/RemoteRoom';
import Room from '@/sync/room/Room';
import type RoomApi from '@/sync/room/RoomApi';
import { RoomCode } from '@/sync/room/types';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

function RoomView() {
	const room = useRoomContext();
	const roomActions = useRoomActionsContext();

	const roomHost = useRoomHost();

	const newRoomNameRef = useRef<HTMLInputElement>(null);
	const roomCodeRef = useRef<HTMLInputElement>(null);

	const navigate = useNavigate();

	const [error, setError] = useState('');

	const handleError = (err: unknown) => {
		Logger.error('RoomView Error:', err);
		setError(() => `${err instanceof Error ? err.message : err}`);
	};

	const [name, setNameImpl] = useState('');

	useEffect(() => {
		if (room) {
			setNameImpl(room.me.data.getValue().name);
		} else {
			setNameImpl('');
		}
	}, [room]);

	useEffect(() => {
		if (!room) return;

		const sub = room.me.data.subscribe({
			next: (data) => {
				setNameImpl(data.name);
			},
		});

		return () => sub.unsubscribe();
	}, [room]);

	const setName = async (name: string) => {
		if (room) {
			await room.me.update({ merge: { name: { replace: name } } });
		}
	};

	return (
		<div>
			<div className="text-red-600">{error}</div>
			{room ? (
				<>
					{room instanceof Room ? (
						<LocalRoomView room={room} handleError={handleError} />
					) : room instanceof RemoteRoom ? (
						<GenericRoomView
							room={room}
							handleError={handleError}
						/>
					) : null}

					<Button onClick={() => roomActions.close()}>
						Close Room
					</Button>

					<Input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Your Name"
					/>
				</>
			) : (
				<>
					<p>No Room Exists</p>
					<Input
						type="text"
						ref={newRoomNameRef}
						placeholder="Room Name"
					/>
					<Button
						onClick={() =>
							roomActions.create({
								name:
									newRoomNameRef.current!.value || 'My Room',
							})
						}
					>
						Create a room
					</Button>
					<Separator />
					<Input
						type="text"
						ref={roomCodeRef}
						placeholder="Room Code"
					/>
					<Button
						onClick={() =>
							roomActions.join(
								roomHost,
								RoomCode(roomCodeRef.current!.value),
							)
						}
					>
						Join Room
					</Button>
				</>
			)}
		</div>
	);
}

export default RoomView;

function LocalRoomView({
	room,
	handleError,
}: {
	room: Room;
	handleError: (err: unknown) => void;
}) {
	const roomHost = useRoomHost();

	const hosts = useBehaviorSubject(room.hosts$);

	const members = useCollectionQuery(room.members);

	return (
		<>
			<p>Local Room "{room.meta.data.getValue().name}"</p>
			{hosts.size === 0 ? (
				<>
					<p>Not published</p>

					<Button
						onClick={() =>
							room.publish(roomHost).catch(handleError)
						}
					>
						Publish to {roomHost.host}
					</Button>
				</>
			) : (
				[...hosts.entries()].map(([host, publication]) => {
					return (
						<p key={host}>
							Published to {host} with code {publication.roomCode}
						</p>
					);
				})
			)}

			<GenericRoomView room={room} handleError={handleError} />
		</>
	);
}

function GenericRoomView({
	room,
	handleError,
}: {
	room: RoomApi;
	handleError: (err: unknown) => void;
}) {
	const roomHost = useRoomHost();

	const meta = useBehaviorSubject(room.meta.data);
	const members = useCollectionQuery(room.members);

	return (
		<>
			<p>Remote Room "{meta.name}"</p>

			{members.length > 0 && (
				<>
					<h3>Members</h3>
					<ul>
						{members.map((member) => (
							<li
								key={member.id}
								title={member.id}
								className="pl-2"
							>
								{member.name}:{' '}
								<span className="text-rose-300">
									{member.id}
								</span>
								<ul>
									{member.identities.map((id) => (
										<li key={id.host} className="pl-2">
											<span className="text-indigo-300">
												{id.id}
											</span>
										</li>
									))}
								</ul>
							</li>
						))}
					</ul>
				</>
			)}
		</>
	);
}
