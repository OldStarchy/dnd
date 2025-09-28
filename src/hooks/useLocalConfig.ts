import z from 'zod';

import useJsonStorage from '@/hooks/useJsonStorage';

const DEFAULT_SERVER_URL = (import.meta.env.VITE_BASE_URL || '').replace(
	/\/+$/,
	'',
);

const localConfigSchema = z.object({
	hostUrl: z.url().default(DEFAULT_SERVER_URL),
	reconnectOnPageLoad: z.boolean().default(true),
});

type LocalConfig = z.infer<typeof localConfigSchema>;

declare global {
	interface LocalStorageKeys {
		localConfig: LocalConfig;
	}
}

export function useLocalConfig() {
	return useJsonStorage(
		'localConfig',
		{
			hostUrl: undefined,
		},
		localConfigSchema,
	);
}
