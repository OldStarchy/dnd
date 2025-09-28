import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import useRoomSession from '@/hooks/room/useRoomSession';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';
import useCollectionQuery from '@/hooks/useCollectionQuery';
import Logger from '@/lib/log';
import useRoomContext from '@/sync/react/context/room/useRoomContext';
import useRoomActionsContext from '@/sync/react/context/roomActions/useRoomActionsContext';
import { useRoomHost } from '@/sync/react/context/roomHost/useRoomHost';
import RemoteRoom from '@/sync/room/RemoteRoom';
import Room from '@/sync/room/Room';
import type RoomApi from '@/sync/room/RoomApi';
import RoomHost from '@/sync/room/RoomHost';
import { RoomCode } from '@/sync/room/types';

/**
 * This page allows creating, publishing, or joining a room, as well as managing
 * room metadata and members when the room is published.
 */
function RoomConfigurator() {
	const room = useRoomContext();
	const roomActions = useRoomActionsContext();
	const [roomSession, setRoomSession] = useRoomSession();
	const roomHost = useRoomHost();

	const [joinRoomCode, setJoinRoomCode] = useState('');

	const [error, setError] = useState<string | null>(null);

	const mounted = useRef(false);
	useEffect(() => {
		if (mounted.current) return;
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, []);

	const displayError = useCallback((err: string) => {
		Logger.error('RoomView Error:', err);
		if (!mounted.current) return;

		setError(err);
	}, []);

	if (!room) {
		return (
			<div>
				{error && (
					<Label>
						<AlertTriangle /> {error}
					</Label>
				)}
				You're not currently in a room.
				{roomSession.lastRoom !== null &&
					(roomSession.lastRoom.type === 'hosted' ? (
						<div>
							<p>
								You have an existing session token for a room
								you hosted.
							</p>
							<p>
								Previously hosted "{roomSession.lastRoom.name}"
								at {roomSession.lastRoom.host} with code{' '}
								<code>{roomSession.lastRoom.code}</code>
							</p>
							<Button
								onClick={() =>
									roomActions
										.reconnect(
											roomHost,
											roomSession.lastRoom!
												.membershipToken,
										)
										.inspectErr((err) =>
											Logger.error(
												'Reconnect failed',
												err,
											),
										)
										.mapErr((error) => {
											switch (error) {
												case 'invalid_token':
												case 'not_found':
													return 'The session on the room server no longer exists. You can still rehost the same room, but the room code will change and you will need to reassign roles.';

												case 'missing_room_meta':
													return 'The room you hosted no longer exists. Create a new room to host.';

												default:
													return error.message;
											}
										})
										.unwrapOrElse(displayError)
								}
							>
								Rehost
							</Button>
						</div>
					) : (
						<div>
							<p>
								You have an existing session token from a
								session you joined that might still be valid,
								you can try reconnecting.
							</p>
							<p>
								Previously Joined "{roomSession.lastRoom.name}"
								at {roomSession.lastRoom.host} with code{' '}
								<code>{roomSession.lastRoom.code}</code>
							</p>
							<Button
								onClick={() =>
									roomActions
										.rejoin(
											roomHost,
											roomSession.lastRoom!
												.membershipToken,
										)
										.inspectErr((err) =>
											Logger.error('Rejoin failed', err),
										)
										.mapErr((error) => {
											switch (error) {
												case 'invalid_token':
												case 'not_found':
													return 'The room no longer exists.';

												case 'missing_room_meta':
													return 'The host did not provide room metadata.';

												default:
													return error.message;
											}
										})
										.unwrapOrElse(displayError)
								}
							>
								Rejoin
							</Button>
						</div>
					))}
				<div>
					<Button
						onClick={() => roomActions.create({ name: 'My Room' })}
					>
						Create Room
					</Button>
					<p>
						you can publish it so others can join in the next step
					</p>
				</div>
				<div>
					<Input
						type="text"
						placeholder="Room Code"
						value={joinRoomCode}
						onChange={(e) => setJoinRoomCode(e.target.value)}
					/>
					<Button
						onClick={() =>
							roomActions
								.join(roomHost, RoomCode(joinRoomCode))
								.inspectErr((error) =>
									Logger.error('Join failed', error),
								)
								.mapErr((error) => {
									switch (error) {
										case 'invalid_token':
										case 'not_found':
											return 'The room code you entered was not found.';

										case 'missing_room_meta':
											return 'The host did not provide room metadata.';

										default:
											return error.message;
									}
								})
								.unwrapOrElse(displayError)
						}
					>
						Join Room
					</Button>
					<p>
						if you have a room code, enter it above to join an
						existing room
					</p>
				</div>
			</div>
		);
	}

	return <RoomConfiguratorInner handleError={displayError} />;
}
function RoomConfiguratorInner({
	handleError,
}: {
	handleError: (err: string) => void;
}) {
	const room = useRoomContext();
	const roomActions = useRoomActionsContext();

	const roomHost = useRoomHost();

	const newRoomNameRef = useRef<HTMLInputElement>(null);
	const roomCodeRef = useRef<HTMLInputElement>(null);

	const [error, setError] = useState('');

	const [name, setNameImpl] = useState('');

	useEffect(() => {
		if (room) {
			setNameImpl(room.me.data.name);
		} else {
			setNameImpl('');
		}
	}, [room]);

	useEffect(() => {
		if (!room) return;

		const sub = room.me.data$.subscribe({
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
			<h2>Room Configuration</h2>
			<div className="text-red-600">{error}</div>
			{room ? (
				<>
					{room instanceof Room ? (
						<LocalRoomView room={room} handleError={handleError} />
					) : room instanceof RemoteRoom ? (
						<GenericRoomView room={room} />
					) : null}

					<Button type="button" onClick={() => roomActions.close()}>
						Leave/Close Room
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
						type="button"
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
						type="button"
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

export default RoomConfigurator;

function LocalRoomView({
	room,
	handleError,
}: {
	room: Room;
	handleError: (err: string) => void;
}) {
	const roomHost = useRoomHost();
	const [enteredRoomHost, setEnteredRoomHost] = useState(roomHost.host);

	const hosts = useBehaviorSubject(room.hosts$);

	return (
		<>
			<p>Local Room "{room.meta.data.name}"</p>
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
									.inspectErr((err) => {
										Logger.error('Publish failed', err);
									})
									.mapErr((err) => {
										return err.message;
									})
									.unwrapOrElse(handleError)
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
	const meta = useBehaviorSubject(room.meta.data$);
	const members = useCollectionQuery(room.db.member);
	const presense = useBehaviorSubject(room.presence$);

	return (
		<>
			<p>Remote Room "{meta.name}"</p>

			{members.size > 0 && (
				<>
					<h3>Members</h3>
					<ul>
						{members.values().map(({ data: member }) => (
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
												{presense.get(id.id)
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
