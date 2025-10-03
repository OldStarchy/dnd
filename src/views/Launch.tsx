import { Link } from 'react-router';

import Typography from '@/components/Typography';
import { PAGES } from '@/const';

function Launch() {
	return (
		<div>
			<Typography>
				<h1>How to use this app</h1>
				<ul>
					<li>
						<h2>Create a room</h2>
						<p>
							There's a button in the header, or go to{' '}
							<Link to={PAGES.ROOM_MANAGEMENT.url}>
								{PAGES.ROOM_MANAGEMENT.title}
							</Link>
							.
						</p>
						<p>This creates a room just on your device.</p>
					</li>
					<li>
						<h2>Publish your room</h2>
						<p>
							To collaborate with others, you need to connect your
							device to a Room Server; this will give you a room
							code you can share with others.
						</p>
					</li>
					<li>
						<h2>Create some characters</h2>
						<p>
							Go to{' '}
							<Link to={PAGES.CREATURE_EDITOR.url}>
								{PAGES.CREATURE_EDITOR.title}
							</Link>{' '}
							and create your PCs, NPCs, and whatever else.
						</p>
					</li>
					<li>
						<h2>Create an encounter</h2>
						<p>
							Go to{' '}
							<Link to={PAGES.ENCOUNTER.url}>
								{PAGES.ENCOUNTER.title}
							</Link>
						</p>
						<ul>
							<li>Add characters to the encounter</li>
							<li>Other things</li>
						</ul>
					</li>
				</ul>
			</Typography>
		</div>
	);
}

export default Launch;
