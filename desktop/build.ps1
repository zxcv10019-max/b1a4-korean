$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework/v4.0.30319/csc.exe' }
$logo = Join-Path $projectRoot 'android-source/BANA-Forest-Android/app/src/main/res/mipmap/ic_launcher.png'
if (-not (Test-Path -LiteralPath $logo)) { $logo = Join-Path $projectRoot 'android/app/src/main/res/mipmap/ic_launcher.png' }
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class BanaIconBuild {
  [DllImport("user32.dll")] public static extern bool DestroyIcon(IntPtr hIcon);
}
'@
$bitmap = [System.Drawing.Bitmap]::new($logo)
$small = [System.Drawing.Bitmap]::new($bitmap, [System.Drawing.Size]::new(48,48))
$iconHandle = $small.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$iconPath = Join-Path $PSScriptRoot 'bana.ico'
$stream = [System.IO.File]::Create($iconPath)
try { $icon.Save($stream) } finally { $stream.Dispose(); $icon.Dispose(); [void][BanaIconBuild]::DestroyIcon($iconHandle); $small.Dispose(); $bitmap.Dispose() }
$output = Join-Path $projectRoot 'BANA-Forest-Desktop.exe'
& $compiler /nologo /target:winexe /optimize+ /platform:anycpu "/out:$output" "/win32icon:$iconPath" "/resource:$logo,bana-logo.png" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll (Join-Path $PSScriptRoot 'BanaDesktop.cs')
if ($LASTEXITCODE -ne 0) { throw 'Desktop compile failed' }
Write-Output $output
