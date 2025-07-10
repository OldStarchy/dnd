import { ShareContext } from '@/context/ShareContext';
import { useBackendApi } from '@/hooks/useBackendApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { usePrimarySelector } from '@/store/primary-store';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
	type Entity,
} from '@/store/types/Entity';
import { RemoteServer } from '@/sync/RemoteServer';
import { WebSocketTransport } from '@/sync/transports/WebSocketTransport';
import { useEffect, useRef, useState } from 'react';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableEntry';

function stripEntityListForPopout(entities: Entity[]): InitiativeTableEntry[] {
	return entities
		.filter((entity) => entity.visible)
		.map((entity) => {
			let healthDisplay!: string;

			switch (entity.obfuscateHealth) {
				case HealthObfuscation.NO:
					healthDisplay = `${entity.creature.hp}/${entity.creature.maxHp}`;
					break;
				case HealthObfuscation.TEXT: {
					healthDisplay = getObfuscatedHealthText(
						entity.creature.hp,
						entity.creature.maxHp,
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
				initiative: entity.initiative,
				name: entity.creature.name,
				race: entity.creature.race,
				image: entity.creature.image,
				description: entity.creature.notes,
				id: entity.id,
				healthDisplay,
				debuffs: entity.creature.debuffs ?? [],
			};
			return ety;
		});
}

export function ShareProvider({ children }: { children: React.ReactNode }) {
	const serverRef = useRef<RemoteServer | null>(null);
	const [roomCode, setRoomCode] = useState<string | null>(null);
	const [connectionToken, setConnectionToken] =
		useLocalStorage('connectionToken');

	const initiativeState = usePrimarySelector((state) => state.initiative);
	const initiativeStateRef = useRef(initiativeState);
	initiativeStateRef.current = initiativeState;

	const backendApi = useBackendApi();

	useEffect(() => {
		if (!connectionToken) {
			return;
		}
		backendApi.checkToken(connectionToken).then((result) => {
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
			data: stripEntityListForPopout(initiativeState.entities),
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
							server.notify({
								type: 'initiativeTableUpdate',
								data: stripEntityListForPopout(
									initiativeStateRef.current.entities,
								),
							});
							break;
						case 'heartbeat':
							server.notify({ type: 'heartbeat' });
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
			value={{ roomCode, sessionToken: connectionToken }}
		>
			{children}
		</ShareContext.Provider>
	);
}
