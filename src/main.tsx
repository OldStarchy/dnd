import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from './components/theme-provider';
import './index.css';
import Layout from './layout/layout';
import Characters from './views/Characters';
import Home from './views/Home';
import Monsters from './views/Monsters';
import PopoutView from './views/Popout';

const router = createBrowserRouter([
	{
		Component: Layout,
		children: [
			{
				index: true,
				Component: Home,
			},
			{
				path: '/popout',
				Component: PopoutView,
			},
			{
				path: '/characters',
				Component: Characters,
			},
			{
				path: '/monsters',
				Component: Monsters,
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
