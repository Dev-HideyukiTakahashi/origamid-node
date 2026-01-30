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
  req.body = {};

  return req;
}
