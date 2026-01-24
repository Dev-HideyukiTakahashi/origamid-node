// SERVER

import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import { customRequest } from './custom-request.mjs';
import { customResponse } from './custom-response.mjs';
import { Router } from './router.mjs';

// ROTAS
const router = new Router();

router.post('/produtos', async (req, res) => {
  const { categoria, slug } = req.body;
  try {
    await fs.mkdir(`./produtos/${categoria}`);
  } catch (error) {
    // console.log(`${categoria}, já criada`);
  }

  try {
    await fs.writeFile(`./produtos/${categoria}/${slug}.json`, JSON.stringify(req.body));
    res.status(201).json(`${slug} criado.`);
  } catch (error) {
    res.status(500).end('Erro.');
  }
});

router.get('/produtos', async (req, res) => {
  try {
    // lendo todas as pastas/subpastas(recursive) e arquivos dentro de produtos
    const lista = await fs.readdir('./produtos', { recursive: true });

    // filtrando apenas arquivos extensão .json
    const arquivosJson = lista.filter(item => item.endsWith('.json'));

    const promises = [];
    for (const arquivo of arquivosJson) {
      const conteudo = fs.readFile(`./produtos/${arquivo}`, 'utf-8');
      promises.push(conteudo);
    }

    // quando temos um array de promises podemos resolver todas de uma vez
    const conteudo = await Promise.all(promises);
    const produtos = conteudo.map(JSON.parse);
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json('Erro');
  }
});

router.get('/produto', async (req, res) => {
  const categoria = req.query.get('categoria');
  const slug = req.query.get('slug');

  try {
    const conteudo = await fs.readFile(`./produtos/${categoria}/${slug}.json`, 'utf-8');
    const produto = JSON.parse(conteudo);
    res.status(200).json(produto);
  } catch (error) {
    res.status(404).json(`Produto não encontrado!`);
  }
});

// MAIN
const server = createServer(async (request, response) => {
  const req = await customRequest(request);
  const res = await customResponse(response);

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
