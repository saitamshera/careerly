const { z } = require('zod');

const createJobSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(200),
  role: z.string().min(1, 'Role is required').max(200),
  status: z.string().default('applied'),
  appliedDate: z.string().optional(),
  oaDate: z.string().optional(),
  notes: z.string().max(2000).optional().default(''),
  url: z.string().url('Please provide a valid URL').optional().or(z.literal('')),
  location: z.string().max(200).optional().default(''),
  salary: z.string().max(100).optional().default(''),
  source: z.string().max(100).optional().default('')
});

const updateJobSchema = createJobSchema.partial();

module.exports = { createJobSchema, updateJobSchema };
