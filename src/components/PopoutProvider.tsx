import { usePrimarySelector } from '@/store/primary-store';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
	type Entity,
} from '@/store/types/Entity';
import { MessagePortServer } from '@/sync/MessagePortServer';
import type { Server } from '@/sync/Server';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from 'react';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableEntry';

const PopoutContext = createContext<{ setOpen(open: boolean): void } | null>(
	null,
);

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

export function PopoutProvider({ children }: { children: React.ReactNode }) {
	const serverRef = useRef<Server | null>(null);
	const windowRef = useRef<Window | null>(null);

	const initiativeState = usePrimarySelector((state) => state.initiative);
	const initiativeStateRef = useRef(initiativeState);
	initiativeStateRef.current = initiativeState;

	useEffect(() => {
		if (!serverRef.current) {
			return;
		}
		serverRef.current.notify({
			type: 'initiativeTableUpdate',
			data: stripEntityListForPopout(initiativeState.entities),
		});
	}, [initiativeState.entities]);

	const prepareServer = useCallback((win: Window) => {
		serverRef.current?.[Symbol.dispose]();

		const channel = new MessageChannel();
		const { port1, port2 } = channel;

		win.postMessage(
			{ type: 'INIT_PORT', port: port2 },
			{ transfer: [port2] },
		);

		port1.start();
		serverRef.current = new MessagePortServer(port1, {
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
		});
	}, []);

	useEffect(() => {
		window.addEventListener('message', (event) => {
			if (event.data === 'POPUP_READY') {
				windowRef.current = event.source as Window;
				prepareServer(windowRef.current);
			}
		});
	}, [prepareServer]);

	const setOpen = useCallback(
		(open: boolean) => {
			if (open) {
				if (windowRef.current && !windowRef.current.closed) {
					windowRef.current.focus();

					if (windowRef.current.location.pathname !== '/popout') {
						windowRef.current.location.href = '/popout';
					}
				} else {
					const win = window.open(
						'/popout',
						'Popout',
						'width=800,height=600,scrollbars=yes,resizable=yes',
					);

					if (!win) {
						console.error('Failed to open popout window');
						return;
					}
					win.addEventListener('load', () => prepareServer(win));

					windowRef.current = win;
				}
			} else {
				if (windowRef.current && !windowRef.current.closed) {
					windowRef.current.close();
				}
			}
		},
		[prepareServer],
	);

	return (
		<PopoutContext.Provider value={{ setOpen }}>
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
