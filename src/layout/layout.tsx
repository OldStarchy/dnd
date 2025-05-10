import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import useLocalStorage from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { SplitSquareHorizontal, SplitSquareVertical } from 'lucide-react';
import { useCallback } from 'react';
import { Outlet } from 'react-router';

function Layout() {
	const [splitDirection, setSplitDirection] =
		useLocalStorage('layoutDirection');

	const toggleSplitDirection = useCallback(() => {
		setSplitDirection((prev) =>
			prev !== 'vertical' ? 'vertical' : 'horizontal',
		);
	}, []);
	return (
		<div className="flex flex-col items-stretch justify-center min-h-screen bg-background p-4 gap-4">
			<header className="flex items-center justify-between gap-x-4">
				<h1 className="text-2xl font-bold flex-1">My App</h1>
				<Button
					variant="outline"
					size="icon"
					className="cursor-pointer"
					onClick={toggleSplitDirection}
				>
					<SplitSquareHorizontal
						className={cn(
							'absolute h-[1.2rem] w-[1.2rem] transition-all',
							{
								'scale-0': splitDirection === 'horizontal',
							},
						)}
					/>
					<SplitSquareVertical
						className={cn(
							'absolute h-[1.2rem] w-[1.2rem] transition-all',
							{
								'scale-0': splitDirection === 'vertical',
							},
						)}
					/>
					<span className="sr-only">Toggle split direction</span>
				</Button>
				<ModeToggle />
			</header>
			<main className="flex-1 grid">
				<Outlet />
			</main>
			<footer className="flex items-center justify-between gap-4">
				Footer Bro
			</footer>
		</div>
	);
}

export default Layout;
