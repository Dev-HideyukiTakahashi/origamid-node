import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { customRequest } from './http/custom-request.ts';
import { customResponse } from './http/custom-response.ts';
import { Router } from './router.ts';

export class Core {
  router: Router;
  server: Server;

  constructor() {
    this.router = new Router();
    this.server = createServer(this.handler);
  }

  handler = async (request: IncomingMessage, response: ServerResponse) => {
    const req = await customRequest(request);
    const res = await customResponse(response);

    const matched = this.router.find(req.method || '', req.pathname);

    if (!matched) {
      res.status(404).end('Não encontrado');
    }

    const { route, params } = matched;
    req.params = params;

    await route(req, res);
  };

  init() {
    this.server.listen(3000, () => {
      console.log('Server is running at port 3000');
    });
  }
}
