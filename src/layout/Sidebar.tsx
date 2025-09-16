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
} from '@/components/ui/sidebar';
import {
	BugPlay,
	ChevronUp,
	Cog,
	Crown,
	Database,
	Dog,
	GraduationCap,
	Home,
	LogOut,
	Speech,
	Sword,
	User2,
	Users2,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

export default function AppSidebar() {
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
					// TODO: move this entery somewhere better
					label: 'Launch Page',
					icon: <Home />,
					to: '/',
				},
				{
					label: 'Game Master View',
					icon: <Crown />,
					to: '/encounter',
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
		{
			label: 'Database',
			children: [
				{
					label: 'Database',
					icon: <Database />,
					to: '/database',
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
									<Button
										onClick={(e) => {
											e.preventDefault();
											alert('Not implemented yet');
										}}
										variant="ghost"
										className="w-full justify-start"
									>
										<LogOut />
										Log Out
									</Button>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Button
										onClick={(e) => {
											e.preventDefault();
											setUserDropdownOpen(false);
											setSettingsOpen(true);
										}}
										variant="ghost"
										className="w-full  justify-start"
									>
										<Cog />
										Settings
									</Button>
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
