import { TransportContext } from '@/context/TransportContext';
import type { TransportFactory, TransportHandler } from '@/sync/Transport';
import { PortTransport } from '@/sync/transports/PortTransport';
import { DND_CONNECT, DND_PLEASE_RECONNECT } from '@/sync/windowMessage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHref } from 'react-router';
import { PopoutContext } from '../../context/PopoutContext';

export function MessagePortTransportProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [transport, setTransport] = useState<TransportFactory<string> | null>(
		null,
	);
	const windowRef = useRef<Window | null>(null);

	const preparePopout = useCallback((win: Window) => {
		const channel = new MessageChannel();
		const { port1, port2 } = channel;

		win.postMessage(
			{ type: DND_CONNECT, port: port2 },
			{ transfer: [port2] },
		);

		const transport = (handler: TransportHandler) =>
			new PortTransport(port1, handler);

		setTransport(transport);
	}, []);

	useEffect(() => {
		window.addEventListener('message', (event) => {
			if (event.data === DND_PLEASE_RECONNECT) {
				windowRef.current = event.source as Window;
				preparePopout(windowRef.current);
			}
		});
	}, [preparePopout]);

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
					win.addEventListener('load', () => preparePopout(win));

					windowRef.current = win;
				}
			} else {
				if (windowRef.current && !windowRef.current.closed) {
					windowRef.current.close();
				}
			}
		},
		[preparePopout, popoutUrl],
	);

	return (
		<PopoutContext.Provider value={{ setOpen }}>
			<TransportContext.Provider value={transport}>
				{children}
			</TransportContext.Provider>
		</PopoutContext.Provider>
	);
}
