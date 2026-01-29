import { Core } from './core/core.ts';
import { pegarCurso } from './core/database.ts';

const core = new Core();

core.router.get('/curso/:slug', (req, res) => {
  const { slug } = req.params;
  const curso = pegarCurso(slug);

  if (curso) {
    res.status(200).json(curso);
  } else {
    res.status(404).json({ message: 'Curso não encontrado' });
  }
});

core.router.get('/', (req, res) => {
  res.status(200).json('ola');
});

core.router.get('/aula/:aula', (req, res) => {
  res.status(200).json('aula');
});

core.init();
