import { z } from 'zod';

export const hostResponseSpec = z.any(); // TODO: Replace with a more specific schema if possible

export type HostResponse = z.infer<typeof hostResponseSpec>;
