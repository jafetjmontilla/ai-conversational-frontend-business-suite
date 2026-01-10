import { z } from 'zod';

// Schema para paginación
export const paginationSchema = z.object({
  skip: z.number().min(0).default(0),
  limit: z.number().min(1).max(100).default(10)
});

// Tipos TypeScript derivados de los schemas
export type Pagination = z.infer<typeof paginationSchema>;
