// SERVER

import { createServer } from 'node:http';
import { customRequest } from './custom-request.ts';
import { customResponse } from './custom-response.ts';
import { Router } from './router.ts';
import {
  criarAula,
  criarCurso,
  pegarAula,
  pegarAulas,
  pegarCurso,
  pegarCursos,
} from './database.ts';

// ROTAS
const router = new Router();

router.post('/cursos', (req, res) => {
  const { slug, nome, descricao } = req.body;
  const criado = criarCurso({ slug, nome, descricao });

  if (criado) {
    res.status(201).json('curso criado');
  } else {
    res.status(400).json('erro ao criar curso');
  }
});

router.post('/aulas', (req, res) => {
  const { slug, nome, cursoSlug } = req.body;
  const criada = criarAula({ slug, nome, cursoSlug });

  if (criada) {
    res.status(201).json('aula criado');
  } else {
    res.status(400).json('erro ao criar aula');
  }
});

router.get('/cursos', (req, res) => {
  const cursos = pegarCursos();

  res.status(200).json(cursos);
});

router.get('/curso', (req, res) => {
  const slug = req.query.get('slug');
  const curso = pegarCurso(slug);

  if (curso) {
    res.status(200).json(curso);
  } else {
    res.status(404).json({ message: 'Curso não encontrado' });
  }
});

router.get('/aulas', (req, res) => {
  const aulas = pegarAulas();

  res.status(200).json(aulas);
});

router.get('/aula', (req, res) => {
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

// MAIN
const server = createServer(async (request, response) => {
  const req = await customRequest(request);
  const res = await customResponse(response);

  const handler = router.find(req.method || '', req.pathname);

  if (handler) {
    handler(req, res);
  } else {
    res.status(404).end('Não encontrado');
  }
});

server.listen(3000, () => {
  console.log('Server is running at port 3000');
});
