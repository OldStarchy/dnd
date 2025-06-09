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
import { Outlet } from 'react-router';

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
					<main className="flex-1 grid">
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
								<a href="/">
									<Crown />
									Game Master View
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<a href="/popout" target="_BLANK">
									<Sword />
									Player View
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Character Presets</SidebarGroupLabel>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<a href="/characters">
									<Users2 />
									Player Characters
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<a href="/npc">
									<Dog />
									Non-Player Characters
								</a>
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
							<a href="/help" target="_BLANK">
								<GraduationCap />
								Tutorials
							</a>
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
