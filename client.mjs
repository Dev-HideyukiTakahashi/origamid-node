// CLIENT

const response = await fetch('http://localhost:3000/produtos?cor=azul', {
  method: 'POST',
  // headers: {
  //   'Content-Type': 'application/json',
  // },
  // body: JSON.stringify({ username: 'John', password: '123456' }),
});

const body = await response.text();

console.log(body);
console.log(response);
