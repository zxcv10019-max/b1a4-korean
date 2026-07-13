/* BANA Forest AI 前端連線層
 * API Key 不在這裡；本檔只呼叫 Firebase Callable Function。
 */
(function () {
  "use strict";

  const REGION = "asia-east1";
  const FUNCTION_NAME = "aiExplain";
  const OWNER_EMAIL = "zxcv10019@gmail.com";

  let callable = null;

  function getCallable() {
    if (!window.firebase) {
      throw new Error("Firebase 尚未載入，請重新整理頁面。");
    }
    if (!firebase.apps || firebase.apps.length === 0) {
      throw new Error("Firebase 尚未初始化，請稍後再試。");
    }
    if (!callable) {
      callable = firebase.app().functions(REGION).httpsCallable(FUNCTION_NAME);
    }
    return callable;
  }

  async function ask(prompt) {
    const text = String(prompt || "").trim();
    if (!text) throw new Error("沒有收到要解析的內容。");
    if (text.length > 12000) throw new Error("內容太長，請縮短到 12,000 字以內。");

    const user = firebase.auth && firebase.auth().currentUser;
    if (!user) throw new Error("請先使用 Google 帳號登入，再使用 AI。");
    if ((user.email || "").toLowerCase() !== OWNER_EMAIL) {
      throw new Error("目前只有網站擁有者可以使用 AI。");
    }

    const response = await getCallable()({ prompt: text });
    const result = String(response?.data?.text || "").trim();
    if (!result) throw new Error("AI 沒有回傳內容，請稍後再試。");
    return result;
  }

  window.BanaAI = Object.freeze({ ask });
  console.log("✅ BANA Forest OpenAI 前端連線已載入");
})();
