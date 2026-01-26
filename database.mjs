// SQLITE

/*sql*/
// veio da extensao es6-string-html, apenas para highlights

import { DatabaseSync } from 'node:sqlite';

// instanciando uma conexão com sqlite, passando como argumento o arquivo onde ficará o db
const db = new DatabaseSync('./db.sqlite');

// criando tabela
db.exec(/*sql*/ `
    CREATE TABLE IF NOT EXISTS "produtos" (
    "slug" TEXT PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "preco" INTEGER NOT NULL
    );
  `);

// preparando para inserir produto com placeholder
const insert = db.prepare(/*sql*/ `
    INSERT OR IGNORE INTO "produtos"
      ("slug", "nome", "categoria", "preco")
    VALUES
    (?, ?, ?, ?)
  `);

// inserindo produto
insert.run('notebook', 'Notebook', 'eletronicos', 4000);
insert.run('mouse', 'Mouse', 'eletronicos', 200);
insert.run('mesa', 'Mesa', 'moveis', 5000);

// lendo todos produtos, 'all()' retorna um array
const produtos = db.prepare(/*sql*/ `SELECT * FROM "produtos"`).all();

console.log('***TODOS PRODUTOS***');
console.log(produtos);
console.log(produtos[1].nome);

// lendo 1 produto, 'get()' retorna o primeiro true
const produto = db
  .prepare(
    /*sql*/
    `
    SELECT * FROM "produtos"
    WHERE "slug" = 'mouse'
  `,
  )
  .get();

console.log('***RETORNANDO UM PRODUTO***');
console.log(produto);
