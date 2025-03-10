import { z } from 'zod';

export const postSchema = z.object({
  title: z.string()
    .min(6, { message: 'Title must be at least 6 characters' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  content: z.string()
    .min(20, { message: 'Content must be at least 20 characters' }),
  hours: z.number()
    .min(0, { message: 'Hours must be a positive number' })
    .max(24, { message: 'Hours cannot exceed 24' }),
  tags: z.array(z.string().min(1, { message: 'Tags cannot be empty' }))
    .min(1, { message: 'At least one tag is required' })
    .or(z.string().min(1, { message: 'Tags cannot be empty' })),
  publish_date: z.string()
    .datetime({ message: 'Invalid date format' })
}); 