import App from '@/views/App.tsx';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from './components/theme-provider';
import './index.css';
import Layout from './layout/layout';
import PopoutView from './views/Popout';

const router = createBrowserRouter([
	{
		Component: Layout,
		children: [
			{
				index: true,
				Component: App,
			},
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
