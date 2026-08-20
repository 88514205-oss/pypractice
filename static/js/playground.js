async function api(url, options) {
  const resp = await fetch(url, options);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

let pyodide = null;
const pyodideRef = { current: null };
let pgEditor = null;

const pgEditorEl = document.getElementById("pg-code");
const outputEl = document.getElementById("pg-output");
const reviewEl = document.getElementById("pg-review");
const statusEl = document.getElementById("pg-status");

const PG_SAVE_KEY = "pp_playground_code";

function savePlaygroundCode() {
  try { sessionStorage.setItem(PG_SAVE_KEY, getCode()); } catch (e) {}
}

function restorePlaygroundCode() {
  try {
    const saved = sessionStorage.getItem(PG_SAVE_KEY);
    if (saved !== null && saved !== undefined && saved.trim() !== "") {
      setCode(saved);
    }
  } catch (e) {}
}

const EXAMPLES = {
  "fib": "# 斐波那契数列\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\nprint([fib(i) for i in range(10)])\n",
  "list": "# 列表推导式\nsquares = [i*i for i in range(1, 11)]\nprint(\"平方:\", squares)\n\nevens = [i for i in range(20) if i % 2 == 0]\nprint(\"偶数:\", evens)\n",
  "dict": "# 字典操作\nperson = {\"name\": \"白糖\", \"age\": 16}\nfor k, v in person.items():\n    print(f\"{k}: {v}\")\n\nscores = {\"语文\": 90, \"数学\": 95}\nprint(\"平均分:\", sum(scores.values()) / len(scores))\n",
  "class": "# 类和对象\nclass Cat:\n    def __init__(self, name):\n        self.name = name\n\n    def meow(self):\n        return f\"{self.name}: 喵~\"\n\nwhite = Cat(\"白糖\")\nprint(white.meow())\n",
  "api": "# 请求API（需要网络）\nimport requests\nresp = requests.get(\"https://httpbin.org/get\")\nprint(\"状态码:\", resp.status_code)\nprint(\"返回:\", resp.json().get(\"origin\"))\n",
};

try {
  pgEditor = CodeMirror.fromTextArea(pgEditorEl, {
    mode: "python",
    theme: "dracula",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    lint: { getAnnotations: makePyLint(pyodideRef), async: false },
    gutters: ["CodeMirror-lint-markers"],
    extraKeys: { "Tab": "indentMore", "Shift-Tab": "indentLess" },
  });
  pgEditor.setSize("100%", "420px");
  pgEditor.on("change", savePlaygroundCode);
} catch (e) {
  pgEditor = null;
  console.warn("CodeMirror加载失败:", e);
}

function getCode() {
  return pgEditor ? pgEditor.getValue() : pgEditorEl.value;
}

function setCode(code) {
  if (pgEditor) pgEditor.setValue(code);
  else pgEditorEl.value = code;
}

async function initPyodide() {
  statusEl.textContent = "加载Python环境...";
  try {
    pyodide = await loadPyodide({ indexURL: "/static/pyodide/" });
    pyodideRef.current = pyodide;
    statusEl.textContent = "Python就绪（语法检查已开启）";
  } catch (e) {
    statusEl.textContent = "环境加载失败";
    outputEl.textContent = "Pyodide 加载失败: " + e.message;
  }
}

async function runCode() {
  if (!pyodide) {
    outputEl.textContent = "Python环境还没准备好，请稍等...";
    return;
  }
  outputEl.textContent = "";
  let stdout = "";
  pyodide.setStdout({ batched: (text) => { stdout += text + "\n"; } });
  pyodide.setStderr({ batched: (text) => { stdout += "[err] " + text + "\n"; } });
  try {
    const result = await pyodide.runPythonAsync(getCode());
    let output = stdout;
    if (result !== undefined && result !== null) {
      output += String(result);
    }
    outputEl.textContent = output || "(无输出)";
  } catch (e) {
    outputEl.textContent = stdout + "错误: " + e.message;
  }
}

async function review() {
  reviewEl.textContent = "猫猫老师正在看你的代码...";
  try {
    const code = getCode();
    const resp = await api("/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code, mode: "free" }),
    });
    reviewEl.textContent = resp.reply;
    // 审查结果写入共享上下文（代码在记忆在）
    pgSharedHistory.push({ role: "user", content: "请审查我的这段代码：\n" + code });
    pgSharedHistory.push({ role: "assistant", content: resp.reply });
    trimShared();
    saveShared();
    pgChatRender("assistant", PG_FILE_SVG + " 这次审查已记入上下文，可以继续追问喵~", true);
  } catch (e) {
    reviewEl.textContent = "请求失败: " + e.message;
  }
}

function clearCode() {
  if (confirm("确定清空编辑器？")) setCode("");
}

