import { RemoteServer } from '@/sync/RemoteServer';
import { PortTransport } from '@/sync/transports/PortTransport';
import { DND_CONNECT, DND_PLEASE_RECONNECT } from '@/sync/windowMessage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHref } from 'react-router';
import { PopoutContext } from '../../context/PopoutContext';
import { useServerStateConnection } from './ShareProvider';

export function PopoutProvider({ children }: { children: React.ReactNode }) {
	const windowRef = useRef<Window | null>(null);
	const [server, setServer] = useState<RemoteServer | null>(null);

	const prepareServer = useCallback((win: Window) => {
		setServer((current) => {
			current?.[Symbol.dispose]();

			const channel = new MessageChannel();
			const { port1, port2 } = channel;

			win.postMessage(
				{ type: DND_CONNECT, port: port2 },
				{ transfer: [port2] },
			);

			port1.start();
			const server = new RemoteServer(
				(handler) => new PortTransport(port1, handler),
			);

			return server;
		});
	}, []);

	useEffect(() => {
		window.addEventListener('message', (event) => {
			if (event.data?.type === DND_PLEASE_RECONNECT) {
				windowRef.current = event.source as Window;
				prepareServer(windowRef.current);
			}
		});
	}, [prepareServer]);

	const popoutUrl = useHref('/popout?local');

	const setOpen = useCallback(
		(open: boolean) => {
			if (open) {
				if (windowRef.current && !windowRef.current.closed) {
					windowRef.current.focus();

					if (windowRef.current.location.toString() !== popoutUrl) {
						windowRef.current.location.href = popoutUrl;
					}
				} else {
					const win = window.open(
						popoutUrl,
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
		[prepareServer, popoutUrl],
	);

	useServerStateConnection(server);

	return (
		<PopoutContext.Provider value={{ setOpen }}>
			{children}
		</PopoutContext.Provider>
	);
}
