/**
 * Lance un script PowerShell depuis WSL (ou Linux + powershell.exe disponible).
 *
 * WSL expose powershell.exe mais :
 *  - la commande est  powershell.exe  (pas  powershell)
 *  - le fichier .ps1 doit être dans un chemin Windows ; on utilise
 *    C:\Windows\Temp\ (accessible en WSL via /mnt/c/Windows/Temp/)
 *  - le chemin Linux est converti en chemin Windows avec `wslpath -w`
 */
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Répertoire Windows Temp accessible depuis WSL
const WIN_TEMP_LINUX = '/mnt/c/Windows/Temp';

export function runPS1(psContent, filePrefix = 'ps_') {
  const fileName  = `${filePrefix}${Date.now()}.ps1`;
  const linuxPath = join(WIN_TEMP_LINUX, fileName);

  // S'assurer que le répertoire existe (montage WSL)
  if (!existsSync(WIN_TEMP_LINUX)) {
    throw new Error(
      'Impossible d\'accéder à /mnt/c/Windows/Temp — ' +
      'vérifiez que WSL est bien configuré et que le lecteur C: est monté.'
    );
  }
  mkdirSync(WIN_TEMP_LINUX, { recursive: true }); // no-op si déjà existant

  writeFileSync(linuxPath, psContent, 'utf8');

  let winPath;
  try {
    winPath = execSync(`wslpath -w "${linuxPath}"`, { encoding: 'utf8' }).trim();
  } catch {
    // Si wslpath n'est pas disponible (environnement non-WSL), utiliser le chemin tel quel
    winPath = linuxPath;
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
