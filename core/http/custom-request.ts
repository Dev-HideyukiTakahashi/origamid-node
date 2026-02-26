import type { IncomingMessage } from 'node:http';
import { parseCookies } from '../utils/parse-cookie.ts';
import type { UserRole } from '../../api/auth/query.ts';

export interface CustomRequest extends IncomingMessage {
  query: URLSearchParams;
  pathname: string;
  params: Record<string, string>;
  body: Record<string, unknown>;
  cookies: Record<string, string | undefined>;
  session: { user_id: number; role: UserRole; expires_ms: number } | null;
  ip: string;
  baseurl: string;
}

export async function customRequest(request: IncomingMessage): Promise<CustomRequest> {
  const req = request as CustomRequest;
  const url = new URL(req.url || '', 'http://localhost:3000');

  // Parse de URL e inicialização de objetos auxiliares
  req.query = url.searchParams;
  req.pathname = url.pathname;
  req.params = {};
  req.body = {};
  req.cookies = parseCookies(req.headers.cookie);
  req.ip = req.socket.remoteAddress || '127.0.0.1';
  req.session = null;
  req.baseurl = 'http://localhost:3000';

  return req;
}
