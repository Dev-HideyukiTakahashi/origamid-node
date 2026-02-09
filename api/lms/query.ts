import { Query } from '../../core/utils/abstract.ts';

type CourseData = {
  id: number;
  slug: string;
  title: string;
  description: string;
  lessons: number;
  hours: number;
  created: string;
};

type LessonData = {
  id: number;
  course_id: number;
  slug: string;
  title: string;
  seconds: number;
  video: string;
  description: string;
  order: number;
  free: number;
  created: string;
};

type CertificateFullData = {
  id: string;
  name: string;
  title: string;
  hours: number;
  lessons: number;
  completed: string;
};

type CourseCreate = Omit<CourseData, 'id' | 'created'>;
type LessonCreate = Omit<LessonData, 'id' | 'course_id' | 'created'> & {
  courseSlug: string;
};

export class LmsQuery extends Query {
  insertCourse({ slug, title, description, lessons, hours }: CourseCreate) {
    return this.db
      .query(
        /*sql*/ `
          INSERT OR IGNORE INTO courses
          (slug, title, description, lessons, hours)
          VALUES
          (?, ?, ?, ?, ?)
          `,
      )
      .run(slug, title, description, lessons, hours);
  }

  insertLesson({
    courseSlug,
    slug,
    title,
    seconds,
    video,
    description,
    order,
    free,
  }: LessonCreate) {
    return this.db
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
  }

  selectCourses() {
    return this.db
      .query(
        /*sql*/ `
      SELECT * FROM courses ORDER BY created LIMIT 100;
    `,
      )
      .all() as CourseData[];
  }

  selectCourse(slug: string) {
    return this.db
      .query(
        /*sql*/ `
      SELECT * FROM courses 
      WHERE slug = ?;
    `,
      )
      .get(slug) as CourseData | undefined;
  }

  selectLessons(courseSlug: string) {
    return this.db
      .query(
        /*sql*/ `
      SELECT * FROM lessons
      WHERE course_id = 
        (SELECT id FROM courses WHERE slug = ?);
      ORDER BY "order" ASC
    `,
      )
      .all(courseSlug) as LessonData[];
  }

  selectLesson(courseSlug: string, lessonSlug: string) {
    return this.db
      .query(
        /*sql*/ `
      SELECT * FROM lessons
      WHERE course_id = 
        (SELECT id FROM courses WHERE slug = ?)
      AND slug = ?
    `,
      )
      .get(courseSlug, lessonSlug) as LessonData;
  }

  selectLessonNav(courseSlug: string, lessonSlug: string) {
    return this.db
      .query(
        /*sql*/ `
      SELECT slug FROM lesson_nav
      WHERE course_id = 
        (SELECT id FROM courses WHERE slug = ?)
      AND current_slug = ?
    `,
      )
      .all(courseSlug, lessonSlug) as { slug: string }[];
  }

  insertLessonComplete(userId: number, courseId: number, lessonId: number) {
    try {
      return this.db
        .query(
          /*sql*/ `
      INSERT OR IGNORE INTO lessons_completed
      (user_id, course_id, lesson_id)
      VALUES
      (?,?,?)
    `,
        )
        .run(userId, courseId, lessonId);
    } catch (error) {
      console.log(error);
    }
  }

  selectLessonCompleted(userId: number, lessonId: number) {
    return this.db
      .query(
        /*sql*/ `
        SELECT completed FROM lessons_completed
        WHERE user_id = ? AND lesson_id = ?
      `,
      )
      .get(userId, lessonId) as { completed: string } | undefined;
  }

  selectLessonsCompleted(userId: number, courseId: number) {
    return this.db
      .query(
        /*sql*/ `
        SELECT lesson_id, completed FROM lessons_completed
        WHERE user_id = ? AND course_id = ?
      `,
      )
      .all(userId, courseId) as { lesson_id: number; completed: string }[];
  }

  deleteLessonsCompleted(userId: number, courseId: number) {
    return this.db
      .query(
        /*sql*/ `
        DELETE FROM lessons_completed
        WHERE user_id = ? AND course_id = ?
      `,
      )
      .run(userId, courseId);
  }

  selectProgress(userId: number, courseId: number) {
    return this.db
      .query(
        /*sql*/ `
        SELECT l.id, lc.completed 
        FROM lessons as l
        LEFT JOIN lessons_completed as lc
        ON l.id = lc.lesson_id AND lc.user_id = ?
        WHERE l.course_id = ?
      `,
      )
      .all(courseId, userId) as { id: number; completed: string }[];
  }

  insertCertificated(userId: number, courseId: number) {
    return this.db
      .query(
        /*sql*/ `
        INSERT OR IGNORE INTO certificates
        (user_id, course_id)
        VALUES
        (?, ?)
        RETURNING "id"
      `,
      )
      .get(courseId, userId) as { id: string | undefined };
  }

  selectCertificates(userId: number) {
    return this.db
      .query(
        /*sql*/ `
        SELECT * FROM certificates_full
        WHERE user_id = ?
      `,
      )
      .all(userId) as CertificateFullData[];
  }

  selectCertificate(certificateId: string) {
    return this.db
      .query(
        /*sql*/ `
        SELECT * FROM certificates_full
        WHERE id = ?
      `,
      )
      .get(certificateId) as CertificateFullData | undefined;
  }
}
