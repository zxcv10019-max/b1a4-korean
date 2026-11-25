using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace BanaForestDesktop {
    internal static class Native {
        internal delegate bool EnumProc(IntPtr hwnd, IntPtr parameter);
        [DllImport("user32.dll")] internal static extern bool EnumWindows(EnumProc callback, IntPtr parameter);
        [DllImport("user32.dll")] internal static extern bool IsWindow(IntPtr hwnd);
        [DllImport("user32.dll")] internal static extern bool IsWindowVisible(IntPtr hwnd);
        [DllImport("user32.dll", CharSet=CharSet.Unicode)] internal static extern int GetWindowText(IntPtr hwnd, StringBuilder text, int size);
        [DllImport("user32.dll")] internal static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);
        [DllImport("user32.dll", EntryPoint="GetWindowLongW")] internal static extern int GetWindowLong(IntPtr hwnd, int index);
        [DllImport("user32.dll", EntryPoint="SetWindowLongW", SetLastError=true)] internal static extern int SetWindowLong(IntPtr hwnd, int index, int value);
        [DllImport("user32.dll", SetLastError=true)] internal static extern bool SetLayeredWindowAttributes(IntPtr hwnd, uint color, byte alpha, uint flags);
        [DllImport("user32.dll")] internal static extern bool GetLayeredWindowAttributes(IntPtr hwnd, out uint color, out byte alpha, out uint flags);
        [DllImport("user32.dll")] internal static extern bool ShowWindow(IntPtr hwnd, int command);
        [DllImport("user32.dll")] internal static extern bool SetForegroundWindow(IntPtr hwnd);
        [DllImport("user32.dll")] internal static extern bool DestroyIcon(IntPtr icon);
        internal const int ExStyle=-20, Layered=0x80000;
        internal static List<IntPtr> Windows() {
            List<IntPtr> windows=new List<IntPtr>();
            EnumWindows(delegate(IntPtr h, IntPtr p) { windows.Add(h); return true; }, IntPtr.Zero);
            return windows;
        }
        internal static string Title(IntPtr h) { StringBuilder s=new StringBuilder(1024); GetWindowText(h,s,s.Capacity); return s.ToString(); }
        internal static uint Owner(IntPtr h) { uint id; GetWindowThreadProcessId(h,out id); return id; }
    }

    internal sealed class WindowOpacity : IDisposable {
        readonly IntPtr handle;
        readonly int style;
        readonly uint owner;
        readonly bool hadAlpha;
        readonly uint oldColor, oldFlags;
        readonly byte oldAlpha;
        internal WindowOpacity(IntPtr h) {
            handle=h; owner=Native.Owner(h); style=Native.GetWindowLong(h,Native.ExStyle);
            hadAlpha=Native.GetLayeredWindowAttributes(h,out oldColor,out oldAlpha,out oldFlags);
        }
        internal bool Alive { get { return Native.IsWindow(handle)&&Native.Owner(handle)==owner; } }
        internal void Set(byte alpha) {
            if(!Alive) return;
            Native.SetWindowLong(handle,Native.ExStyle,Native.GetWindowLong(handle,Native.ExStyle)|Native.Layered);
            if(!Native.SetLayeredWindowAttributes(handle,0,alpha,2)) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
        }
        public void Dispose() {
            if(!Alive) return;
            if(hadAlpha) Native.SetLayeredWindowAttributes(handle,oldColor,oldAlpha,oldFlags);
            else Native.SetLayeredWindowAttributes(handle,0,255,2);
            int current=Native.GetWindowLong(handle,Native.ExStyle);
            Native.SetWindowLong(handle,Native.ExStyle,(current&~Native.Layered)|(style&Native.Layered));
        }
    }

    internal static class Schedule {
        static readonly TimeZoneInfo Taipei=TimeZoneInfo.FindSystemTimeZoneById("Taipei Standard Time");
        internal static bool WorkTime(DateTimeOffset now) {
            DateTimeOffset time=TimeZoneInfo.ConvertTime(now,Taipei);
            double minutes=time.TimeOfDay.TotalMinutes;
            return time.DayOfWeek!=DayOfWeek.Saturday&&time.DayOfWeek!=DayOfWeek.Sunday&&minutes>=510&&minutes<1080;
        }
    }

    internal sealed class DesktopContext : ApplicationContext {
        readonly NotifyIcon tray;
        readonly System.Windows.Forms.Timer timer;
        readonly HashSet<IntPtr> previous;
        readonly DateTime deadline=DateTime.UtcNow.AddSeconds(60);
        readonly string browserName;
        readonly ToolStripMenuItem automatic;
        readonly ToolStripMenuItem clear;
        WindowOpacity opacity;
        IntPtr target=IntPtr.Zero;
        byte lastAlpha=0;
        bool forceClear;
        bool disposed;

        internal DesktopContext() {
            string browser=FindBrowser(); browserName=Path.GetFileNameWithoutExtension(browser);
            previous=new HashSet<IntPtr>(Native.Windows());
            tray=new NotifyIcon(); tray.Icon=LoadIcon(); tray.Text="BANA Forest - 正在開啟";
            ContextMenuStrip menu=new ContextMenuStrip();
            automatic=new ToolStripMenuItem("自動：平日 08:30–18:00 半透明");
            clear=new ToolStripMenuItem("暫時恢復清楚");
            automatic.Click+=delegate { forceClear=false; UpdateOpacity(); };
            clear.Click+=delegate { forceClear=true; UpdateOpacity(); };
            menu.Items.Add(automatic); menu.Items.Add(clear); menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("顯示學習視窗",null,delegate { if(opacity!=null&&opacity.Alive) { Native.ShowWindow(target,9); Native.SetForegroundWindow(target); } });
            menu.Items.Add("結束透明控制（恢復清楚）",null,delegate { ExitThread(); });
            tray.ContextMenuStrip=menu; tray.DoubleClick+=delegate { forceClear=!forceClear; UpdateOpacity(); }; tray.Visible=true;
            try {
                ProcessStartInfo start=new ProcessStartInfo(browser,"--new-window --app=\"https://zxcv10019-max.github.io/b1a4-korean/?desktopOpacity=1\"");
                start.UseShellExecute=false;
                Process.Start(start);
                timer=new System.Windows.Forms.Timer(); timer.Interval=1000; timer.Tick+=Tick; timer.Start();
            } catch { tray.Visible=false; tray.Dispose(); throw; }
        }
        static string FindBrowser() {
            string[] bases={Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)};
            foreach(string suffix in new[]{@"Google\Chrome\Application\chrome.exe",@"Microsoft\Edge\Application\msedge.exe"})
                foreach(string root in bases) { string candidate=Path.Combine(root,suffix); if(File.Exists(candidate)) return candidate; }
            throw new InvalidOperationException("請先安裝 Chrome 或 Microsoft Edge，再開啟 BANA Forest 電腦版。");
        }
        static Icon LoadIcon() {
            using(Stream resource=Assembly.GetExecutingAssembly().GetManifestResourceStream("bana-logo.png")) {
                if(resource==null) return (Icon)SystemIcons.Application.Clone();
                using(Bitmap original=new Bitmap(resource)) using(Bitmap small=new Bitmap(original,32,32)) {
                    IntPtr h=small.GetHicon(); try { return (Icon)Icon.FromHandle(h).Clone(); } finally { Native.DestroyIcon(h); }
                }
            }
        }
        void Tick(object sender, EventArgs args) {
            try {
                if(opacity==null) {
                    foreach(IntPtr h in Native.Windows()) {
                        if(previous.Contains(h)||!Native.IsWindowVisible(h)||Native.Title(h).IndexOf("BANA Forest",StringComparison.OrdinalIgnoreCase)<0) continue;
                        try { using(Process p=Process.GetProcessById((int)Native.Owner(h))) { if(!String.Equals(p.ProcessName,browserName,StringComparison.OrdinalIgnoreCase)) continue; } } catch { continue; }
                        target=h; opacity=new WindowOpacity(h); break;
                    }
                    if(opacity==null) {
                        if(DateTime.UtcNow>deadline) { MessageBox.Show("未找到新開啟的 BANA Forest 視窗。請確認網站已載入，再關閉該視窗並重新開啟電腦版。","BANA Forest"); ExitThread(); }
                        return;
                    }
                }
                if(!opacity.Alive) { ExitThread(); return; }
                UpdateOpacity();
            } catch(Exception error) { MessageBox.Show("無法調整視窗透明度："+error.Message,"BANA Forest"); ExitThread(); }
        }
        void UpdateOpacity() {
            bool faded=!forceClear&&Schedule.WorkTime(DateTimeOffset.UtcNow);
            byte alpha=faded?(byte)51:(byte)255;
            if(opacity!=null&&opacity.Alive&&lastAlpha!=alpha) { opacity.Set(alpha); lastAlpha=alpha; }
            automatic.Checked=!forceClear; clear.Checked=forceClear;
            tray.Text=faded?"BANA Forest - 20% 不透明度（雙擊恢復清楚）":"BANA Forest - 正常顯示";
        }
        protected override void ExitThreadCore() { Dispose(); base.ExitThreadCore(); }
        protected override void Dispose(bool disposing) {
            if(disposing&&!disposed) { disposed=true; if(timer!=null) timer.Dispose(); if(opacity!=null) opacity.Dispose(); tray.Visible=false; Icon icon=tray.Icon; tray.Dispose(); icon.Dispose(); }
            base.Dispose(disposing);
        }
    }

    internal static class Program {
        [STAThread] static void Main(string[] args) {
            Application.EnableVisualStyles();
            if(args.Length==2&&args[0]=="--self-test") { SelfTest(args[1]); return; }
            bool created;
            using(Mutex mutex=new Mutex(true,@"Local\BanaForestDesktopOpacity",out created)) {
                if(!created) { MessageBox.Show("BANA Forest 電腦版已啟動。請使用右下角通知區的圖示操作。","BANA Forest"); return; }
                try { using(DesktopContext context=new DesktopContext()) Application.Run(context); }
                catch(Exception error) { MessageBox.Show(error.Message,"BANA Forest"); }
            }
        }
        static void Require(bool value,string label) { if(!value) throw new Exception(label); }
        static void SelfTest(string output) {
            try {
                string[] dates={"2026-11-23T00:29:59Z","2026-11-23T00:30:00Z","2026-11-23T09:59:59Z","2026-11-23T10:00:00Z","2026-11-27T09:00:00Z","2026-11-28T01:00:00Z","2026-11-29T01:00:00Z","2026-11-30T00:30:00Z"};
                bool[] expected={false,true,true,false,true,false,false,true};
                for(int i=0;i<dates.Length;i++) Require(Schedule.WorkTime(DateTimeOffset.Parse(dates[i]))==expected[i],dates[i]);
                using(Form form=new Form()) {
                    IntPtr h=form.Handle; int before=Native.GetWindowLong(h,Native.ExStyle);
                    using(WindowOpacity opacity=new WindowOpacity(h)) {
                        opacity.Set(51); uint color,flags; byte alpha;
                        Require(Native.GetLayeredWindowAttributes(h,out color,out alpha,out flags)&&alpha==51&&flags==2,"20% opacity");
                        opacity.Set(255); Require(Native.GetLayeredWindowAttributes(h,out color,out alpha,out flags)&&alpha==255,"Restore opacity");
                    }
                    Require((Native.GetWindowLong(h,Native.ExStyle)&Native.Layered)==(before&Native.Layered),"Restore window style");
                }
                File.WriteAllText(output,"PASS: 8 Taipei schedule boundaries; native alpha 51/255; original window style restored.");
            } catch(Exception error) { File.WriteAllText(output,"FAIL: "+error); Environment.ExitCode=1; }
        }
    }
}
