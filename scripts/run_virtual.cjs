const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const sdkPath = 'C:\\Users\\tj\\AppData\\Local\\Android\\Sdk';
const adbPath = path.join(sdkPath, 'platform-tools', 'adb.exe');
const emulatorPath = path.join(sdkPath, 'emulator', 'emulator.exe');
const avdName = 'Medium_Phone_API_37.0';
const spotterApk = path.resolve(__dirname, '..', 'SPOTTER-standalone.apk');
const kineticApk = path.resolve(__dirname, '..', 'KINETIC-standalone.apk');
const apkPath = fs.existsSync(spotterApk) ? spotterApk : kineticApk;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (err) {
    return '';
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 [1/4] Checking Android Virtual Device status...');

  // Check if emulator is already attached
  let devicesOutput = run(`"${adbPath}" devices`);
  let isRunning = devicesOutput.includes('emulator-');

  if (!isRunning) {
    console.log(`📱 Launching virtual phone "${avdName}" in the background with host GPU acceleration...`);
    const emuProc = spawn(emulatorPath, ['-avd', avdName], {
      detached: true,
      stdio: 'ignore',
    });
    emuProc.unref();

    console.log('⏳ Waiting for virtual phone to start...');
    execSync(`"${adbPath}" wait-for-device`, { stdio: 'inherit' });
  } else {
    console.log('✅ Virtual phone is already running!');
  }

  // Wait until system boot is fully completed
  console.log('⏳ [2/4] Waiting for Android OS to finish booting...');
  let booted = false;
  let attempts = 0;
  while (!booted && attempts < 60) {
    const prop = run(`"${adbPath}" shell getprop sys.boot_completed`);
    if (prop === '1') {
      booted = true;
      break;
    }
    await sleep(2000);
    attempts++;
  }

  if (!booted) {
    console.warn('⚠️ Timed out waiting for boot_completed, proceeding with installation...');
  } else {
    console.log('✅ Virtual phone OS booted successfully!');
  }

  // Install APK (uninstall old version first to avoid signature conflict)
  console.log('📦 [3/4] Installing KINETIC-standalone.apk onto virtual phone...');
  if (!fs.existsSync(apkPath)) {
    console.error('❌ APK not found at:', apkPath);
    process.exit(1);
  }
  try {
    execSync(`"${adbPath}" install -r "${apkPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️ Signature mismatch or upgrade conflict detected. Reinstalling cleanly...');
    run(`"${adbPath}" uninstall com.kinetic.fitnesstracker`);
    execSync(`"${adbPath}" install -r "${apkPath}"`, { stdio: 'inherit' });
  }

  // Launch the App
  console.log('🎯 [4/4] Launching KINETIC app on virtual phone screen...');
  run(`"${adbPath}" shell monkey -p com.kinetic.fitnesstracker -c android.intent.category.LAUNCHER 1`);

  console.log('\n🎉 ALL DONE! The KINETIC app is now open on your virtual phone!');
}

main().catch(console.error);
