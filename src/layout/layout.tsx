import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import useLocalStorage from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import {
	BugPlay,
	ChevronUp,
	Cog,
	Crown,
	Dog,
	GraduationCap,
	LogOut,
	Speech,
	SplitSquareHorizontal,
	SplitSquareVertical,
	Sword,
	User2,
	Users2,
} from 'lucide-react';
import { useCallback } from 'react';
import { Link, Outlet } from 'react-router';

function Layout() {
	const [splitDirection, setSplitDirection] = useLocalStorage(
		'layoutDirection',
		(v) => (v !== 'vertical' ? 'horizontal' : 'vertical'),
	);

	const toggleSplitDirection = useCallback(() => {
		setSplitDirection((prev) =>
			prev !== 'vertical' ? 'vertical' : 'horizontal',
		);
	}, []);

	return (
		<SidebarProvider>
			<div className="fixed inset-0 flex">
				<AppSidebar />
				<div className="flex flex-col flex-grow items-stretch justify-center min-h-screen bg-background p-4 gap-4">
					<header className="flex items-center justify-between space-x-2">
						<SidebarTrigger className="ml-auto" />
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
							<span className="sr-only">
								Toggle split direction
							</span>
						</Button>

						<ModeToggle />
					</header>
					<main className="flex-1 grid overflow-auto">
						<Outlet />
					</main>
					<footer className="flex items-center justify-between gap-4">
						Footer Bro
					</footer>
				</div>
			</div>
		</SidebarProvider>
	);
}

export default Layout;

export function AppSidebar() {
	return (
		<Sidebar>
			{/* <SidebarHeader></SidebarHeader> */}
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Initiative Tracker</SidebarGroupLabel>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/">
									<Crown />
									Game Master View
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/popout">
									<Sword />
									Player View
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Character Presets</SidebarGroupLabel>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/characters">
									<Users2 />
									Custom Heroes & Creatures
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/monsters">
									<Dog />
									5e Monsters
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<a
								href="https://github.com/OldStarchy/dnd/discussions"
								target="_BLANK"
							>
								<Speech />
								Feedback
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link to="/help" target="_BLANK">
								<GraduationCap />
								Tutorials
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link to="/sandbox">
								<BugPlay />
								Sandbox
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton>
									<User2 /> Username
									<ChevronUp className="ml-auto" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side="top"
								className="w-[--radix-popper-anchor-width]"
							>
								<DropdownMenuItem asChild>
									<a href="#">
										<LogOut />
										Log Out
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a href="#">
										<Cog />
										My Account
									</a>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
