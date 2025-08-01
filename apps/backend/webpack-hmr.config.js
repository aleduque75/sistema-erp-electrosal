// apps/backend/webpack-hmr.config.js

// Importe os pacotes no início do arquivo
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin'); // <-- 1. IMPORTE O PLUGIN
const path = require('path');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  externals: [nodeExternals()],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },

  // 2. ADICIONE ESTA SEÇÃO 'resolve' PARA ENSINAR O WEBPACK SOBRE OS ATALHOS
  resolve: {
    plugins: [
      new TsconfigPathsPlugin({
        configFile: './tsconfig.json', // Aponta para o seu tsconfig.json principal
      }),
    ],
    // É uma boa prática também adicionar as extensões que o Webpack deve resolver
    extensions: ['.ts', '.js'],
  },

  // ... O resto das suas configurações (module, etc.) continua aqui
};
