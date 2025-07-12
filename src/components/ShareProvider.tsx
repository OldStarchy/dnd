import { ShareContext } from '@/context/ShareContext';
import { useBackendApi } from '@/hooks/useBackendApi';
import useCustomCreatureList from '@/hooks/useCustomCreatureList';
import { useSessionToken } from '@/hooks/useSessionToken';
import { usePrimarySelector } from '@/store/primary-store';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
	type Entity,
} from '@/store/types/Entity';
import { RemoteServer } from '@/sync/RemoteServer';
import { WebSocketTransport } from '@/sync/transports/WebSocketTransport';
import type { Creature } from '@/type/Creature';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableEntry';

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
	const serverRef = useRef<RemoteServer | null>(null);
	const [roomCode, setRoomCode] = useState<string | null>(null);
	const [connectionToken, setConnectionToken] = useSessionToken();

	const initiativeState = usePrimarySelector((state) => state.initiative);
	const initiativeStateRef = useRef(initiativeState);
	initiativeStateRef.current = initiativeState;

	const backendApi = useBackendApi();

	const [creatures] = useCustomCreatureList();
	const creaturesRef = useRef(creatures);
	creaturesRef.current = creatures;

	useEffect(() => {
		if (!connectionToken) {
			return;
		}
		backendApi.getRoom(connectionToken).then((result) => {
			if (result.roomCode) {
				setRoomCode(result.roomCode);
			} else {
				setRoomCode(null);
			}
		});
	}, [connectionToken, backendApi, setConnectionToken]);

	useEffect(() => {
		if (!serverRef.current) {
			return;
		}
		serverRef.current.notify({
			type: 'initiativeTableUpdate',
			data: stripEntityListForPopout(
				initiativeState.entities,
				creaturesRef.current,
			),
		});
	}, [initiativeState.entities]);

	useEffect(() => {
		if (serverRef.current || !connectionToken) {
			return;
		}

		const server = new RemoteServer(
			(handler) =>
				new WebSocketTransport(
					backendApi.connectToRoom(connectionToken),
					handler,
				),
			{
				async handleRequest(request) {
					// Handle requests from the popout window here
					console.log('Received request:', request);
					// NYI
					return {};
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
