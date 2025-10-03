import { Outlet } from 'react-router';

import { SidebarProvider } from '@/components/ui/sidebar';
import useLocalStorage from '@/hooks/useLocalStorage';

import AppFooter from './Footer';
import AppHeader from './Header';
import AppSidebar from './Sidebar';

declare global {
	interface LocalStorageKeys {
		layoutDirection: string;
	}
}

function Layout() {
	const [splitDirection, setSplitDirection] = useLocalStorage(
		'layoutDirection',
		(v) => (v !== 'vertical' ? 'horizontal' : 'vertical'),
	);

	return (
		<SidebarProvider>
			<div className="fixed inset-0 flex">
				<AppSidebar />

				<div className="flex flex-col flex-grow items-stretch justify-center min-h-screen bg-background p-4 gap-4">
					<AppHeader />

					<main className="flex-1 grid grid-cols-1 grid-rows-1 overflow-hidden">
						<Outlet />
					</main>

					<AppFooter />
				</div>
			</div>
		</SidebarProvider>
	);
}

export default Layout;
