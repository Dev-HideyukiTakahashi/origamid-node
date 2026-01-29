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

  heade(route: string, handler: Handler) {
    this.routes.HEAD[route] = handler;
  }

  find(method: string, pathname: string) {
    // filtra todas rotas por método http
    // caso não encontrar a rota retorna null
    const routesByMethod = this.routes[method];
    if (!routesByMethod) return null;

    // verifica se a rota existe no método http
    const matchedRoute = routesByMethod[pathname];
    if (matchedRoute) return { route: matchedRoute, params: {} };

    // separa o pathname em partes
    const reqParts = pathname.split('/').filter(Boolean);

    // pega apenas chave das rotas ignorando a function(handler)
    for (const route of Object.keys(routesByMethod)) {
      // exemplo true = /curso/:slug
      if (!route.includes(':')) continue;

      const routeParts = route.split('/').filter(Boolean);

      if (reqParts.length !== routeParts.length) continue;

      if (reqParts[0].length !== routeParts[0].length) continue;

      const params: Record<string, string> = {};
      let ok = true;

      for (let i = 0; i < reqParts.length; i++) {
        const segment = routeParts[i];
        const value = reqParts[i];

        if (segment.startsWith(':')) {
          params[segment.slice(1)] = value;
        } else if (segment !== value) {
          ok = false;
          break;
        }
      }

      if (ok) {
        return { route: routesByMethod[route], params };
      }
    }

    return null;
  }
}
