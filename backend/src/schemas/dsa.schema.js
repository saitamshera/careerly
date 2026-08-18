const { z } = require('zod');

const createDsaProblemSchema = z.object({
  title: z.string().min(1, 'Problem title is required').max(200),
  topic: z.string().min(1, 'Topic is required').max(100),
  difficulty: z.preprocess(
    (val) => (typeof val === 'string' ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val),
    z.enum(['Easy', 'Medium', 'Hard'], { message: 'Difficulty must be Easy, Medium, or Hard' })
  ),
  status: z.enum(['solved', 'attempted', 'revisit', 'todo']).default('todo'),
  platform: z.string().default('LeetCode'),
  url: z.string().url('Please provide a valid URL').optional().or(z.literal('')),
  notes: z.string().max(2000).optional().default(''),
  companies: z.union([z.string(), z.array(z.string())]).optional(),
  leetcodeId: z.coerce.number().optional()
});

const updateDsaProblemSchema = createDsaProblemSchema.partial();

module.exports = { createDsaProblemSchema, updateDsaProblemSchema };
