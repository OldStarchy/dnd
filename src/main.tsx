import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from './components/theme-provider';
import './index.css';
import Layout from './layout/layout';
import CustomCreatureEditor from './views/CustomCreatureEditor';
import Home from './views/Home';
import Monsters from './views/Monsters';
import PopoutView from './views/Popout';
import Sandbox from './views/Sandbox';

const router = createBrowserRouter([
	{
		Component: Layout,
		children: [
			{
				index: true,
				Component: Home,
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
		path: '/popout',
		Component: PopoutView,
	},
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<RouterProvider router={router} />
		</ThemeProvider>
	</StrictMode>,
);
