'use strict';
/* Serve /precos.js (via vercel.json) a partir do mesmo catálogo que o servidor usa para cobrar. */
const { CATALOGO } = require('./_lib/catalogo');

module.exports = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.end('window.TURBOGELO_PRECOS=' + JSON.stringify(CATALOGO) + ';');
};
