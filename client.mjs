// CLIENT

const base = 'http://localhost:3000';

const response = await fetch(base + '/curso/javascript');
const response2 = await fetch(base + '/');

console.log(response.ok, response.status);
console.log(response2.ok, response2.status);
