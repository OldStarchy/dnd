import { PopoutProvider } from '@/components/PopoutProvider';
import { ShareProvider } from '@/components/ShareProvider';
import { ThemeProvider } from '@/components/theme-provider';
import '@/index.css';
import Layout from '@/layout/layout';
import Logger, { consoleWriter } from '@/lib/log';
import { primaryStore } from '@/store/primary-store';
import CustomCreatureEditor from '@/views/CustomCreatureEditor';
import Home from '@/views/Encounter';
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
import { ConfigurableBackendApiProvider } from './components/ConfigurableBackendApiProvider';
import RoomView from './views/Room';

Logger.default.addWriter(Logger.INFO, consoleWriter);

function GmLayout() {
	return (
		<Provider store={primaryStore}>
			<ShareProvider>
				<PopoutProvider>
					<Layout />
				</PopoutProvider>
			</ShareProvider>
		</Provider>
	);
}

const routes: RouteObject[] = [
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
		<ConfigurableBackendApiProvider>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<RouterProvider router={router} />
			</ThemeProvider>
		</ConfigurableBackendApiProvider>
	</StrictMode>,
);
