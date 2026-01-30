// CLIENT
const base = 'http://localhost:3000';

const functions = {
  async getProduct() {
    const response = await fetch(base + '/products/notebook');

    const body = await response.json();
    console.table(body);
  },
};

// terminal: node client.js getProduct;
functions[process.argv[2]]();
