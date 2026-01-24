// CLIENT

// GET - produto com query
const notebookResp = await fetch(
  'http://localhost:3000/produto?categoria=eletronicos&slug=notebook',
);
const notebook = await notebookResp.json();
console.log(notebook);

// GET - lista produtos
const produtosResp = await fetch('http://localhost:3000/produtos');
const produtos = await produtosResp.json();
console.log(produtos);

// POST - novo produto
const response = await fetch('http://localhost:3000/produtos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nome: 'notebook',
    slug: 'notebook',
    categoria: 'eletronicos',
    preco: 4000,
  }),
});

await fetch('http://localhost:3000/produtos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nome: 'Mesa',
    slug: 'mesa',
    categoria: 'moveis',
    preco: 2000,
  }),
});

await fetch('http://localhost:3000/produtos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nome: 'Mouse',
    slug: 'mouse',
    categoria: 'eletronicos',
    preco: 200,
  }),
});
