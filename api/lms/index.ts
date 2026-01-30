import type { Handler } from '../../core/router.ts';
import { Api } from '../../core/utils/core-provider.ts';
import { RouteError } from '../../core/utils/route-error.ts';
import { lmsTables } from './tables.ts';

export class LmsApi extends Api {
  handlers: Record<string, Handler> = {
    postCourses: (req, res) => {
      const { slug, title, description, lessons, hours } = req.body;
      const result = this.db
        .query(
          /*sql*/ `
      INSERT OR IGNORE INTO courses
      (slug, title, description, lessons, hours)
      VALUES
      (?, ?, ?, ?, ?)
      `,
        )
        .run(slug, title, description, lessons, hours);

      if (result.changes === 0) {
        throw new RouteError(400, 'erro ao criar curso');
      }

      res.status(201).json({
        id: result.lastInsertRowid,
        changes: result.changes,
        title: 'curso criado',
      });
    },

    postLessons: (req, res) => {
      const { courseSlug, slug, title, seconds, video, description, order, free } = req.body;

      const result = this.db
        .query(
          /*sql*/ `
      INSERT OR IGNORE INTO lessons
      (course_id, slug, title, seconds, 
        video, description, "order", free)
      VALUES
      ((SELECT id FROM courses 
        WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .run(courseSlug, slug, title, seconds, video, description, order, free);

      if (result.changes === 0) {
        throw new RouteError(400, 'erro ao criar aula');
      }

      res.status(201).json({
        id: result.lastInsertRowid,
        changes: result.changes,
        title: 'aula criada',
      });
    },
  } satisfies Api['handlers'];

  tables(): void {
    this.db.exec(lmsTables);
  }

  routes(): void {
    this.router.post('/lms/courses', this.handlers.postCourses);

    this.router.post('/lms/lessons', this.handlers.postLessons);
  }
}