function example() {
  const names = Object.keys(EXAMPLES);
  const pick = prompt("选择示例: " + names.join(" / "));
  if (pick && EXAMPLES[pick]) setCode(EXAMPLES[pick]);
}

function pgSave() {
  const code = getCode();
  if (!code || code.trim() === "") {
    alert("编辑器是空的，没啥好存档的");
    return;
  }
  saveToSaves(code, "自由工坊");
  statusEl.textContent = "已存入我的存档";
}

function pgOpenSaves() {
  const modal = document.getElementById("pg-saves-modal");
  const listEl = document.getElementById("pg-saves-list");
  const saves = loadSaves();
  if (!saves.length) {
    listEl.innerHTML = '<p class="modal-tip">还没有存档。写代码时点"存档"按钮可以手动保存。</p>';
  } else {
    listEl.innerHTML = saves.map((s) => `
      <div class="save-item">
        <div class="save-meta">${s.ts} | ${s.meta || "未标注"}</div>
        <pre class="save-preview">${s.code.slice(0, 120)}${s.code.length > 120 ? "..." : ""}</pre>
        <div class="save-actions">
          <button class="btn btn-small" onclick="pgRestore(${s.id})">载入</button>
          <button class="btn btn-small btn-danger" onclick="pgRemove(${s.id})">删除</button>
        </div>
      </div>`).join("");
  }
  modal.style.display = "flex";
}

function pgRestore(id) {
  const saves = loadSaves();
  const s = saves.find((x) => x.id === id);
  if (s) {
    setCode(s.code);
    document.getElementById("pg-saves-modal").style.display = "none";
    statusEl.textContent = "已载入存档";
  }
}

function pgRemove(id) {
  deleteSave(id);
  pgOpenSaves();
}

window.pgRestore = pgRestore;
window.pgRemove = pgRemove;


document.getElementById("btn-pg-run").addEventListener("click", runCode);
document.getElementById("btn-pg-review").addEventListener("click", review);
document.getElementById("btn-pg-clear").addEventListener("click", clearCode);
document.getElementById("btn-pg-save").addEventListener("click", pgSave);
document.getElementById("btn-pg-saves").addEventListener("click", pgOpenSaves);
document.getElementById("btn-pg-saves-close").addEventListener("click", () => {
  document.getElementById("pg-saves-modal").style.display = "none";
});
document.getElementById("btn-pg-saves-clear").addEventListener("click", () => {
  if (confirm("确定清空全部存档？此操作不可恢复")) {
    clearAllSaves();
    pgOpenSaves();
  }
});
document.getElementById("btn-pg-example").addEventListener("click", example);

restorePlaygroundCode();

document.addEventListener("DOMContentLoaded", () => {
  initPyodide();
});

// ===== 猫猫老师内嵌对话（追问区）· 共享上下文版 =====
const pgChatMsgs = document.getElementById("pg-chat-msgs");
const pgChatInput = document.getElementById("pg-chat-input");
const pgChatSend = document.getElementById("pg-chat-send");
const pgChatClearBtn = document.getElementById("pg-chat-clear");
const pgChatZipBtn = document.getElementById("pg-chat-zip");

const PG_CHAT_KEY = "pp_playground_chat";
let pgSharedHistory = [];
let pgChatBusy = false;

const PG_FILE_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>';
const PG_TRASH_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>';
const PG_ZIP_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l4 0l0-4"/><path d="M4 4l5 5"/><path d="M19 9l-4 0l0-4"/><path d="M20 4l-5 5"/><path d="M5 15l4 0l0 4"/><path d="M4 20l5-5"/><path d="M19 15l-4 0l0 4"/><path d="M20 20l-5-5"/></svg>';

function pgChatEsc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pgChatRender(role, text, raw) {
  const div = document.createElement("div");
  div.className = "pg-chat-msg " + (role === "user" ? "pg-chat-user" : "pg-chat-ai");
  div.innerHTML =
    role === "user"
      ? '<div class="pg-chat-bubble">' + pgChatEsc(text) + "</div>"
      : '<div class="pg-chat-bubble">' +
        (raw ? text : (typeof renderMarkdown === "function" ? renderMarkdown(text) : pgChatEsc(text))) +
        "</div>";
  pgChatMsgs.appendChild(div);
  pgChatMsgs.scrollTop = pgChatMsgs.scrollHeight;
}

function saveShared() {
  try { localStorage.setItem(PG_CHAT_KEY, JSON.stringify(pgSharedHistory)); } catch (e) {}
}

function trimShared() {
  if (pgSharedHistory.length > 30) pgSharedHistory = pgSharedHistory.slice(-30);
}

