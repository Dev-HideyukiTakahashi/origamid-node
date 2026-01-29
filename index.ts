import { Core } from './core/core.ts';
import {
  criarAula,
  criarCurso,
  pegarAula,
  pegarAulas,
  pegarCurso,
  pegarCursos,
} from './core/database.ts';

const core = new Core();

core.router.post('/cursos', (req, res) => {
  const { slug, nome, descricao } = req.body;
  const criado = criarCurso({ slug, nome, descricao });

  if (criado) {
    res.status(201).json('curso criado');
  } else {
    res.status(400).json('erro ao criar curso');
  }
});

core.router.post('/aulas', (req, res) => {
  const { slug, nome, cursoSlug } = req.body;
  const criada = criarAula({ slug, nome, cursoSlug });

  if (criada) {
    res.status(201).json('aula criado');
  } else {
    res.status(400).json('erro ao criar aula');
  }
});

core.router.get('/cursos', (req, res) => {
  const cursos = pegarCursos();

  res.status(200).json(cursos);
});

core.router.get('/curso', (req, res) => {
  const slug = req.query.get('slug');
  const curso = pegarCurso(slug);

  if (curso) {
    res.status(200).json(curso);
  } else {
    res.status(404).json({ message: 'Curso não encontrado' });
  }
});

core.router.get('/aulas', (req, res) => {
  const aulas = pegarAulas();

  res.status(200).json(aulas);
});

core.router.get('/aula', (req, res) => {
  const curso = req.query.get('curso');
  const slug = req.query.get('slug');
  const aula = pegarAula(curso, slug);

  console.log(curso);
  console.log(slug);

  if (aula) {
    res.status(200).json(aula);
  } else {
    res.status(404).json({ message: 'Aula não encontrada' });
  }
});

core.router.get('/', (req, res) => {
  res.status(200).end('Hello');
});

core.init();
