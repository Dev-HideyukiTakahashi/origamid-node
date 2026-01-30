import type { CustomRequest } from './http/custom-request.ts';
import type { CustomResponse } from './http/custom-response.ts';

type Handler = (req: CustomRequest, res: CustomResponse) => Promise<void> | void;

interface RouteMethods {
  [path: string]: Handler;
}

interface RouteTable {
  [method: string]: RouteMethods;
}

export class Router {
  // Tabela de rotas organizada por método HTTP
  routes: RouteTable = {
    GET: {},
    POST: {},
    PUT: {},
    DELETE: {},
    HEAD: {},
  };

  get(route: string, handler: Handler) {
    this.routes.GET[route] = handler;
  }

  post(route: string, handler: Handler) {
    this.routes.POST[route] = handler;
  }

  put(route: string, handler: Handler) {
    this.routes.PUT[route] = handler;
  }

  delete(route: string, handler: Handler) {
    this.routes.DELETE[route] = handler;
  }

  head(route: string, handler: Handler) {
    this.routes.HEAD[route] = handler;
  }

  find(method: string, pathname: string) {
    // 1. Filtra as rotas pelo método (GET, POST, etc)
    const routesByMethod = this.routes[method];
    if (!routesByMethod) return null;

    // 2. Tenta busca exata (Rápido: ex /cursos)
    const matchedRoute = routesByMethod[pathname];
    if (matchedRoute) return { route: matchedRoute, params: {} };

    // 3. Prepara a URL atual para busca dinâmica (remove barras extras)
    const reqParts = pathname.split('/').filter(Boolean);

    // 4. Percorre todas as rotas registradas no método atual
    for (const route of Object.keys(routesByMethod)) {
      // Pula rotas que não possuem ":" (não são dinâmicas)
      if (!route.includes(':')) continue;

      // Prepara a rota registrada (ex: /cursos/:slug -> ['cursos', ':slug'])
      const routeParts = route.split('/').filter(Boolean);

      // Se a quantidade de segmentos for diferente, nem compara
      if (reqParts.length !== routeParts.length) continue;

      const params: Record<string, string> = {};
      let ok = true;

      // 5. Compara segmento por segmento
      for (let i = 0; i < reqParts.length; i++) {
        const segment = routeParts[i]; // Parte da rota registrada
        const value = reqParts[i]; // Parte da URL que veio do navegador

        if (segment.startsWith(':')) {
          // Se começa com ":", guarda o valor como um parâmetro
          params[segment.slice(1)] = value;
        } else if (segment !== value) {
          // Se a parte estática for diferente, descarta essa rota
          ok = false;
          break;
        }
      }

      // 6. Se todos os segmentos bateram, retorna o handler e os parâmetros
      if (ok) {
        return { route: routesByMethod[route], params };
      }
    }

    return null;
  }
}
