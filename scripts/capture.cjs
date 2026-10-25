const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB = 'C:\\Users\\tj\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const TARGET_DIR = path.resolve(__dirname, '../screenshots');

function capture(filename) {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }
  const destPath = path.join(TARGET_DIR, filename);
  try {
    execSync(`"${ADB}" -s emulator-5554 shell screencap -p /sdcard/screen_temp.png`, { stdio: 'pipe' });
    execSync(`"${ADB}" -s emulator-5554 pull /sdcard/screen_temp.png "${destPath}"`, { stdio: 'pipe' });
    
    // verify header
    const buf = Buffer.alloc(8);
    const fd = fs.openSync(destPath, 'r');
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const size = fs.statSync(destPath).size;
    if (!isPng || size < 1000) {
      console.error(`ERROR: ${filename} is NOT a valid PNG! Size: ${size}`);
      process.exit(1);
    }
    console.log(`[CAPTURED & VERIFIED] ${filename} (${size} bytes)`);
  } catch (err) {
    console.error(`FAILED to capture ${filename}:`, err.message);
    process.exit(1);
  }
}

const targetName = process.argv[2];
if (!targetName) {
  console.error("Usage: node capture.cjs <filename.png>");
  process.exit(1);
}

capture(targetName);
