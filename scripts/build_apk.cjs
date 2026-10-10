const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const jdk17Path = 'C:\\Users\\tj\\.jdk\\jdk-17.0.14+7';
const jbrPath = fs.existsSync(jdk17Path) ? jdk17Path : 'C:\\Program Files\\Android\\Android Studio\\jbr';

console.log('🔨 Step 1: Compiling standalone Release APK with offline JS bundle...');
const env = { ...process.env };
const sdkPath = 'C:\\Users\\tj\\AppData\\Local\\Android\\Sdk';
if (fs.existsSync(sdkPath)) {
  env.ANDROID_HOME = sdkPath;
}
env.JAVA_HOME = jbrPath;
env.PATH = `${path.join(jbrPath, 'bin')};${env.PATH}`;

// Run assembleRelease to bundle the offline JS and assets into the APK
const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat assembleRelease' : './gradlew assembleRelease';
execSync(gradlewCmd, { cwd: androidDir, env, stdio: 'inherit' });

console.log('\n📦 Step 2: Copying standalone APK to project root...');
const srcApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const destApk = path.join(rootDir, 'SPOTTER-standalone.apk');
const legacyApk = path.join(rootDir, 'KINETIC-standalone.apk');

if (fs.existsSync(srcApk)) {
  fs.copyFileSync(srcApk, destApk);
  fs.copyFileSync(srcApk, legacyApk);
  const stats = fs.statSync(destApk);
  const mb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 SUCCESS! Standalone offline APK generated at:`);
  console.log(`   ${destApk} (${mb} MB)`);
  console.log(`\n📲 This APK contains the offline JavaScript bundle and all assets.`);
  console.log(`   You can install it on any Android phone without a computer or Metro bundler!`);
} else {
  console.error('❌ Could not locate generated release APK at:', srcApk);
}
