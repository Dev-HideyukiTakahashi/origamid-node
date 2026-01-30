// CLIENT

const base = 'http://localhost:3000';

const response = await fetch(base + '/curso/html');
const body = await response.json();

console.log(body);
const response2 = await fetch(base + '/');

console.log(response.ok, response.status);
console.log(response2.ok, response2.status);
