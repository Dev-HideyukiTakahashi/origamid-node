import type { Handler } from '../../core/router.ts';
import { Api } from '../../core/utils/abstract.ts';
import { RouteError } from '../../core/utils/route-error.ts';
import { AuthMiddleware } from './middleware/auth.ts';
import { AuthQuery } from './query.ts';
import { COOKIE_SID_KEY, SessionService } from './services/session.ts';
import { authTables } from './tables.ts';

export class AuthApi extends Api {
  query = new AuthQuery(this.db);
  auth = new AuthMiddleware(this.core);
  session = new SessionService(this.core);

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

    postLogin: async (req, res) => {
      const { email, password } = req.body;

      const user = this.db
        .query(
          /*sql*/ `
        SELECT "id", "password_hash" FROM "users"
        WHERE "email" = ?
        `,
        )
        .get(email);

      if (!user || password !== user.password_hash) {
        throw new RouteError(404, 'email ou senha incorretos');
      }

      const { cookie } = await this.session.create({
        userId: user.id,
        ip: req.ip,
        ua: req.headers['user-agent'] ?? '',
      });

      res.setCookie(cookie);
      res.status(200).json({ title: 'autenticado' });
    },

    getSession: (req, res) => {
      if (!req.session) {
        throw new RouteError(401, 'não autorizado');
      }

      res.status(200).json({ title: 'valido' });
    },

    deleteSession: (req, res) => {
      const sid = req.cookies[COOKIE_SID_KEY];
      const cookie = this.session.invalidate(sid);

      res.setCookie(cookie);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Vary', 'Cookie');
      res.status(204).json({ title: 'logout' });
    },
  } satisfies Api['handlers'];

  tables(): void {
    this.db.exec(authTables);
  }

  routes(): void {
    this.router.post('/auth/user', this.handlers.postUser);
    this.router.post('/auth/login', this.handlers.postLogin);
    this.router.delete('/auth/logout', this.handlers.deleteSession);
    this.router.get('/auth/session', this.handlers.getSession, [this.auth.guard('user')]);
  }
}
