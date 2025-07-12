
const { https } = require('firebase-functions');
const { default: next } = require('next');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

const nextApp = next({
  dev: isDev,
  conf: {
    distDir: path.join('.next'),
  },
});

const nextHandle = nextApp.getRequestHandler();

exports.nextServer = https.onRequest((req, res) => {
  return nextApp.prepare().then(() => nextHandle(req, res));
});
