import { ShareContext } from '@/context/ShareContext';
import { useBackendApi } from '@/hooks/context/useBackendApi';
import useTransport from '@/hooks/context/useTransport';
import useLocalStorageCreatureList from '@/hooks/useLocalStorageCreatureList';
import { useSessionToken } from '@/hooks/useSessionToken';
import { usePrimarySelector } from '@/store/primary-store';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
	type Entity,
} from '@/store/types/Entity';
import { RemoteServer } from '@/sync/RemoteServer';
import type { Creature } from '@/type/Creature';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { InitiativeTableEntry } from '../InitiativeTable/InitiativeTableEntry';

export function stripEntityListForPopout(
	entities: Entity[],
	creatures: Creature[],
): InitiativeTableEntry[] {
	return entities
		.filter((entity) => entity.visible)
		.map((entity) => {
			let healthDisplay!: string;

			const creature = (() => {
				if (entity.creature.type === 'unique') {
					const id = entity.creature.id;
					return creatures.find((c) => c.id === id)!;
				} else return entity.creature.data;
			})();

			switch (entity.obfuscateHealth) {
				case HealthObfuscation.NO:
					healthDisplay = `${creature.hp}/${creature.maxHp}`;
					break;
				case HealthObfuscation.TEXT: {
					healthDisplay = getObfuscatedHealthText(
						creature.hp,
						creature.maxHp,
						entity.obfuscateHealth,
					);
					break;
				}
				case HealthObfuscation.HIDDEN:
					healthDisplay = '?';
					break;
				default: {
					// @ts-expect-error unused
					const _exhaustiveCheck: never = entity.obfuscateHealth;
				}
			}
			const ety: InitiativeTableEntry = {
				id: entity.id,
				initiative: entity.initiative,
				healthDisplay,
				creature: entity.creature,
			};
			return ety;
		});
}

/**
 * If there is a room, this provider will keep it up to date with changes
 * to state, and respond to requests from other clients.
 */
export function ShareProvider({ children }: { children: React.ReactNode }) {
	const [roomCode, setRoomCode] = useState<string | null>(null);
	const [connectionToken, setConnectionToken] = useSessionToken();
	const transportFactory = useTransport();
	const [server, setServer] = useState<RemoteServer | null>(null);

	const backendApi = useBackendApi();

	useEffect(() => {
		if (!connectionToken) {
			return;
		}
		const abort = new AbortController();
		backendApi.getRoom(connectionToken).then((result) => {
			if (abort.signal.aborted) {
				return;
			}
			if (result.roomCode) {
				setRoomCode(result.roomCode);
			} else {
				setRoomCode(null);
			}
		});

		return () => {
			abort.abort();
		};
	}, [connectionToken, backendApi, setConnectionToken]);

	useEffect(() => {
		if (!transportFactory || !connectionToken) {
			setServer(null);
			return;
		}

		const server = new RemoteServer(transportFactory);

		setServer(server);
	}, [connectionToken, transportFactory]);

	useServerStateConnection(server);

	return (
		<ShareContext.Provider
			value={useMemo(() => (roomCode ? { roomCode } : null), [roomCode])}
		>
			{children}
		</ShareContext.Provider>
	);
}

export function useServerStateConnection(server: RemoteServer | null): void {
	const [creatures, setCreatures] = useLocalStorageCreatureList();
	const creaturesRef = useRef<Creature[]>(creatures);
	creaturesRef.current = creatures;

	const initiativeState = usePrimarySelector((state) => state.initiative);
	const initiativeStateRef = useRef(initiativeState);
	initiativeStateRef.current = initiativeState;
	useEffect(() => {
		if (!server) {
			return;
		}

		const abort = new AbortController();

		server.$request
			.on(async function (request) {
				switch (request.type) {
					case 'creature-get': {
						const creature =
							creaturesRef.current.find(
								(c) => c.id === request.id,
							) ?? null;
						return creature;
					}
					case 'creature-list': {
						return creaturesRef.current;
					}
					case 'creature-save': {
						const { id, data } = request;
						if (id !== null) {
							const existingIndex =
								creaturesRef.current.findIndex(
									(c) => c.id === id,
								);
							if (existingIndex !== -1) {
								const updatedCreatures = [
									...creaturesRef.current,
								];
								updatedCreatures[existingIndex] = {
									...data,

									images: (data.images?.filter(Boolean) ||
										[]) as string[],
									id,
								};
								setCreatures(updatedCreatures);
								return true;
							}
							return false;
						} else {
							const newCreature = {
								...data,
								id: crypto.randomUUID(),
								images: (data.images?.filter(Boolean) ||
									[]) as string[],
							};
							setCreatures([
								...creaturesRef.current,
								newCreature,
							]);
							return true;
						}
					}
				}
			})
			.withAbort(abort);

		server.$notification
			.on(function (notification) {
				switch (notification.type) {
					case 'ready':
						this.notify({
							type: 'initiativeTableUpdate',
							data: {
								entries: stripEntityListForPopout(
									initiativeStateRef.current.entities,
									creaturesRef.current,
								),
								currentTurnId:
									initiativeStateRef.current
										.currentTurnEntityId,
							},
						});
						break;
					case 'heartbeat':
						this.notify({ type: 'heartbeat' });
						break;
					default: {
						// @ts-expect-error unused
						const _exhaustiveCheck: never = notification;
					}
				}
			})
			.withAbort(abort);

		return () => {
			abort.abort();
		};
	}, [server, setCreatures]);

	useEffect(() => {
		if (!server) {
			return;
		}

		server.notify({
			type: 'initiativeTableUpdate',
			data: {
				entries: stripEntityListForPopout(
					initiativeState.entities,
					creatures,
				),
				currentTurnId: initiativeState.currentTurnEntityId,
			},
		});
	}, [server, initiativeState, creatures]);
}
