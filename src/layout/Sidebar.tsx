import { SiGithub } from '@icons-pack/react-simple-icons';
import { DropdownMenuLabel } from '@radix-ui/react-dropdown-menu';
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
import { Fragment, type ReactNode, useState } from 'react';
import { Link } from 'react-router';

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
import { PAGES } from '@/const';
import slugToTitleCase from '@/lib/slugToTitleCase';
import { sandboxRoutes } from '@/routes';

export default function AppSidebar() {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [userDropdownOpen, setUserDropdownOpen] = useState(false);

	const mainEntries = [
		{
			label: 'Room',
			children: [
				{
					label: PAGES.ROOM_MANAGEMENT.title,
					icon: <Users2 />,
					to: PAGES.ROOM_MANAGEMENT.url,
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
					label: PAGES.ENCOUNTER.title,
					icon: <Crown />,
					to: PAGES.ENCOUNTER.url,
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
					label: PAGES.CREATURE_EDITOR.title,
					icon: <Users2 />,
					to: PAGES.CREATURE_EDITOR.url,
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

	const footerEntries: (
		| {
				label: string;
				icon: ReactNode;
				to: string;
				external?: boolean;
		  }
		| {
				label: string;
				icon: ReactNode;
				dropUpChildren: {
					label: string;
					to?: string;
				}[];
		  }
	)[] = [
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
			dropUpChildren: sandboxRoutes
				.map((route) => {
					return (
						route.path?.replace('/sandbox/', '').split('/') ?? []
					);
				})
				.sort((a, b) => a.length - b.length)
				.reduce(
					(acc, path) => {
						if (path.length === 0) {
							acc.paths.push({
								label: 'Sandbox Home',
								to: '/sandbox',
							});
							return acc;
						}

						const header = path.length > 1 ? path[0] : null;

						if (header !== null && header !== acc.header) {
							acc.header = header;
							acc.paths.push({
								label: slugToTitleCase(header),
							});
						}

						const title = slugToTitleCase(path[path.length - 1]);
						acc.paths.push({
							label: title,
							to: `/sandbox/${path.join('/')}`,
						});

						return acc;
					},
					{
						header: null as string | null,
						paths: [] as { label: string; to?: string }[],
					},
				).paths,
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
							{'to' in item ? (
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
							) : (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<SidebarMenuButton>
											{item.icon} {item.label}
											<ChevronUp className="ml-auto" />
										</SidebarMenuButton>
									</DropdownMenuTrigger>

									<DropdownMenuContent
										side="top"
										className="w-[--radix-popper-anchor-width]"
									>
										{item.dropUpChildren.map(
											(subItem, i) => (
												<Fragment key={i}>
													{subItem.to !==
													undefined ? (
														<DropdownMenuItem
															asChild
														>
															<Link
																to={subItem.to}
																className="w-full"
															>
																<Button
																	variant="ghost"
																	className="w-full justify-start"
																	type="button"
																>
																	{
																		subItem.label
																	}
																</Button>
															</Link>
														</DropdownMenuItem>
													) : (
														<DropdownMenuLabel>
															{subItem.label}
														</DropdownMenuLabel>
													)}
												</Fragment>
											),
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
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
										className="w-full justify-start"
									>
										<Cog />
										Settings
									</Button>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Button
										variant="ghost"
										className="w-full justify-start"
										asChild
									>
										<Link
											to="https://github.com/OldStarchy/dnd"
											target="_blank"
										>
											<SiGithub />
											GitHub
										</Link>
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
