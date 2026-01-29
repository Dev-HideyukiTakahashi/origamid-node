// SQLITE

/*sql*/
// veio da extensao es6-string-html, apenas para highlights

import { DatabaseSync } from 'node:sqlite';

// instanciando uma conexão com sqlite, passando como argumento o arquivo onde ficará o db
const db = new DatabaseSync('./lms.sqlite');

db.exec(`
  PRAGMA foreign_keys = 1;
  PRAGMA journal_mode = DELETE;
  PRAGMA synchronous = NORMAL;

  PRAGMA cache_size = 2000;
  PRAGMA busy_timeout = 5000;
  PRAGMA temp_store = MEMORY;
`);

db.exec(/*sql*/ `
  CREATE TABLE IF NOT EXISTS "cursos" (
    "id" INTEGER PRIMARY KEY,
    "slug" TEXT NOT NULL COLLATE NOCASE UNIQUE,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS "aulas" (
    "id" INTEGER PRIMARY KEY,
    "curso_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL COLLATE NOCASE,
    "nome" TEXT NOT NULL,
    FOREIGN KEY("curso_id") REFERENCES "cursos" ("id"),
    UNIQUE("curso_id", "slug")
  ) STRICT;
`);

export function criarCurso({ slug, nome, descricao }) {
  try {
    return db
      .prepare(
        /*sql*/ `
  INSERT OR IGNORE INTO cursos 
    (slug, nome, descricao)
  VALUES
    (?, ?, ?)
  `,
      )
      .run(slug, nome, descricao);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function criarAula({ slug, nome, cursoSlug }) {
  try {
    return db
      .prepare(
        /*sql*/ `
  INSERT OR IGNORE INTO aulas 
    (slug, nome, curso_id)
  VALUES
    (?, ?, (SELECT id FROM cursos WHERE slug = ?))
  `,
      )
      .run(slug, nome, cursoSlug);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function pegarCursos() {
  try {
    return db
      .prepare(
        /*sql*/ `
     SELECT * FROM cursos
  `,
      )
      .all();
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function pegarCurso(slug) {
  try {
    return db
      .prepare(
        /*sql*/ `
      SELECT * FROM cursos
      WHERE slug = ?
  `,
      )
      .get(slug);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function pegarAulas() {
  try {
    return db
      .prepare(
        /*sql*/ `
     SELECT * FROM aulas
  `,
      )
      .all();
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function pegarAula(curso, slug) {
  try {
    return db
      .prepare(
        /*sql*/ `
      SELECT * FROM aulas
      WHERE curso_id = (SELECT id FROM cursos WHERE slug = ? ) 
      AND slug = ?
  `,
      )
      .get(curso, slug);
  } catch (error) {
    console.log(error);
    return null;
  }
}
