# 最後簽署：保留目前手機資料

此套件中的 APK 尚未簽署，不能直接安裝。必須使用先前 BANA Forest 的原簽署金鑰，才能覆蓋原 APP 並保留資料。

原金鑰備份是 `BANA-Forest-update-key-PRIVATE.zip`。不要把它、密碼或解壓縮後的檔案上傳到公開 GitHub 儲存庫。

使用套件中的 `apksigner.jar` 和原金鑰簽署後，還必須驗證簽章；預期原 SHA-1：`E8:9D:09:1F:54:D0:4F:EB:27:4D:65:39:19:F1:A1:2A:1B:CD:7A:C0`。

```text
java -jar apksigner.jar sign --ks release.jks --ks-key-alias banaforest --ks-pass file:password.txt --out BANA-Forest-0.6.0.apk BANA-Forest-0.6.0-unsigned.apk
java -jar apksigner.jar verify --verbose --print-certs BANA-Forest-0.6.0.apk
```

請依原備份中的實際檔名與 alias 設定，不要以新金鑰取代原金鑰。若 Java 8 無法執行此版本簽署工具，需 Java 17。

安裝成功後，APP「我的 → APP 更新」使用固定來源：
`https://zxcv10019-max.github.io/b1a4-korean/updates/latest.json`

手機實測項目：原筆記/登入仍存在、檢查更新、下載、套用、離線開啟、恢復上一版。
