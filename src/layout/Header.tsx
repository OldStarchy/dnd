import { SplitSquareHorizontal, SplitSquareVertical } from 'lucide-react';
import { useCallback } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import useLocalStorage from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

import RoomWidget from './header/RoomWidget';

export default function Header() {
	const [splitDirection, setSplitDirection] = useLocalStorage(
		'layoutDirection',
		(v) => (v !== 'vertical' ? 'horizontal' : 'vertical'),
	);

	const toggleSplitDirection = useCallback(() => {
		setSplitDirection((prev) =>
			prev !== 'vertical' ? 'vertical' : 'horizontal',
		);
	}, [setSplitDirection]);

	return (
		<header className="flex items-center justify-end space-x-2">
			<RoomWidget />

			<SidebarTrigger />
			<Button
				variant="outline"
				size="icon"
				className="cursor-pointer"
				onClick={toggleSplitDirection}
			>
				<SplitSquareHorizontal
					className={cn('absolute transition-all', {
						'scale-0': splitDirection === 'horizontal',
					})}
				/>
				<SplitSquareVertical
					className={cn('absolute transition-all', {
						'scale-0': splitDirection === 'vertical',
					})}
				/>
				<span className="sr-only">Toggle split direction</span>
			</Button>

			<ThemeToggle />
		</header>
	);
}
