import { readFile } from 'node:fs/promises';
import { AuthApi } from './api/auth/index.ts';
import { LmsApi } from './api/lms/index.ts';
import { Core } from './core/core.ts';
import { logger } from './core/middleware/logger.ts';
import { RouteError } from './core/utils/route-error.ts';
import { sha256 } from './api/auth/utils.ts';

const core = new Core();

core.router.use([logger]);

new AuthApi(core).init();
new LmsApi(core).init();

core.router.get('/', async (req, res) => {
  const index = await readFile('./front/index.html', 'utf-8');
  res.setHeader('Content-Type', 'text/html;charset=utf=8');
  res.status(200).end(index);
});

core.init();
