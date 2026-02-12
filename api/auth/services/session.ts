import { CoreProvider } from '../../../core/utils/abstract.ts';
import { AuthQuery } from '../query.ts';
import { randomBytesAsync, sha256 } from '../utils.ts';

export const COOKIE_SID_KEY = '__Secure-sid';
const SESSION_TTL_SEC = 60 * 60 * 24 * 15;
const SESSION_TTL_SEC_5_DAYS = 60 * 60 * 24 * 5;

function sidCookie(sid: string, expires: number) {
  return `${COOKIE_SID_KEY}=${sid}; Path=/; Max-Age=${expires}; HttpOnly; Secure;SameSite=Lax`;
}

export class SessionService extends CoreProvider {
  query = new AuthQuery(this.db);

  async create({ userId, ip, ua }: any) {
    const sid = (await randomBytesAsync(32)).toString('base64url');
    const sid_hash = sha256(sid);

    const expires_ms = Date.now() + SESSION_TTL_SEC * 1000;

    this.query.insertSession({ sid_hash, expires_ms, user_id: userId, ip, ua });

    const cookie = sidCookie(sid, SESSION_TTL_SEC);

    return { cookie };
  }

  validate(sid: string) {
    const now = Date.now();
    const sid_hash = sha256(sid);
    const session = this.query.selectSession(sid_hash);

    if (!session || session.revoked === 1) return { valid: false, cookie: sidCookie('', 0) };

    let expires_ms = session.expires_ms;
    if (now >= expires_ms) {
      this.query.revokeSession('sid_hash', sid_hash);
      return { valid: false, cookie: sidCookie('', 0) };
    }

    if (now >= expires_ms - 1000 * SESSION_TTL_SEC_5_DAYS) {
      const expires_msUpdate = now + 1000 * SESSION_TTL_SEC;
      this.query.updateSessionExpires(sid_hash, expires_msUpdate);

      expires_ms = expires_msUpdate;
    }

    const user = this.query.selectUserRole(session.user_id);
    if (!user) {
      this.query.revokeSession('sid_hash', sid_hash);
      return { valid: false, cookie: sidCookie('', 0) };
    }

    return {
      valid: true,
      cookie: sidCookie(sid, Math.floor((expires_ms - now) / 1000)),
      session: {
        user_id: session.user_id,
        role: user.role,
        expires_ms,
      },
    };
  }

  invalidate(sid: string | undefined) {
    const cookie = sidCookie('', 0);

    try {
      if (sid) {
        const sid_hash = sha256(sid);
        this.query.revokeSession('sid_hash', sid_hash);
      }
    } catch (error) {}

    return cookie;
  }
}
