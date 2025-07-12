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
import { useSessionToken } from '@/hooks/useSessionToken';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
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
	const [connectionToken, setConnectionToken] = useSessionToken();
	const [isGm, setIsGm] = useState<boolean | null>(null);

	const backendApi = useBackendApi();
	const navigate = useNavigate();

	useEffect(() => {
		if (connectionToken) {
			backendApi.getRoom(connectionToken).then(
				(result) => {
					if (result.roomCode) {
						setIsGm(result.isGm);
					} else {
						setConnectionToken(null);
						setIsGm(null);
					}
				},
				() => {
					setConnectionToken(null);
					setIsGm(null);
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
			navigate('/popout');
		},
		[backendApi, setConnectionToken, form, navigate],
	);

	return (
		<div>
			{connectionToken ? (
				<div>
					<h1>Welcome back!</h1>
					<Link to={isGm ? '/' : '/popout'}>Reconnect to Room</Link>
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
