import type { Middleware } from '../router.ts';

export const bodyJson: Middleware = async (req, res) => {
  // Verifica se é do tipo json
  if (
    req.headers['content-type'] !== 'application/json' &&
    req.headers['content-type'] !== 'application/json;charset=utf-8'
  ) {
    return;
  }

  // Captura dos pedaços (chunks) de dados enviados no corpo da requisição
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  // Concatena os buffers e converte para string UTF-8
  const bodyData = Buffer.concat(chunks).toString('utf-8');

  // verifica se o body está vazio
  if (bodyData === '') {
    req.body = {};
    return;
  }

  req.body = JSON.parse(bodyData);
};
