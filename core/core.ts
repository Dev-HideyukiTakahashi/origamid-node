import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { customRequest } from './http/custom-request.ts';
import { customResponse } from './http/custom-response.ts';
import { Router } from './router.ts';
import { bodyJson } from './middleware/body-json.ts';

export class Core {
  router: Router;
  server: Server;

  constructor() {
    this.router = new Router();
    this.router.use([bodyJson]);
    this.server = createServer(this.handler);
  }

  handler = async (request: IncomingMessage, response: ServerResponse) => {
    const req = await customRequest(request);
    const res = await customResponse(response);

    for (const middleware of this.router.middlewares) {
      await middleware(req, res);
    }

    const matched = this.router.find(req.method || '', req.pathname);

    if (!matched) {
      res.status(404).end('Não encontrado');
    }

    const { route, params } = matched!;
    req.params = params;

    for (const middleware of route.middlewares) {
      await middleware(req, res);
    }

    await route.handler(req, res);
  };

  init() {
    this.server.listen(3000, () => {
      console.log('Server is running at port 3000');
    });
  }
}
