import { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';

export interface CustomRequest extends IncomingMessage {
  query: URLSearchParams;
  pathname: string;
  params: Record<string, any>;
  body: Record<string, any>;
}

export async function customRequest(request: IncomingMessage): Promise<CustomRequest> {
  const req = request as CustomRequest;
  const url = new URL(req.url || '', 'http://localhost:3000');

  // Parse de URL e inicialização de objetos auxiliares
  req.query = url.searchParams;
  req.pathname = url.pathname;
  req.params = {};

  // Captura dos pedaços (chunks) de dados enviados no corpo da requisição
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  // Concatena os buffers e converte para string UTF-8
  const bodyData = Buffer.concat(chunks).toString('utf-8');

  // Faz o parse do corpo se o cabeçalho indicar JSON
  if (req.headers['content-type'] === 'application/json' && bodyData) {
    try {
      req.body = JSON.parse(bodyData);
    } catch {
      req.body = {}; // Fallback caso o JSON seja inválido
    }
  } else {
    req.body = {};
  }

  return req;
}
