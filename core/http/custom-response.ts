import type { ServerResponse } from 'node:http';

export interface CustomResponse extends ServerResponse {
  // Define o código HTTP e permite encadeamento
  status(code: number): CustomResponse;

  // Envia o JSON e encerra a resposta
  json(data: any): void;

  setCookie(cookie: string): void;
}

export async function customResponse(response: ServerResponse): Promise<CustomResponse> {
  const res = response as CustomResponse;

  // Implementa res.status(200)
  res.status = (code: number) => {
    res.statusCode = code;
    return res; // Retorna o próprio objeto para permitir .status().json()
  };

  // Implementa res.json({...})
  res.json = (data: any) => {
    try {
      res.setHeader('Content-Type', 'application/json'); // Configura o tipo de retorno
      res.end(JSON.stringify(data)); // Converte e envia
    } catch (error) {
      console.error('JSON Error:', error);
      res.status(500).end('Internal Server Error');
    }
  };

  res.setCookie = cookie => {
    const current = res.getHeader('Set-Cookie');

    if (current === undefined) {
      return res.setHeader('Set-Cookie', [cookie]);
    }

    if (Array.isArray(current)) {
      current.push(cookie);
      return res.setHeader('Set-Cookie', cookie);
    }

    res.setHeader('Set-Cookie', [String(current), cookie]);
  };

  return res;
}