// 恢复历史（仅当编辑器有代码时）
function restoreShared() {
  if (!getCode() || !getCode().trim()) { pgSharedHistory = []; return; }
  try {
    const saved = JSON.parse(localStorage.getItem(PG_CHAT_KEY) || "[]");
    pgSharedHistory = Array.isArray(saved) ? saved : [];
    for (const m of pgSharedHistory) {
      if (m && typeof m.content === "string") pgChatRender(m.role, m.content);
    }
  } catch (e) { pgSharedHistory = []; }
}

// 代码清空 → 上下文自动清除（代码在记忆在）
function pgChatAutoClearIfEmpty() {
  if (!getCode() || !getCode().trim()) {
    if (pgSharedHistory.length) {
      pgSharedHistory = [];
      try { localStorage.removeItem(PG_CHAT_KEY); } catch (e) {}
      pgChatMsgs.innerHTML = "";
    }
  }
}

// 主动清记忆
function pgChatClear() {
  if (!pgSharedHistory.length && !pgChatMsgs.children.length) return;
  if (!confirm("确定清除猫猫老师的记忆吗？")) return;
  pgSharedHistory = [];
  try { localStorage.removeItem(PG_CHAT_KEY); } catch (e) {}
  pgChatMsgs.innerHTML = "";
  pgChatRender("assistant", PG_TRASH_SVG + " 记忆已清除，猫猫老师啥都不记得了喵~", true);
}

// 压缩上下文
async function pgChatCompress() {
  if (!pgSharedHistory.length) {
    pgChatRender("assistant", "还没有可压缩的对话喵~");
    return;
  }
  pgChatZipBtn.disabled = true;
  const typing = document.createElement("div");
  typing.className = "pg-chat-msg pg-chat-ai";
  typing.innerHTML = '<div class="pg-chat-bubble">正在压缩上下文…</div>';
  pgChatMsgs.appendChild(typing);
  pgChatMsgs.scrollTop = pgChatMsgs.scrollHeight;
  try {
    const resp = await api("/api/chat/compress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: pgSharedHistory }),
    });
    typing.remove();
    const summary = resp.summary || "（压缩失败）";
    pgSharedHistory = [{ role: "user", content: "[以下是之前对话的压缩摘要，请基于此继续教学]\n" + summary }];
    saveShared();
    pgChatMsgs.innerHTML = "";
    pgChatRender("assistant", PG_ZIP_SVG + " 已压缩！之前的对话浓缩成一段摘要，省 token 喵~", true);
    pgChatRender("assistant", "【压缩摘要】\n" + summary);
  } catch (e) {
    typing.remove();
    pgChatRender("assistant", "压缩失败: " + e.message);
  }
  pgChatZipBtn.disabled = false;
}

async function pgChatSendMsg() {
  const text = pgChatInput.value.trim();
  if (!text || pgChatBusy) return;
  pgChatInput.value = "";
  pgChatRender("user", text);
  pgSharedHistory.push({ role: "user", content: text });

  pgChatBusy = true;
  pgChatSend.disabled = true;

  const typing = document.createElement("div");
  typing.className = "pg-chat-msg pg-chat-ai";
  typing.innerHTML = '<div class="pg-chat-bubble">猫猫思考中…</div>';
  pgChatMsgs.appendChild(typing);
  pgChatMsgs.scrollTop = pgChatMsgs.scrollHeight;

  try {
    const resp = await api("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: pgSharedHistory, context: getCode() }),
    });
    typing.remove();
    pgSharedHistory.push({ role: "assistant", content: resp.reply });
    trimShared();
    saveShared();
    pgChatRender("assistant", resp.reply);
  } catch (e) {
    typing.remove();
    pgChatRender("assistant", "请求失败: " + e.message);
  }

  pgChatBusy = false;
  pgChatSend.disabled = false;
  pgChatInput.focus();
}

pgChatSend.addEventListener("click", pgChatSendMsg);
if (pgChatClearBtn) pgChatClearBtn.addEventListener("click", pgChatClear);
if (pgChatZipBtn) pgChatZipBtn.addEventListener("click", pgChatCompress);
pgChatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    pgChatSendMsg();
  }
});
pgChatInput.addEventListener("input", function () {
  pgChatInput.style.height = "auto";
  pgChatInput.style.height = Math.min(pgChatInput.scrollHeight, 80) + "px";
});

// 编辑器变化时：代码清空 → 自动清上下文
function pgChatWatchCode() {
  if (pgEditor) {
    pgEditor.on("change", pgChatAutoClearIfEmpty);
  } else {
    pgEditorEl.addEventListener("input", pgChatAutoClearIfEmpty);
  }
}

// 初始化：代码在→恢复记忆；代码空→无记忆
pgChatWatchCode();
restoreShared();
