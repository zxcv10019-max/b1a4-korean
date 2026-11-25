using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
internal static class Launcher {
    [STAThread] private static void Main() {
        try {
            string runtime=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"runtime","electron.exe");
            if(!File.Exists(runtime))runtime=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"BANA-Forest-Desktop-0.2.1","BANA-Forest-Desktop","runtime","electron.exe");
            if(!File.Exists(runtime))throw new FileNotFoundException("請先解壓縮完整資料夾，再開啟 BANA-Forest-Desktop.exe；請保留 runtime 資料夾。",runtime);
            // Close only BANA's visible window, including an older extracted copy.
            foreach(Process previous in Process.GetProcessesByName("electron")) {
                using(previous) {
                    bool belongs=false;
                    try {
                        string previousRuntime=previous.MainModule.FileName;
                        belongs=String.Equals(previousRuntime,runtime,StringComparison.OrdinalIgnoreCase);
                        if(!belongs) {
                            string manifest=Path.Combine(Path.GetDirectoryName(previousRuntime),"resources","app","package.json");
                            belongs=File.Exists(manifest)&&System.Text.RegularExpressions.Regex.IsMatch(File.ReadAllText(manifest),@"\x22name\x22\s*:\s*\x22bana-forest-desktop\x22");
                        }
                        belongs=belongs&&previous.MainWindowHandle!=IntPtr.Zero;
                    } catch { }
                    if(!belongs)continue;
                    if(!previous.CloseMainWindow()||!previous.WaitForExit(5000)) {
                        MessageBox.Show("舊版 BANA Forest 還在執行。請先儲存內容，從右下角 BANA 圖示選擇「結束」，再重新開啟。","BANA Forest");
                        return;
                    }
                }
            }
            Process.Start(new ProcessStartInfo(runtime){UseShellExecute=false,WorkingDirectory=Path.GetDirectoryName(runtime)});
        }catch(Exception error){MessageBox.Show(error.Message,"BANA Forest");}
    }
}
