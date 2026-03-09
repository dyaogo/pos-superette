import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ─── Endpoint : envoie un ticket ESC/POS complet via l'imprimante Windows ─────
// Le ticket (octets ESC/POS) est généré côté client par buildESCPOS() et
// transmis sous forme de tableau d'entiers. Le serveur le passe directement
// à l'imprimante Windows via l'API Win32 WritePrinter (type RAW) → pas de
// dialogue, formatage thermique natif, coupe-papier et tiroir inclus.
// ─────────────────────────────────────────────────────────────────────────────
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { printerName: rawName, bytes } = req.body || {};

  if (!Array.isArray(bytes) || bytes.length === 0) {
    return res.status(400).json({ error: 'bytes[] requis' });
  }
  // Valider que tous les éléments sont des entiers 0-255
  if (!bytes.every(b => Number.isInteger(b) && b >= 0 && b <= 255)) {
    return res.status(400).json({ error: 'bytes[] doit contenir uniquement des entiers 0-255' });
  }

  const printerName = (rawName || 'POS58').replace(/[^a-zA-Z0-9 _\-().]/g, '');

  const psContent = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class RawPrint {
    [DllImport("winspool.drv", CharSet=CharSet.Ansi)]
    public static extern bool OpenPrinterA(string name, out IntPtr handle, IntPtr pd);
    [DllImport("winspool.drv")]
    public static extern bool ClosePrinter(IntPtr handle);
    [DllImport("winspool.drv", CharSet=CharSet.Ansi)]
    public static extern int StartDocPrinterA(IntPtr handle, int level, ref DOCINFOA di);
    [DllImport("winspool.drv")]
    public static extern bool EndDocPrinter(IntPtr handle);
    [DllImport("winspool.drv")]
    public static extern bool StartPagePrinter(IntPtr handle);
    [DllImport("winspool.drv")]
    public static extern bool EndPagePrinter(IntPtr handle);
    [DllImport("winspool.drv")]
    public static extern bool WritePrinter(IntPtr handle, IntPtr pBytes, int count, out int written);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public struct DOCINFOA {
        public int cbSize;
        public string pDocName;
        public string pOutputFile;
        public string pDataType;
    }
}
'@
$h = [IntPtr]::Zero
$ok = [RawPrint]::OpenPrinterA("${printerName}", [ref]$h, [IntPtr]::Zero)
if (-not $ok) { Write-Error "Impossible d'ouvrir l'imprimante : ${printerName}"; exit 1 }
$doc = New-Object RawPrint+DOCINFOA
$doc.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($doc)
$doc.pDocName  = "Receipt"
$doc.pDataType = "RAW"
[RawPrint]::StartDocPrinterA($h, 1, [ref]$doc) | Out-Null
[RawPrint]::StartPagePrinter($h) | Out-Null
$bytes = [byte[]](${bytes.join(',')})
$ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
$w = 0
[RawPrint]::WritePrinter($h, $ptr, $bytes.Length, [ref]$w) | Out-Null
[System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
[RawPrint]::EndPagePrinter($h)  | Out-Null
[RawPrint]::EndDocPrinter($h)   | Out-Null
[RawPrint]::ClosePrinter($h)    | Out-Null
Write-Output "sent:$w"
`;

  const psFile = join(tmpdir(), `receipt_${Date.now()}.ps1`);
  try {
    writeFileSync(psFile, psContent, 'utf8');
    const result = execSync(
      `powershell -NonInteractive -ExecutionPolicy Bypass -File "${psFile}"`,
      { timeout: 15000, encoding: 'utf8' }
    );
    return res.json({ ok: true, result: result.trim() });
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    console.error('[print-escpos]', msg);
    return res.status(500).json({ ok: false, error: msg });
  } finally {
    try { unlinkSync(psFile); } catch { /* ignore */ }
  }
}
