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
import { BackendApiProvider } from './hooks/useBackendApi';
import { BackendApi } from './sync/BackendApi';
import RoomView from './views/Room';

// const backendApi = new BackendApi('http://127.0.0.1:3000');
const backendApi = new BackendApi(window.location.origin);
console.log('Backend API initialized with host:', backendApi.httpHost);
console.log('Backend API initialized with ws:', backendApi.wsHost);
function GmLayout() {
	return (
		<BackendApiProvider value={backendApi}>
			<Provider store={primaryStore}>
				<ShareProvider>
					<PopoutProvider>
						<Layout />
					</PopoutProvider>
				</ShareProvider>
			</Provider>
		</BackendApiProvider>
	);
}

function PlayerLayout() {
	return (
		<BackendApiProvider value={backendApi}>
			<WebsocketClientProvider>
				<Outlet />
			</WebsocketClientProvider>
		</BackendApiProvider>
	);
}

const router = createBrowserRouter([
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
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<RouterProvider router={router} />
		</ThemeProvider>
	</StrictMode>,
);
