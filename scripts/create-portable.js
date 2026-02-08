/**
 * Creates a portable ZIP of the built Tauri app (Windows).
 * Run after: npm run tauri build
 * Output: src-tauri/target/release/bundle/<ProductName>_<version>_x64-portable.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const srcTauri = path.join(rootDir, 'src-tauri');
const releaseDir = path.join(srcTauri, 'target', 'release');
const bundleDir = path.join(releaseDir, 'bundle');

// Read config
const tauriConfPath = path.join(srcTauri, 'tauri.conf.json');
const cargoPath = path.join(srcTauri, 'Cargo.toml');

if (!fs.existsSync(tauriConfPath) || !fs.existsSync(cargoPath)) {
  console.error('tauri.conf.json or Cargo.toml not found');
  process.exit(1);
}

const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
const cargoContent = fs.readFileSync(cargoPath, 'utf8');
const packageNameMatch = cargoContent.match(/^name\s*=\s*"([^"]+)"/m);
const binaryName = packageNameMatch ? packageNameMatch[1] : 'help-me-write';

const productName = tauriConf.productName || 'App';
const version = tauriConf.version || '0.0.0';
const exeName = binaryName + '.exe';
const exePath = path.join(releaseDir, exeName);
const resourcesDir = path.join(releaseDir, 'resources');

if (!fs.existsSync(exePath)) {
  console.error('Built executable not found:', exePath);
  console.error('Run "npm run tauri build" first.');
  process.exit(1);
}

// Portable folder name (no path-unsafe chars)
const safeName = productName.replace(/[<>:"/\\|?*]/g, '');
const portableDirName = `${safeName} ${version} portable`;
const portableDir = path.join(releaseDir, portableDirName);
const zipName = `${safeName}_${version}_x64-portable.zip`;
const zipPath = path.join(bundleDir, zipName);

// Clean previous portable dir
if (fs.existsSync(portableDir)) {
  fs.rmSync(portableDir, { recursive: true });
}

fs.mkdirSync(portableDir, { recursive: true });

// Copy exe
fs.copyFileSync(exePath, path.join(portableDir, exeName));

// Copy resources if present
if (fs.existsSync(resourcesDir)) {
  const destResources = path.join(portableDir, 'resources');
  fs.mkdirSync(destResources, { recursive: true });
  for (const entry of fs.readdirSync(resourcesDir, { withFileTypes: true })) {
    const src = path.join(resourcesDir, entry.name);
    const dest = path.join(destResources, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// Create ZIP
fs.mkdirSync(bundleDir, { recursive: true });
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

const platform = process.platform;
if (platform === 'win32') {
  // PowerShell Compress-Archive (single-quote paths to avoid escaping issues)
  const pathSrc = (portableDir + '\\*').replace(/'/g, "''");
  const pathDest = zipPath.replace(/'/g, "''");
  const psCmd = `Compress-Archive -Path '${pathSrc}' -DestinationPath '${pathDest}' -Force`;
  execSync(`powershell -NoProfile -Command "${psCmd.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
    cwd: rootDir,
  });
} else {
  // zip (common on Linux/macOS when building Windows in CI)
  const zipDir = path.basename(portableDir);
  execSync(
    `cd "${path.dirname(portableDir)}" && zip -r "${zipPath}" "${zipDir}"`,
    { stdio: 'inherit', shell: true }
  );
}

// Remove temp folder
fs.rmSync(portableDir, { recursive: true });

console.log('Portable ZIP created:', zipPath);

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
