// chatbox.js - 猫猫老师悬浮聊天框（全站通用）
(function () {
  "use strict";

  const STORE_KEY = "pp_chat_history";

  // 注入样式（避免改所有页面head）
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/static/css/chatbox.css";
  document.head.appendChild(link);

  // 构建 DOM
  const box = document.createElement("div");
  box.id = "chatbox";
  box.innerHTML =
    '<button id="cb-fab" title="猫猫老师">🐱</button>' +
    '<div id="cb-panel" class="cb-hidden">' +
    '  <div id="cb-header"><span id="cb-title">🐱 猫猫老师</span><button id="cb-close" title="关闭">×</button></div>' +
    '  <div id="cb-msgs"></div>' +
    '  <div id="cb-input-row">' +
    '    <textarea id="cb-input" rows="1" placeholder="问问猫猫老师…(Enter发送, Shift+Enter换行)"></textarea>' +
    '    <button id="cb-send">发送</button>' +
    "  </div>" +
    "</div>";
  document.body.appendChild(box);

  const fab = document.getElementById("cb-fab");
  const panel = document.getElementById("cb-panel");
  const msgsEl = document.getElementById("cb-msgs");
  const inputEl = document.getElementById("cb-input");
  const sendBtn = document.getElementById("cb-send");

  let history = [];
  let busy = false;

  // 恢复历史
  try {
    history = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    if (!Array.isArray(history)) history = [];
    for (const m of history) {
      if (m && typeof m.content === "string") renderMsg(m.role, m.content);
    }
  } catch (e) {
    history = [];
  }

  function scrollBottom() {
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderMsg(role, text, save) {
    const div = document.createElement("div");
    div.className = "cb-msg " + (role === "user" ? "cb-user" : "cb-ai");
    const inner =
      role === "user"
        ? '<div class="cb-bubble">' + escapeHtml(text) + "</div>"
        : '<div class="cb-bubble cb-md">' +
          (typeof renderMarkdown === "function"
            ? renderMarkdown(text)
            : escapeHtml(text)) +
          "</div>";
    div.innerHTML = inner;
    msgsEl.appendChild(div);
    scrollBottom();

    if (save) {
      history.push({ role: role, content: text });
      if (history.length > 50) history = history.slice(-50);
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(history));
      } catch (e) {}
    }
  }

  async function send() {
    const text = inputEl.value.trim();
    if (!text || busy) return;
    inputEl.value = "";
    renderMsg("user", text, true);

    busy = true;
    sendBtn.disabled = true;

    const typing = document.createElement("div");
    typing.className = "cb-msg cb-ai";
    typing.innerHTML = '<div class="cb-bubble cb-md">猫猫思考中…</div>';
    msgsEl.appendChild(typing);
    scrollBottom();

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      typing.remove();
      renderMsg("assistant", data.reply || "（猫猫没回应喵）", true);
    } catch (e) {
      typing.remove();
      renderMsg("assistant", "网络出错了喵… " + e.message, false);
    }

    busy = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  fab.addEventListener("click", function () {
    panel.classList.toggle("cb-hidden");
    if (!panel.classList.contains("cb-hidden")) {
      inputEl.focus();
      scrollBottom();
    }
  });

  sendBtn.addEventListener("click", send);

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  // 输入框自动增高
  inputEl.addEventListener("input", function () {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + "px";
  });

  // 先渲染历史再定位到底部
  requestAnimationFrame(scrollBottom);
})();
