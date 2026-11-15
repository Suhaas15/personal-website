/* Builds the whole page from its parts. Used once at build time and again every time the owner saves edits. */
function buildDocument(o) {
  var json = JSON.stringify(o.data)
    .replace(/</g, '\\u003c')
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029');
  var title = String(o.title).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  var fonts = [
    'family=Big+Shoulders+Display:wght@700;800;900',
    'family=Hanken+Grotesk:wght@400;500;600',
    'family=IBM+Plex+Mono:wght@400;500'
  ].map(function (f) {
    return '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + f + '&display=swap">\n';
  }).join('');
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + title + '</title>\n' + fonts +
    '<style id="app-css">' + o.css + '</style>\n</head>\n<body>\n' +
    '<canvas id="gl" aria-hidden="true"></canvas>\n<div id="app"></div>\n' +
    '<noscript><p style="padding:24px">This site needs JavaScript to show its content.</p></noscript>\n' +
    '<script type="application/json" id="site-data">' + json + '<\/script>\n' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>\n' +
    '<script id="app-js">' + o.js + '<\/script>\n</body>\n</html>\n';
}
