# BANA Forest 電腦版

雙擊專案資料夾中的 `BANA-Forest-Desktop.exe`，使用 Chrome（沒有時使用 Edge）開啟獨立學習視窗，無須安裝。

- 台灣時間週一至週五 08:30–18:00，整個視窗為 20% 不透明度，可透出後方的程式；其他時間恢復清楚。
- 右下角通知區的 BANA 圖示可選「暫時恢復清楚」或切回自動；雙擊圖示也能切換。
- 關閉學習視窗後，透明控制會自動結束。「結束透明控制」會先恢復正常顯示。
- 開啟的是線上網站，之後更新網站即可，無須每次下載電腦版。
- 學習資料使用啟動瀏覽器的使用者設定檔；如果原本用了不同的 Chrome 使用者，請先在同一個使用者開啟網站確認資料，必要時從原網站匯出備份後匯入。
- 一般瀏覽器仍保留原本的上班時段網頁淡化。手機 APP 不受影響。

編譯：Windows .NET Framework 4.x 的 `csc.exe`，參考 `System.Windows.Forms.dll`、`System.Drawing.dll`；將原有 `ic_launcher.png` 以 `bana-logo.png` 資源名稱嵌入。原生視窗透明度使用 Windows `SetLayeredWindowAttributes`，不需要管理員權限。
