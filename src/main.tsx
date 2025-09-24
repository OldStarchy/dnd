import { ThemeProvider } from '@/components/theme-provider';
import '@/index.css';
import Logger, { consoleWriter } from '@/lib/log';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
	createBrowserRouter,
	createHashRouter,
	RouterProvider,
} from 'react-router';
import { RoomHostContextProvider } from './components/context/RoomHostContextProvider';
import routes from './routes';
import RoomContextProvider from './sync/react/components/RoomActionsContextProvider';

Logger.default.addWriter(Logger.INFO, consoleWriter);

const useHashRouter = import.meta.env.VITE_SPA === 'true';
const router = useHashRouter
	? createHashRouter(routes)
	: createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<RoomHostContextProvider>
			<RoomContextProvider>
				<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
					<RouterProvider router={router} />
				</ThemeProvider>
			</RoomContextProvider>
		</RoomHostContextProvider>
	</StrictMode>,
);
