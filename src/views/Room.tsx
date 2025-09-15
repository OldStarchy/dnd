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
import RoomHost from '@/sync/room/RoomHost';
import { RoomCode } from '@/sync/room/types';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function RoomView() {
	const room = useRoomContext();
	const roomActions = useRoomActionsContext();

	const roomHost = useRoomHost();

	const newRoomNameRef = useRef<HTMLInputElement>(null);
	const roomCodeRef = useRef<HTMLInputElement>(null);

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
						<GenericRoomView room={room} />
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
	const [enteredRoomHost, setEnteredRoomHost] = useState(roomHost.host);

	const hosts = useBehaviorSubject(room.hosts$);

	return (
		<>
			<p>Local Room "{room.meta.data.getValue().name}"</p>
			<ul className="ml-2">
				{[...hosts.entries()].map(([host, publication]) => {
					return (
						<li key={host}>
							Published to {host} with code {publication.roomCode}
						</li>
					);
				})}

				<li>
					<div className="flex gap-2">
						<Input
							type="text"
							value={enteredRoomHost}
							onChange={(e) => setEnteredRoomHost(e.target.value)}
						/>
						<Button
							variant="outline"
							onClick={() => setEnteredRoomHost(roomHost.host)}
							disabled={enteredRoomHost === roomHost.host}
						>
							<RefreshCcw />
						</Button>
						<Button
							onClick={() =>
								room
									.publish(RoomHost.get(enteredRoomHost))
									.catch(handleError)
							}
							disabled={
								enteredRoomHost.length === 0 ||
								hosts.has(enteredRoomHost)
							}
						>
							{hosts.has(enteredRoomHost)
								? 'Already Published'
								: 'Publish'}
						</Button>
					</div>
				</li>
			</ul>

			<GenericRoomView room={room} />
		</>
	);
}

function GenericRoomView({ room }: { room: RoomApi }) {
	const meta = useBehaviorSubject(room.meta.data);
	const members = useCollectionQuery(room.db.member);

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
												{id.id}{' '}
												{id.online
													? '(Online)'
													: '(Offline)'}
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
