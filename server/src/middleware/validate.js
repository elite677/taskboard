export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    return res.status(400).json({ error: message });
  }
  req.body = result.data;
  next();
};

// Rejects non-numeric :id params before they reach the database
export const parseId = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  req.id = id;
  next();
};
