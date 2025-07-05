// Importe o pacote no início do arquivo
const nodeExternals = require('webpack-node-externals');
const path = require('path'); // Exemplo de outra importação comum

module.exports = {
  // ... outras configurações do seu webpack como 'entry'
  entry: './src/main.ts', // ou o que for seu ponto de entrada

  // GARANTA QUE ESTA LINHA EXISTA
  target: 'node',

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },

  // ADICIONE ESTA LINHA
  externals: [nodeExternals()],

  // ... resto das suas configurações (module, resolve, plugins, etc.)
};
