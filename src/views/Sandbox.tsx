import { useMemo } from 'react';
import { Link, useLocation } from 'react-router';

import slugToTitleCase from '@/lib/slugToTitleCase';
import { sandboxRoutes } from '@/routes';

function Sandbox() {
	const location = useLocation();
	const sandboxItems = useMemo(
		() =>
			sandboxRoutes
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
		[],
	);
	return (
		<section>
			<p>
				This is a testing area for the various UI components used in the
				app.
			</p>
			<ul>
				{sandboxItems
					.filter((item) => item.to !== location.pathname)
					.map((item, idx) => (
						<li key={idx}>
							{item.to ? (
								<Link
									className="underline text-blue-500"
									to={item.to}
								>
									{item.label}
								</Link>
							) : (
								<h2 className="text-xl mb-2">{item.label}</h2>
							)}
						</li>
					))}
			</ul>
		</section>
	);
}

export default Sandbox;
