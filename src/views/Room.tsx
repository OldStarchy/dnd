import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useBackendApi } from '@/hooks/useBackendApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createJoinFormSpec = z.object({
	roomCode: z
		.string()
		.length(4)
		.transform((val) => val?.toUpperCase())
		.or(z.literal('')),
});
type CreateJoinFormSpec = z.infer<typeof createJoinFormSpec>;

function RoomView() {
	const [connectionToken, setConnectionToken] =
		useLocalStorage('connectionToken');

	const [_reconnectRoomCode, setReconnectRoomCode] = useState<string | null>(
		null,
	);

	const backendApi = useBackendApi();

	useEffect(() => {
		if (connectionToken) {
			backendApi.checkToken(connectionToken).then(
				(result) => {
					if (result.roomCode) {
						setReconnectRoomCode(result.roomCode);
					} else {
						setConnectionToken(null);
					}
				},
				() => {
					setConnectionToken(null);
					setReconnectRoomCode(null);
				},
			);
		}
	}, [connectionToken, backendApi, setConnectionToken]);

	const form = useForm({
		resolver: zodResolver(createJoinFormSpec),
		defaultValues: {
			roomCode: '',
		},
	});

	const handleSubmit = useCallback(
		async (data: CreateJoinFormSpec) => {
			if (data.roomCode) {
				try {
					const { token } = await backendApi.joinRoom(data.roomCode);
					setConnectionToken(token);
				} catch (error) {
					console.error('Failed to join room:', error);
					form.setError('roomCode', {
						type: 'manual',
						message: 'Failed to join room. Please check the code.',
					});
					return;
				}
			} else {
				const { token, roomCode: _ } = await backendApi.createRoom();
				setConnectionToken(token);
			}
			// Redirect to the room with the token
			window.location.href = `/`;
		},
		[backendApi, setConnectionToken, form],
	);

	return (
		<div>
			{connectionToken ? (
				<div>
					<h1>Welcome back!</h1>
					<Link to={`/`}>Reconnect to Room</Link>
				</div>
			) : (
				<div>
					<h1>Create or Join a Room</h1>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleSubmit)}>
							<FormField
								control={form.control}
								name="roomCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Room Code</FormLabel>
										<FormControl>
											<Input
												type="text"
												maxLength={4}
												{...field}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
							<Button type="submit">Join Room</Button>
						</form>
					</Form>
				</div>
			)}
		</div>
	);
}

export default RoomView;
