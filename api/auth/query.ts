import { Query } from '../../core/utils/abstract.ts';

export type UserRole = 'admin' | 'editor' | 'user';

type UserData = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  password_hash: string;
  created: string;
  updated: string;
};

type UserCreate = Omit<UserData, 'id' | 'created' | 'updated'>;

type SessionData = {
  sid_hash: Buffer;
  user_id: number;
  created: number;
  expires: number;
  ip: string;
  ua: string;
  revoked: number; // 0|1
};

type SessionCreate = Omit<SessionData, 'created' | 'revoked' | 'expires'> & {
  expires_ms: number;
};

export class AuthQuery extends Query {
  insertUser({ name, username, email, role, password_hash }: UserCreate) {
    return this.db
      .query(
        /*sql*/ `
      INSERT OR IGNORE INTO "users"
      ("name", "username", "email", "role", "password_hash")
      VALUES
      (?, ?, ?, ?, ?)
      `,
      )
      .run(name, username, email, role, password_hash);
  }

  insertSession({ sid_hash, user_id, expires_ms, ip, ua }: SessionCreate) {
    try {
      return this.db
        .query(
          /*sql*/ `
      INSERT OR IGNORE INTO "sessions"
      ("sid_hash", "user_id", "expires", "ip", "ua")
      VALUES
      (?, ?, ?, ?, ?)
      `,
        )
        .run(sid_hash, user_id, Math.floor(expires_ms / 1000), ip, ua);
    } catch (error) {
      console.log(error);
    }
  }

  selectSession(sid_hash: Buffer) {
    try {
      return this.db
        .query(
          /*sql*/ `
          SELECT "s".*, "s"."expires" * 1000 as "expires_ms" FROM "sessions" as "s"
          WHERE "sid_hash" = ?`,
        )
        .get(sid_hash) as (SessionData & { expires_ms: number }) | undefined;
    } catch (error) {
      console.log(error);
    }
  }

  revokeSession(key: 'sid_hash' | 'user_id', sid_hash: Buffer) {
    try {
      return this.db
        .query(
          /*sql*/ `
          UPDATE "sessions"
          SET "revoked" = 1
          WHERE ${key} = ?`,
        )
        .run(sid_hash);
    } catch (error) {
      console.log(error);
    }
  }

  updateSessionExpires(sid_hash: Buffer, expires_ms: number) {
    try {
      return this.db
        .query(
          /*sql*/ `
          UPDATE "sessions"
          SET "expires" = ?
          WHERE "sid_hash" = ?`,
        )
        .run(Math.floor(expires_ms) / 1000, sid_hash);
    } catch (error) {
      console.log(error);
    }
  }

  selectUserRole(id: number) {
    try {
      return this.db
        .query(
          /*sql*/ `
          SELECT "role" FROM "users"
          WHERE "id" = ?`,
        )
        .get(id) as { role: UserRole } | undefined;
    } catch (error) {
      console.log(error);
    }
  }
}
