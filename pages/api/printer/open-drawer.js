import { runPS1 } from './_wsl-run-ps1';

// ─── Endpoint : ouvre le tiroir-caisse via l'imprimante Windows ───────────────
// Envoie les octets ESC/POS (commandes tiroir pin2 + pin5) directement à
// l'imprimante Windows nommée "printerName" (défaut : POS58) en utilisant
// l'API Win32 WritePrinter — indépendamment du mode d'impression de l'app.
// Fonctionne depuis WSL (powershell.exe via /mnt/c/Windows/Temp/).
// ─────────────────────────────────────────────────────────────────────────────
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Nom de l'imprimante Windows (sanitisé pour éviter l'injection de commande)
  const printerName = (req.body?.printerName || 'POS58')
    .replace(/[^a-zA-Z0-9 _\-().]/g, '');

  // ESC/POS : ESC p 0 (pin 2) + ESC p 1 (pin 5) — les deux pour compatibilité
  const drawerBytes = [27, 112, 0, 25, 250, 27, 112, 1, 25, 250];

  const psContent = buildWritePrinterPS1(printerName, drawerBytes, 'CashDrawer');

  try {
    const result = runPS1(psContent, 'drawer_');
    return res.json({ ok: true, result: result.trim() });
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    console.error('[open-drawer]', msg);
    return res.status(500).json({ ok: false, error: msg });
  }
}

// ─── Script PowerShell générique : WritePrinter ───────────────────────────────
export function buildWritePrinterPS1(printerName, bytes, docName = 'Receipt') {
  return `
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
$doc.pDocName  = "${docName}"
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
}
