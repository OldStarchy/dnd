import { ThemeProvider } from '@/components/theme-provider';
import '@/index.css';
import Layout from '@/layout/layout';
import Logger, { consoleWriter } from '@/lib/log';
import { primaryStore } from '@/store/primary-store';
import Encounter from '@/views/Encounter';
import Monsters from '@/views/Monsters';
import PopoutView from '@/views/Popout';
import Sandbox from '@/views/Sandbox';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import {
	createBrowserRouter,
	createHashRouter,
	RouterProvider,
	type RouteObject,
} from 'react-router';
import { ConfigurableRoomHostProvider } from './components/context/ConfigurableRoomHostProvider';
import RoomContextProvider from './sync/react/components/RoomActionsContextProvider';
import DatabaseViewer from './views/DatabaseViewer';
import Launch from './views/Launch';
import RoomConfigurator from './views/Room';

Logger.default.addWriter(Logger.INFO, consoleWriter);

function GmLayout() {
	return (
		<Provider store={primaryStore}>
			<Layout />
		</Provider>
	);
}

const routes: RouteObject[] = [
	{
		Component: GmLayout,
		children: [
			{
				index: true,
				Component: Launch,
			},
			{
				path: '/encounter',
				Component: Encounter,
			},
			{
				path: '/room',
				Component: RoomConfigurator,
			},
			// {
			// 	path: '/characters',
			// 	Component: CustomCreatureEditor,
			// },
			{
				path: '/monsters',
				Component: Monsters,
			},
			{
				path: '/database',
				Component: DatabaseViewer,
			},
			{
				path: '/sandbox',
				Component: Sandbox,
			},
		],
	},
	{
		path: '/popout/',
		Component: PopoutView,
	},
];

const useHashRouter = import.meta.env.VITE_SPA === 'true';
const router = useHashRouter
	? createHashRouter(routes)
	: createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ConfigurableRoomHostProvider>
			<RoomContextProvider>
				<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
					<RouterProvider router={router} />
				</ThemeProvider>
			</RoomContextProvider>
		</ConfigurableRoomHostProvider>
	</StrictMode>,
);
