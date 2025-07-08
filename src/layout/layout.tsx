import { ModeToggle } from '@/components/mode-toggle';
import { SettingsDialog } from '@/components/SettingsDialog';
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
import { useCallback, useState } from 'react';
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
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [userDropdownOpen, setUserDropdownOpen] = useState(false);

	const mainEntries = [
		{
			label: 'Room',
			children: [
				{
					label: 'Create/Join Room',
					icon: <Users2 />,
					to: '/room',
				},
			],
		},
		{
			label: 'Initiative Tracker',
			children: [
				{
					label: 'Game Master View',
					icon: <Crown />,
					to: '/',
				},
				{
					label: 'Player View',
					icon: <Sword />,
					to: '/popout',
				},
			],
		},
		{
			label: 'Character Presets',
			children: [
				{
					label: 'Custom Heroes & Creatures',
					icon: <Users2 />,
					to: '/characters',
				},
				{
					label: '5e Monsters',
					icon: <Dog />,
					to: '/monsters',
				},
			],
		},
	];

	const footerEntries = [
		{
			label: 'Feedback',
			icon: <Speech />,
			external: true,
			to: 'https://github.com/OldStarchy/dnd/discussions',
		},
		{
			label: 'Tutorials',
			icon: <GraduationCap />,
			to: '/help',
		},
		{
			label: 'Sandbox',
			icon: <BugPlay />,
			to: '/sandbox',
		},
	];

	return (
		<Sidebar>
			{/* <SidebarHeader></SidebarHeader> */}
			<SidebarContent>
				{mainEntries.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarMenu>
							{group.children.map((item) => (
								<SidebarMenuItem key={item.label}>
									<SidebarMenuButton asChild>
										<Link to={item.to}>
											{item.icon}
											{item.label}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					{footerEntries.map((item) => (
						<SidebarMenuItem key={item.label}>
							<SidebarMenuButton asChild>
								<Link
									to={item.to}
									target={
										item.external ? '_blank' : undefined
									}
									rel={
										item.external
											? 'noopener noreferrer'
											: undefined
									}
								>
									{item.icon}
									{item.label}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
					<SidebarMenuItem>
						<DropdownMenu
							open={userDropdownOpen}
							onOpenChange={setUserDropdownOpen}
						>
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
									<Link
										to="#"
										onClick={(e) => {
											e.preventDefault();
											alert('Not implemented yet');
										}}
									>
										<LogOut />
										Log Out
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to="#"
										onClick={(e) => {
											e.preventDefault();
											setUserDropdownOpen(false);
											setSettingsOpen(true);
										}}
									>
										<Cog />
										Settings
									</Link>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SettingsDialog
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
			/>
		</Sidebar>
	);
}
