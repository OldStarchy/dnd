import { z } from 'zod';

// TODO: Replace with a more specific schema if possible
export const memberRequestSchema = z.unknown().refine((x) => x !== undefined);

export type MemberRequest = z.infer<typeof memberRequestSchema>;
