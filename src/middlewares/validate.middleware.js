export const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const formattedErrors = error.issues.map((issue) => {
        const field = issue.path.join('.');
        let message = issue.message;

        // Zod-এর ডিফল্ট expected/received মেসেজকে ক্লিন মেসেজে কনভার্ট করা
        if (
          message.toLowerCase().includes('expected string') ||
          message.toLowerCase().includes('received undefined') ||
          message === 'Required'
        ) {
          message = `${field} is required`;
        }

        return {
          field,
          message,
        };
      });

      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation failed',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};