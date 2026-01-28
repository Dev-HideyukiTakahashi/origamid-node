// CLIENT

const base = 'http://localhost:3000';

await fetch(base + '/cursos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    slug: 'html',
    nome: 'html',
    descricao: 'Curso de html',
  }),
});

await fetch(base + '/aulas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    slug: 'arrays',
    nome: 'arrays',
    cursoSlug: 'javascript',
  }),
});
