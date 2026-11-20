# BANA Forest 0.6.0：APP 內更新

這份原始碼已加入網頁內容更新功能。目前尚未編譯或簽署 APK，也尚未連接正式更新網站；不能把原始碼完成視為手機已可更新。

## 使用方式

首次需安裝使用原金鑰簽署的 0.6.0 APK。之後在「我的 → APP 更新」點選「檢查更新 → 下載新版 → 立即套用」。
更新下載到手機後可離線使用。更新仍使用 `https://appassets.androidplatform.net/assets/index.html`，不改變原有 localStorage/IndexedDB 網址，也不清除筆記。套用前會觸發草稿保留及原生快照。

若新版未通過啟動確認，20 秒後會嘗試恢復上一版；若 APP 在確認前被關閉，下次開啟時會恢復上一版。「更新設定」也提供手動恢復。恢復只切換程式版本，不倒回或刪除使用者資料。

## 啟用前還需要

1. Java 17、Android SDK platform 36、build-tools 36.0.0。這次工作環境未具備完整工具鏈，未執行 Android 編譯或裝機測試。
2. 用原有的 `BANA-Forest-update-key-PRIVATE.zip` 金鑰簽署 APK；勿使用新金鑰，勿把私鑰放到 APP 或更新網站。
3. 一個能直接提供 JSON/ZIP 的固定 HTTPS 網站，例如既有 GitHub Pages 或 Firebase Hosting。網址尚未設定；本版不會假裝連線成功。

可在編譯前填寫 `app/src/main/assets/updates-config.json` 的 `manifestUrl`。也可以首次安裝後，在 APP「更新設定 → 設定更新來源」輸入完整 `latest.json` 網址。更新網址不接受登入頁、分享預覽頁或 HTTP；下載若轉址會明確報錯，需改成最終固定網址。

## 日後發佈新版，不需重做 APK

把修改過的獨立 HTML 準備成 Android 入口：

```powershell
python update-web-entry.py "C:\你的資料夾\index.html"
python make-web-release.py --version-code 2 --version 2026.11.21.1 --notes "更新文法筆記排版"
```

每次把 `--version-code` 遞增。先把 `dist/web` 中的 ZIP 上傳到網站，確認能下載後，最後上傳同目錄的 `latest.json`。手機便能檢查更新。

`latest.json` 與 ZIP 必須在同一個 HTTPS 網站；清單包含 SHA-256 和確切檔案大小。APP 會先下載與校驗、限制解壓縮大小及檔案路徑，完成後才切換版本。使用者筆記不放在更新包中。

這次提供的初始網頁內容版本是 `2026.11.20.1`、versionCode 1；更新包只包含程式資產，不包含使用者手機上的資料。之後若修改 Android 權限、服務或 Java 程式，仍需新版 APK，並調整更新清單的 `minShellVersion`。

## 相容性及驗證範圍

- Java 原生程式本次尚未完成編譯、DEX、簽署與手機實測；不得宣稱 APK 已可安裝。
- 已設計的失敗保護仍須在實機測試：斷網、SHA-256 不符、下載中關閉 APP、更新後無法啟動、恢復上一版、既有筆記/登入/語音仍正常。
- 更新程式須維持既有資料格式相容；避免在啟動時做不可逆資料遷移，否則恢復舊版介面不代表能恢復資料格式。
- 原始碼內的 `prepare-assets.py` 是舊流程，會重建較早的頁面。新的內容更新請改用 `update-web-entry.py`，以免蓋掉目前最新介面。
