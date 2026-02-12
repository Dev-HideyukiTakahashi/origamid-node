import type { Handler } from '../../core/router.ts';
import { Api } from '../../core/utils/abstract.ts';
import { RouteError } from '../../core/utils/route-error.ts';
import { AuthMiddleware } from '../auth/middleware/auth.ts';
import { LmsQuery } from './query.ts';
import { lmsTables } from './tables.ts';

export class LmsApi extends Api {
  query = new LmsQuery(this.db);
  auth = new AuthMiddleware(this.core);

  handlers: Record<string, Handler> = {
    postCourse: (req, res) => {
      const { slug, title, description, lessons, hours } = req.body;

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
      const { courseSlug, slug, title, seconds, video, description, order, free } = req.body;

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
      const userId = 1;
      const { courseId } = req.body;

      const result = this.query.deleteLessonsCompleted(userId, courseId);

      if (result.changes === 0) {
        throw new RouteError(400, 'erro ao resetar curso');
      }

      res.status(200).json({
        title: 'curso resetado',
      });
    },

    getCertificates: (req, res) => {
      const userId = 1;
      const certificates = this.query.selectCertificates(userId);

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

      const userId = 1;
      let completed = '';
      if (userId) {
        const lessonCompleted = this.query.selectLessonCompleted(userId, lesson.id);
        if (lessonCompleted) completed = lessonCompleted.completed;
      }

      res.status(200).json({ ...lesson, prev, next, completed });
    },

    completeLesson: (req, res) => {
      const userId = 1;
      const { courseId, lessonId } = req.body;

      const result = this.query.insertLessonComplete(userId, courseId, lessonId);

      if (result!.changes === 0) {
        throw new RouteError(400, 'erro ao concluir aula');
      }

      const progress = this.query.selectProgress(userId, courseId);
      const incompleteLessons = progress.filter(item => !item.completed);

      if (progress.length > 0 && incompleteLessons.length === 0) {
        console.log('Gerar certificado');
        const certificate = this.query.insertCertificated(userId, courseId);

        return res.status(201).json({ certificate: certificate!.id, title: 'aula concluída' });
      }

      res.status(201).json({ certificate: 'null', title: 'aula concluída' });
    },
  } satisfies Api['handlers'];

  tables(): void {
    this.db.exec(lmsTables);
  }

  routes(): void {
    this.router.post('/lms/courses', this.handlers.postCourse);
    this.router.get('/lms/courses', this.handlers.getCourses);
    this.router.get('/lms/course/:slug', this.handlers.getCourse, [this.auth.guard('user')]);
    this.router.delete('/lms/course/reset', this.handlers.resetCourse);

    this.router.post('/lms/lessons', this.handlers.postLesson);
    this.router.post('/lms/lesson/complete', this.handlers.completeLesson);
    this.router.get('/lms/lesson/:courseSlug/:lessonSlug', this.handlers.getLesson);

    this.router.get('/lms/certificates', this.handlers.getCertificates);
    this.router.get('/lms/certificate/:id', this.handlers.getCertificate);
  }
}
