import type { Handler } from '../../core/router.ts';
import { Api } from '../../core/utils/abstract.ts';
import { RouteError } from '../../core/utils/route-error.ts';
import { AuthQuery } from './query.ts';
import { authTables } from './tables.ts';

export class AuthApi extends Api {
  query = new AuthQuery(this.db);
  handlers: Record<string, Handler> = {
    postUser: (req, res) => {
      const { name, username, email, password } = req.body;

      const password_hash = password;

      const result = this.query.insertUser({ name, username, email, role: 'user', password_hash });

      if (result.changes === 0) {
        throw new RouteError(400, 'erro ao criar usuário');
      }

      res.status(201).json({ title: 'usuário criado' });
    },
  } satisfies Api['handlers'];

  tables(): void {
    this.db.exec(authTables);
  }

  routes(): void {
    this.router.post('/auth/user', this.handlers.postUser);
  }
}
