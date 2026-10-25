const fs = require('fs');
const xml = fs.readFileSync('dump.xml', 'utf8');

const regex = /<node\s+([^>]+)>/g;
let match;
while ((match = regex.exec(xml)) !== null) {
  const attrs = match[1];
  const getAttr = (name) => {
    const m = attrs.match(new RegExp(`${name}="([^"]*)"`));
    return m ? m[1] : '';
  };
  const cls = getAttr('class');
  const text = getAttr('text');
  const cd = getAttr('content-desc');
  const bounds = getAttr('bounds');
  if (cls.includes('EditText') || cd.includes('SIGN IN TO') || text.includes('SIGN IN TO')) {
    console.log(`CLASS: ${cls} | TEXT: "${text}" | CD: "${cd}" | BOUNDS: ${bounds}`);
  }
}
