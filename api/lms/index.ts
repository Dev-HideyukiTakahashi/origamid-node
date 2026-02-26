import type { Handler } from '../../core/router.ts';
import { Api } from '../../core/utils/abstract.ts';
import { RouteError } from '../../core/utils/route-error.ts';
import { validate } from '../../core/utils/validate.ts';
import { AuthMiddleware } from '../auth/middleware/auth.ts';
import { LmsQuery } from './query.ts';
import { lmsTables } from './tables.ts';

export class LmsApi extends Api {
  query = new LmsQuery(this.db);
  auth = new AuthMiddleware(this.core);

  handlers: Record<string, Handler> = {
    postCourse: (req, res) => {
      if (!req.session) {
        throw new RouteError(401, 'não autorizado');
      }

      // validando dados
      const { slug, title, description, lessons, hours } = {
        slug: validate.string(req.body.slug),
        title: validate.string(req.body.title),
        description: validate.string(req.body.description),
        lessons: validate.number(req.body.lessons),
        hours: validate.number(req.body.hours),
      };

      const result = this.query.insertCourse({ slug, title, description, lessons, hours });

      if (result.changes === 0) {
        throw new RouteError(400, 'erro ao criar curso');
      }

      res.status(201).json({
        id: result.lastInsertRowid,
        changes: result.changes,
        title: 'curso criado',
      });
    },

    postLesson: (req, res) => {
      if (!req.session) {
        throw new RouteError(401, 'não autorizado');
      }
      // validando dados
      const { courseSlug, slug, title, seconds, video, description, order, free } = {
        courseSlug: validate.string(req.body.slug),
        slug: validate.string(req.body.slug),
        title: validate.string(req.body.slug),
        seconds: validate.number(req.body.slug),
        video: validate.string(req.body.slug),
        description: validate.string(req.body.slug),
        order: validate.number(req.body.slug),
        free: validate.number(req.body.slug),
      };

      const result = this.query.insertLesson({
        courseSlug,
        slug,
        title,
        seconds,
        video,
        description,
        order,
        free,
      });

      if (result.changes === 0) {
        throw new RouteError(400, 'erro ao criar aula');
      }

      res.status(201).json({
        id: result.lastInsertRowid,
        changes: result.changes,
        title: 'aula criada',
      });
    },

    getCourses: (req, res) => {
      const result = this.query.selectCourses();

      res.status(200).json(result);
    },

    getCourse: (req, res) => {
      const { slug } = req.params;
      const course = this.query.selectCourse(slug);
      const lessons = this.query.selectLessons(slug);

      if (!course) {
        throw new RouteError(404, 'curso não encontrado');
      }

      let completed: {
        lesson_id: number;
        completed: string;
      }[] = [];

      if (req.session) {
        completed = this.query.selectLessonsCompleted(req.session.user_id, course.id);
      }

      res.status(200).json({ course, lessons, completed });
    },

    resetCourse: (req, res) => {
      if (!req.session) {
        throw new RouteError(401, 'não autorizado');
      }

      const { courseId } = {
        courseId: validate.number(req.body.courseId),
      };

      const result = this.query.deleteLessonsCompleted(req.session.user_id, courseId);

      if (result.changes === 0) {
        throw new RouteError(400, 'erro ao resetar curso');
      }

      res.status(200).json({
        title: 'curso resetado',
      });
    },

    getCertificates: (req, res) => {
      if (!req.session) {
        throw new RouteError(401, 'não autorizado');
      }

      const certificates = this.query.selectCertificates(req.session.user_id);

      if (certificates.length === 0) {
        throw new RouteError(404, 'nenhum certificado encontrado');
      }

      res.status(200).json(certificates);
    },

    getCertificate: (req, res) => {
      const { id } = req.params;
      const certificate = this.query.selectCertificate(id);

      if (!certificate) {
        throw new RouteError(404, 'certificado não encontrado');
      }

      res.status(200).json(certificate);
    },

    getLesson: (req, res) => {
      const { courseSlug, lessonSlug } = req.params;
      const lesson = this.query.selectLesson(courseSlug, lessonSlug);

      const nav = this.query.selectLessonNav(courseSlug, lessonSlug);

      if (!lesson) {
        throw new RouteError(404, 'aula não encontrada');
      }

      const index = nav.findIndex(lessonItem => lessonItem.slug === lesson.slug);
      const prev = index === 0 ? null : nav.at(index - 1)?.slug;
      const next = nav.at(index + 1)?.slug ?? null;

      let completed = '';
      if (req.session) {
        const lessonCompleted = this.query.selectLessonCompleted(req.session.user_id, lesson.id);
        if (lessonCompleted) completed = lessonCompleted.completed;
      }

      res.status(200).json({ ...lesson, prev, next, completed });
    },

    completeLesson: (req, res) => {
      if (!req.session) {
        throw new RouteError(401, 'não autorizado');
      }

      const { courseId, lessonId } = {
        courseId: validate.number(req.body.courseId),
        lessonId: validate.number(req.body.lessonId),
      };

      const result = this.query.insertLessonComplete(req.session.user_id, courseId, lessonId);

      if (result!.changes === 0) {
        throw new RouteError(400, 'erro ao concluir aula');
      }

      const progress = this.query.selectProgress(req.session.user_id, courseId);
      const incompleteLessons = progress.filter(item => !item.completed);

      if (progress.length > 0 && incompleteLessons.length === 0) {
        console.log('Gerar certificado');
        const certificate = this.query.insertCertificated(req.session.user_id, courseId);

        return res.status(201).json({ certificate: certificate!.id, title: 'aula concluída' });
      }

      res.status(201).json({ certificate: 'null', title: 'aula concluída' });
    },
  } satisfies Api['handlers'];

  tables(): void {
    this.db.exec(lmsTables);
  }

  routes(): void {
    this.router.post('/lms/courses', this.handlers.postCourse, [this.auth.guard('admin')]);
    this.router.post('/lms/lessons', this.handlers.postLesson, [this.auth.guard('admin')]);
    this.router.get('/lms/courses', this.handlers.getCourses);
    this.router.get('/lms/course/:slug', this.handlers.getCourse, [this.auth.guard('user')]);
    this.router.delete('/lms/course/reset', this.handlers.resetCourse, [this.auth.guard('user')]);

    this.router.post('/lms/lesson/complete', this.handlers.completeLesson, [
      this.auth.guard('user'),
    ]);
    this.router.get('/lms/lesson/:courseSlug/:lessonSlug', this.handlers.getLesson, [
      this.auth.optional,
    ]);

    this.router.get('/lms/certificates', this.handlers.getCertificates, [this.auth.guard('user')]);
    this.router.get('/lms/certificate/:id', this.handlers.getCertificate);
  }
}
