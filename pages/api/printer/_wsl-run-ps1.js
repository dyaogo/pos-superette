/**
 * Lance un script PowerShell de façon compatible avec les trois environnements :
 *
 *  ┌─────────────┬──────────────────────────────────────────────────────────┐
 *  │ Windows     │ powershell.exe, tmpdir() donne déjà un chemin Windows   │
 *  │ WSL         │ powershell.exe, /mnt/c/Windows/Temp + wslpath -w        │
 *  │ Linux natif │ erreur explicite (pas de PowerShell disponible)          │
 *  └─────────────┴──────────────────────────────────────────────────────────┘
 */
import { execSync }                  from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join }                      from 'path';
import { tmpdir }                    from 'os';

function detectEnv() {
  if (process.platform === 'win32') return 'windows';
  try {
    const v = require('fs').readFileSync('/proc/version', 'utf8').toLowerCase();
    if (v.includes('microsoft') || v.includes('wsl')) return 'wsl';
  } catch { /* ignore */ }
  return 'linux';
}

export function runPS1(psContent, filePrefix = 'ps_') {
  const env = detectEnv();

  if (env === 'linux') {
    throw new Error(
      'PowerShell non disponible sur ce système Linux. ' +
      'Cette fonctionnalité requiert Windows ou WSL. ' +
      'En mode développement Linux, utilisez le mode "Dialogue Windows" ou "Port série".'
    );
  }

  const fileName = `${filePrefix}${Date.now()}.ps1`;

  if (env === 'windows') {
    // Windows natif : tmpdir() renvoie déjà un chemin Windows (ex. C:\Windows\Temp)
    const psFile = join(tmpdir(), fileName);
    writeFileSync(psFile, psContent, 'utf8');
    try {
      return execSync(
        `powershell.exe -NonInteractive -ExecutionPolicy Bypass -File "${psFile}"`,
        { timeout: 15000, encoding: 'utf8' }
      );
    } finally {
      try { unlinkSync(psFile); } catch { /* ignore */ }
    }
  }

  // WSL : écrire dans /mnt/c/Windows/Temp, convertir le chemin avec wslpath
  const WSL_TEMP = '/mnt/c/Windows/Temp';
  const linuxPath = join(WSL_TEMP, fileName);
  if (!require('fs').existsSync('/mnt/c')) {
    throw new Error(
      'WSL détecté mais le lecteur C: n\'est pas monté sur /mnt/c. ' +
      'Vérifiez /etc/wsl.conf ou montez le disque manuellement.'
    );
  }
  writeFileSync(linuxPath, psContent, 'utf8');
  let winPath;
  try {
    winPath = execSync(`wslpath -w "${linuxPath}"`, { encoding: 'utf8' }).trim();
  } catch {
    winPath = `C:\\Windows\\Temp\\${fileName}`;
  }
  try {
    return execSync(
      `powershell.exe -NonInteractive -ExecutionPolicy Bypass -File "${winPath}"`,
      { timeout: 15000, encoding: 'utf8' }
    );
  } finally {
    try { unlinkSync(linuxPath); } catch { /* ignore */ }
  }
}
