// SERVER

import { createServer } from 'node:http';
import { Router } from './router.mjs';
import { customRequest } from './custom-request.mjs';
import { customResponse } from './custom-response.mjs';

const router = new Router();

router.get('/', (request, response) => {
  response.status(200).end('HOME');
});

router.get('/produtos/notebook', (request, response) => {
  response.status(200).end('Produtos - Notebook');
});

router.post('/produtos', (request, response) => {
  const cor = request.query.get('cor');
  response.status(201).json({ nome: 'Produto POST', cor });
});

const server = createServer(async (request, response) => {
  const req = await customRequest(request);
  const res = await customResponse(response);

  console.log();

  const handler = router.find(req.method, req.pathname);

  if (handler) {
    handler(req, res);
  } else {
    res.status(404).end('Não encontrado');
  }
});

server.listen(3000, () => {
  console.log('Server is running at port 3000');
});
