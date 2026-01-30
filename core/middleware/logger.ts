import type { Middleware } from '../router.ts';

export const logger: Middleware = (req, res) => {
  console.log(`Log: ${req.method} ${req.pathname}`);
};
