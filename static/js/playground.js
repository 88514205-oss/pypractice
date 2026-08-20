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
    const resp = await api("/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: getCode(), mode: "free" }),
    });
    reviewEl.textContent = resp.reply;
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
