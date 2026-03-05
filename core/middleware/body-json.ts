import type { Middleware } from '../router.ts';
import { RouteError } from '../utils/route-error.ts';

const MAX_BYTES = 1_000_000;

export const bodyJson: Middleware = async (req, res) => {
  // Verifica se é do tipo json
  if (
    req.headers['content-type'] !== 'application/json' &&
    req.headers['content-type'] !== 'application/json;charset=utf-8'
  ) {
    return;
  }

  const contentLength = Number(req.headers['content-length']);

  if (!Number.isInteger(contentLength)) {
    throw new RouteError(400, 'content-length invalido');
  }

  if (contentLength > MAX_BYTES) {
    throw new RouteError(413, 'corpo grande');
  }

  // Captura dos pedaços (chunks) de dados enviados no corpo da requisição
  const chunks: Buffer[] = [];
  let size = 0;

  try {
    for await (const chunk of req) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buf.length;

      if (size > MAX_BYTES) throw new RouteError(413, 'corpo grande');

      chunks.push(buf);
    }
  } catch (error) {
    throw new RouteError(400, 'request abortado');
  }

  try {
    // Concatena os buffers e converte para string UTF-8
    const bodyData = Buffer.concat(chunks).toString('utf-8');

    // verifica se o body está vazio
    if (bodyData === '') {
      req.body = {};
      return;
    }

    req.body = JSON.parse(bodyData);
  } catch (error) {
    throw new RouteError(400, 'json inválido');
  }
};
