import { usePrimarySelector } from '@/store/primary-store';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
	type Entity,
} from '@/store/types/Entity';
import PopoutServer from '@/sync/PopoutServer';
import type { Server } from '@/sync/Server';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableEntry';

const PopoutContext = createContext<PopoutServer | null>(null);

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

const servers: Server[] = [];

export function PopoutProvider({ children }: { children: React.ReactNode }) {
	const initiativeState = usePrimarySelector((state) => state.initiative);
	const initiativeStateRef = useRef(initiativeState);
	initiativeStateRef.current = initiativeState;
	const [server, _setServer] = useState<PopoutServer>(() => {
		const server = new PopoutServer({
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
							type: 'initiative-table-update',
							data: stripEntityListForPopout(
								initiativeStateRef.current.entities,
							),
						});
						break;
					default: {
						// @ts-expect-error unused
						const _exhaustiveCheck: never = notification;
					}
				}
			},
		});
		if (
			!servers.some((existingServer, i) => {
				if (existingServer === server) {
					console.log(`Server ${i}`);
					return true;
				}
				return false;
			})
		) {
			console.log(`new ${servers.length} server created`);
			servers.push(server);
		}
		return server;
	});

	useEffect(() => {
		return () => {
			server[Symbol.dispose]();
		};
	}, [server]);

	useEffect(() => {
		if (!server.isOpen()) {
			return;
		}
		server.notify({
			type: 'initiative-table-update',
			data: stripEntityListForPopout(initiativeState.entities),
		});
	}, [server, initiativeState.entities]);

	return (
		<PopoutContext.Provider value={server}>
			{children}
		</PopoutContext.Provider>
	);
}

export function usePopout() {
	const context = useContext(PopoutContext);
	if (!context) {
		throw new Error('usePopout must be used within a PopoutProvider');
	}
	return context;
}
