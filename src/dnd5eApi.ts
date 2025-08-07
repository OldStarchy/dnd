import createClient from 'openapi-fetch';

import type { paths } from '@/generated/dnd5eapi';

export const dnd5eApi = createClient<paths>({
	baseUrl: 'https://www.dnd5eapi.co',
});
export const dnd5eApiUrl = 'https://www.dnd5eapi.co';
