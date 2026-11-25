using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
internal static class Launcher {
    [STAThread] private static void Main() {
        try {
            string runtime=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"runtime","electron.exe");
            if(!File.Exists(runtime))throw new FileNotFoundException("請先解壓縮完整資料夾，再開啟 BANA-Forest-Desktop.exe；請保留 runtime 資料夾。",runtime);
            Process.Start(new ProcessStartInfo(runtime){UseShellExecute=false,WorkingDirectory=Path.GetDirectoryName(runtime)});
        }catch(Exception error){MessageBox.Show(error.Message,"BANA Forest");}
    }
}
