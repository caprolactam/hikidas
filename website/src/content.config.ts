import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

const docs = defineCollection({
  loader: glob({ base: './src/docs', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
  }),
})

export const collections = { docs }
