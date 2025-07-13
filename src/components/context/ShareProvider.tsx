import { ShareContext } from '@/context/ShareContext';
import { useBackendApi } from '@/hooks/context/useBackendApi';
import { useSessionToken } from '@/hooks/useSessionToken';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
	type Entity,
} from '@/store/types/Entity';
import { RemoteServer } from '@/sync/RemoteServer';
import { WebSocketTransport } from '@/sync/transports/WebSocketTransport';
import type { Creature } from '@/type/Creature';
import { useEffect, useMemo, useState } from 'react';
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

export function ShareProvider({ children }: { children: React.ReactNode }) {
	const [roomCode, setRoomCode] = useState<string | null>(null);
	const [connectionToken, setConnectionToken] = useSessionToken();

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
		if (serverRef.current || !connectionToken) {
			return;
		}

		const server = new RemoteServer(
			,
			{
				async handleRequest(request) {
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
				},
				handleNotification(notification) {
					switch (notification.type) {
						case 'ready':
							this.notify({
								type: 'initiativeTableUpdate',
								data: stripEntityListForPopout(
									initiativeStateRef.current.entities,
									creaturesRef.current,
								),
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
				},
				handleClose() {
					// Handle connection close
				},
			},
		);

		serverRef.current = server;
	}, [connectionToken, backendApi]);

	return (
		<ShareContext.Provider
			value={useMemo(
				() => ({ roomCode, sessionToken: connectionToken }),
				[roomCode, connectionToken],
			)}
		>
			{children}
		</ShareContext.Provider>
	);
}
