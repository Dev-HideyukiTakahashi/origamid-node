import type { Core } from '../core';
import type { Handler } from '../router';

export abstract class CoreProvider {
  handlers: Record<string, Handler> = {};
  core: Core;
  router: Core['router'];
  db: Core['db'];

  constructor(core: Core) {
    this.core = core;
    this.router = core.router;
    this.db = core.db;
  }
}

export abstract class Api extends CoreProvider {
  tables() {}

  routes() {}

  init() {
    this.tables();
    this.routes();
  }
}
