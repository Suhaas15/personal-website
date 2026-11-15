const fs = require('fs');
const vm = require('vm');
const path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

const shell = src('shell.js');
const app = src('app.js');
const css = src('style.css');
const data = JSON.parse(src('data.json'));
const js = '\n' + shell + '\n' + app + '\n';

if (/<\/script/i.test(js) || /<!--/.test(js)) throw new Error('script source contains a sequence that would break inline embedding');
if (/<\/style/i.test(css)) throw new Error('css contains </style');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(shell + '\nthis.buildDocument = buildDocument;', ctx);
const html = ctx.buildDocument({ title: data.profile.name, css, js, data });
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('built index.html', (html.length / 1024).toFixed(1) + ' KB');
