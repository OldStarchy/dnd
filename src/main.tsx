import { WebsocketClientProvider } from '@/components/ClientProvider';
import { PopoutProvider } from '@/components/PopoutProvider';
import { ShareProvider } from '@/components/ShareProvider';
import { ThemeProvider } from '@/components/theme-provider';
import '@/index.css';
import Layout from '@/layout/layout';
import { primaryStore } from '@/store/primary-store';
import CustomCreatureEditor from '@/views/CustomCreatureEditor';
import Home from '@/views/Encounter';
import Monsters from '@/views/Monsters';
import PopoutView from '@/views/Popout';
import Sandbox from '@/views/Sandbox';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { ConfigurableBackendApiProvider } from './hooks/useBackendApi';
import RoomView from './views/Room';

function GmLayout() {
	return (
		<ConfigurableBackendApiProvider>
			<Provider store={primaryStore}>
				<ShareProvider>
					<PopoutProvider>
						<Layout />
					</PopoutProvider>
				</ShareProvider>
			</Provider>
		</ConfigurableBackendApiProvider>
	);
}

function PlayerLayout() {
	return (
		<ConfigurableBackendApiProvider>
			<WebsocketClientProvider>
				<Outlet />
			</WebsocketClientProvider>
		</ConfigurableBackendApiProvider>
	);
}

const router = createBrowserRouter(
	[
		{
			Component: GmLayout,
			children: [
				{
					index: true,
					Component: Home,
				},
				{
					path: '/room',
					Component: RoomView,
				},
				{
					path: '/characters',
					Component: CustomCreatureEditor,
				},
				{
					path: '/monsters',
					Component: Monsters,
				},
				{
					path: '/sandbox',
					Component: Sandbox,
				},
			],
		},
		{
			Component: PlayerLayout,
			children: [
				{
					path: '/popout',
					Component: PopoutView,
				},
			],
		},
	],
	{
		basename: (import.meta.env.VITE_BASE_URL || '/').replace(/\/?$/, '/'),
	},
);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<RouterProvider router={router} />
		</ThemeProvider>
	</StrictMode>,
);
