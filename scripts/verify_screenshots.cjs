const fs = require('fs');
const path = require('path');
const dir = 'D:/ReactProjects/fitness-tracker-native/screenshots';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();

console.log('Total PNG files found:', files.length);
let allValid = true;

files.forEach((f, i) => {
  const p = path.join(dir, f);
  const stat = fs.statSync(p);
  const buf = Buffer.alloc(8);
  const fd = fs.openSync(p, 'r');
  fs.readSync(fd, buf, 0, 8, 0);
  fs.closeSync(fd);
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (!isPng || stat.size === 0) allValid = false;
  console.log(`${(i+1).toString().padStart(2, '0')}. ${f.padEnd(46, ' ')} ${(stat.size / 1024).toFixed(1).padStart(6, ' ')} KB | Valid PNG: ${isPng}`);
});

console.log('ALL SCREENSHOTS 100% VALID & HEALTHY:', allValid);
