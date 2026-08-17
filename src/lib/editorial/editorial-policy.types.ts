import { z } from 'zod';
import { EditorialPolicySchema } from './editorial-policy.schema';

export type EditorialPolicy = z.infer<typeof EditorialPolicySchema>;
export type QualityGate = z.infer<typeof EditorialPolicySchema.shape.quality_gate>;
