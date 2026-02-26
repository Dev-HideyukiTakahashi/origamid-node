import type { Handler } from '../../core/router.ts';
import { Api } from '../../core/utils/abstract.ts';
import { RouteError } from '../../core/utils/route-error.ts';
import { AuthMiddleware } from './middleware/auth.ts';
import { AuthQuery } from './query.ts';
import { COOKIE_SID_KEY, SessionService } from './services/session.ts';
import { authTables } from './tables.ts';
import { Password } from './utils/password.ts';
import { validate } from '../../core/utils/validate.ts';
import { rateLimit } from '../../core/middleware/rate-limit.ts';

rateLimit;

export class AuthApi extends Api {
  query = new AuthQuery(this.db);
  auth = new AuthMiddleware(this.core);
  session = new SessionService(this.core);
  pass = new Password('segredo');

  handlers: Record<string, Handler> = {
    postUser: async (req, res) => {
      const { name, username, email, password } = {
        name: validate.string(req.body.name),
        username: validate.string(req.body.username),
        email: validate.email(req.body.email),
        password: validate.password(req.body.password),
      };

      const emailExists = this.query.selectUser('email', email);

      if (emailExists) {
        throw new RouteError(409, 'email existe');
      }

      const usernameExists = this.query.selectUser('username', username);

      if (usernameExists) {
        throw new RouteError(409, 'username existe');
      }

      const password_hash = await this.pass.hashPassword(password);

      const result = this.query.insertUser({ name, username, email, role: 'user', password_hash });

      if (result.changes === 0) {
        throw new RouteError(400, 'erro ao criar usuário');
      }

      res.status(201).json({ title: 'usuário criado' });
    },

    postLogin: async (req, res) => {
      const { email, password } = {
        email: validate.email(req.body.email),
        password: validate.password(req.body.password),
      };

      const user = this.query.selectUser('email', email);

      if (!user) {
        throw new RouteError(404, 'email ou senha incorretos');
      }

      const validPassword = await this.pass.verifyPassword(password, user.password_hash);

      if (!validPassword) {
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

    updatePassword: async (req, res) => {
      const { password, new_password } = {
        password: validate.password(req.body.password),
        new_password: validate.password(req.body.new_password),
      };

      if (!req.session) {
        throw new RouteError(401, 'não autorizado');
      }

      const user = this.query.selectUser('id', req.session.user_id);

      if (!user) {
        throw new RouteError(404, 'usuário não encontrado');
      }

      const validPassword = await this.pass.verifyPassword(password, user.password_hash);

      if (!validPassword) {
        throw new RouteError(400, 'senha atual incorreta');
      }

      const new_password_hash = await this.pass.hashPassword(new_password);
      const updateResult = this.query.updateUser(user.id, 'password_hash', new_password_hash);

      if (updateResult.changes === 0) {
        throw new RouteError(400, 'erro ao atualizar senha');
      }

      this.session.invalidateAll(user.id);
      const { cookie } = await this.session.create({
        userId: user.id,
        ip: req.ip,
        ua: req.headers['user-agent'] || '',
      });

      res.setCookie(cookie);
      res.status(200).json({ title: 'senha atualizada' });
    },

    passwordForgot: async (req, res) => {
      const { email } = {
        email: validate.email(req.body.email),
      };

      const user = this.query.selectUser('email', email);

      if (!user) {
        return res.status(200).json({ title: 'verifique seu email' });
      }

      const { token } = await this.session.resetToken({
        userId: user.id,
        ip: req.ip,
        ua: req.headers['user-agent'] || '',
      });

      const resetLink = `${req.baseurl}/password/reset/?token=${token}`;
      const mailContent = {
        to: user.email,
        subject: 'Password Reset',
        body: `Utilize o link abaixo para resetar a sua senha: \r\n ${resetLink}`,
      };

      console.log(mailContent);
      res.status(200).json({ title: 'verifique seu email' });
    },

    passwordReset: async (req, res) => {
      const { new_password, token } = {
        new_password: validate.password(req.body.new_password),
        token: validate.string(req.body.token),
      };
      const reset = this.session.validateToken(token);

      if (!reset) {
        throw new RouteError(400, 'token inválido');
      }

      const new_password_hash = await this.pass.hashPassword(new_password);
      const updateResult = this.query.updateUser(reset.user_id, 'password_hash', new_password_hash);

      if (updateResult.changes === 0) {
        throw new RouteError(400, 'erro ao atualizar senha');
      }

      res.status(200).json({ title: 'senha atualizada' });
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
    this.router.post('/auth/user', this.handlers.postUser, [rateLimit(30_000, 15)]);
    this.router.post('/auth/login', this.handlers.postLogin, [rateLimit(30_000, 5)]);
    this.router.delete('/auth/logout', this.handlers.deleteSession);
    this.router.put('/auth/update/password', this.handlers.updatePassword, [
      this.auth.guard('user'),
    ]);
    this.router.post('/auth/password/forgot', this.handlers.passwordForgot, [rateLimit(30_000, 5)]);
    this.router.post('/auth/password/reset', this.handlers.passwordReset, [rateLimit(30_000, 5)]);
    this.router.get('/auth/session', this.handlers.getSession, [this.auth.guard('user')]);
  }
}
