import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    // Overwrite req.body with clean, parsed, and sanitized data
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues?.[0]?.message || 'Validation error',
        // errors: z.treeifyError(error),
      });
    }
    next(error);
  }
};