async function api(url, options) {
  const resp = await fetch(url, options);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("pp_progress") || '{"chapters":{}}');
  } catch {
    return { chapters: {} };
  }
}

function saveProgress(progress) {
  localStorage.setItem("pp_progress", JSON.stringify(progress));
  api("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progress),
  }).catch(() => {});
}

const chapterId = Number(location.pathname.split("/")[2]);
const params = new URLSearchParams(location.search);
const qIndex = Number(params.get("q") || 0);

let currentExercise = null;
let chapterTitle = "";
let pyodide = null;
const pyodideRef = { current: null };

const editorEl = document.getElementById("code-editor");
const outputEl = document.getElementById("output");
const runBtn = document.getElementById("btn-run");
const hintBox = document.getElementById("hint-box");
const aiReply = document.getElementById("ai-reply");
const statusEl = document.getElementById("editor-status");

let editor;
try {
  editor = CodeMirror.fromTextArea(editorEl, {
    mode: "python",
    theme: "dracula",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    lint: { getAnnotations: makePyLint(pyodideRef), async: false },
    gutters: ["CodeMirror-lint-markers"],
    extraKeys: { "Tab": "indentMore", "Shift-Tab": "indentLess" },
  });
  editor.setSize("100%", "400px");
} catch (e) {
  editor = null;
  console.warn("CodeMirror加载失败，使用textarea:", e);
}

function getCode() {
  return editor ? editor.getValue() : editorEl.value;
}

function setCode(code) {
  if (editor) editor.setValue(code);
  else editorEl.value = code;
}

document.getElementById("back-link").href = `/chapter/${chapterId}`;

async function initPyodide() {
  statusEl.textContent = "加载Python环境...";
  try {
    pyodide = await loadPyodide({ indexURL: "/static/pyodide/" });
    pyodideRef.current = pyodide;
    runBtn.disabled = false;
    statusEl.textContent = "Python环境就绪（语法检查已开启）";
  } catch (e) {
    statusEl.textContent = "Python环境加载失败";
    outputEl.textContent = "Pyodide 加载失败: " + e.message;
  }
}

async function runCode() {
  if (!pyodide) {
    outputEl.textContent = "Python环境还没准备好，请稍等...";
    return;
  }
  const code = getCode();
  outputEl.textContent = "";
  let stdout = "";
  pyodide.setStdout({ batched: (text) => { stdout += text + "\n"; } });
  pyodide.setStderr({ batched: (text) => { stdout += "[err] " + text + "\n"; } });
  try {
    const result = await pyodide.runPythonAsync(code);
    let output = stdout;
    if (result !== undefined && result !== null) {
      output += String(result);
    }
    outputEl.textContent = output || "(无输出)";
  } catch (e) {
    outputEl.textContent = stdout + "错误: " + e.message;
  }
}

async function render() {
  const data = await api(`/api/chapter/${chapterId}`);
  chapterTitle = data.chapter.title;
  const exercises = data.exercises;
  if (!exercises.length) {
    document.getElementById("exercise-desc").textContent = "本章暂无题目";
    return;
  }
  currentExercise = exercises[qIndex] || exercises[0];
  // 清理上一个题目的临时保存（如果是从别的题跳过来）
  document.getElementById("exercise-title").textContent = `${chapterTitle} · 第${qIndex + 1}题`;
  document.getElementById("exercise-desc").textContent =
    `【${currentExercise.title}】\n\n${currentExercise.description}`;
  const storageKey = "pp_code_" + chapterId + "_" + qIndex;
  setCode(loadSaved(storageKey, currentExercise.starter_code || ""));
  setupAutosave(editor, storageKey, getCode);
}

async function askAI(type) {
  if (!currentExercise) return;
  aiReply.textContent = "思考中...";
  const question = type === "hint"
    ? "我卡住了，给点提示吧（不要直接给完整答案，用反问引导我）"
    : "我写完了，帮我点评一下并给出优化建议和参考解法";
  try {
    const resp = await api("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        exercise: currentExercise,
        code: getCode(),
        chapter_title: chapterTitle,
        mode: type,
      }),
    });
    aiReply.textContent = resp.reply;
  } catch (e) {
    aiReply.textContent = "AI请求失败: " + e.message;
  }
}

function markDone() {
  const progress = loadProgress();
  const ch = progress.chapters[chapterId] || { solved: 0, done: false };
  ch.solved = Math.max(ch.solved, qIndex + 1);
  const exercisesCount = currentExercise ? 1 : 0;
  if (ch.solved >= exercisesCount) ch.done = true;
  progress.chapters[chapterId] = ch;
  saveProgress(progress);
  statusEl.textContent = `已保存进度: 完成${ch.solved}题`;
}

function saveCurrentCode() {
  const code = getCode();
  if (!code || code.trim() === "") {
    alert("编辑器是空的，没啥好存档的");
    return;
  }
  const meta = `${chapterTitle} 第${qIndex + 1}题 ${currentExercise ? currentExercise.title : ""}`;
  saveToSaves(code, meta);
  statusEl.textContent = "已存入我的存档";
}

function openSavesList() {
  const modal = document.getElementById("saves-modal");
  const listEl = document.getElementById("saves-list");
  const saves = loadSaves();
  if (!saves.length) {
    listEl.innerHTML = '<p class="modal-tip">还没有存档。写代码时点"存档"按钮可以手动保存。</p>';
  } else {
    listEl.innerHTML = saves.map((s, i) => `
      <div class="save-item">
        <div class="save-meta">${s.ts} | ${s.meta || "未标注"}</div>
        <pre class="save-preview">${s.code.slice(0, 120)}${s.code.length > 120 ? "..." : ""}</pre>
        <div class="save-actions">
          <button class="btn btn-small" onclick="restoreSave(${s.id})">载入</button>
          <button class="btn btn-small btn-danger" onclick="removeSave(${s.id})">删除</button>
        </div>
      </div>`).join("");
  }
  modal.style.display = "flex";
}

function restoreSave(id) {
  const saves = loadSaves();
  const s = saves.find((x) => x.id === id);
  if (s) {
    setCode(s.code);
    document.getElementById("saves-modal").style.display = "none";
    statusEl.textContent = "已载入存档";
  }
}

function removeSave(id) {
  deleteSave(id);
  openSavesList();
}

window.restoreSave = restoreSave;
window.removeSave = removeSave;


document.getElementById("btn-run").addEventListener("click", runCode);
document.getElementById("btn-ai-help").addEventListener("click", () => {
  if (hintBox.style.display === "none") {
    hintBox.style.display = "block";
    hintBox.textContent = "提示: " + (currentExercise?.hint || "暂无提示，问猫猫老师吧");
  } else {
    hintBox.style.display = "none";
  }
});
document.getElementById("btn-ai-review").addEventListener("click", () => askAI("review"));
document.getElementById("btn-mark-done").addEventListener("click", markDone);
document.getElementById("btn-save-code").addEventListener("click", saveCurrentCode);
document.getElementById("btn-list-saves").addEventListener("click", openSavesList);
document.getElementById("btn-saves-close").addEventListener("click", () => {
  document.getElementById("saves-modal").style.display = "none";
});
document.getElementById("btn-saves-clear").addEventListener("click", () => {
  if (confirm("确定清空全部存档？此操作不可恢复")) {
    clearAllSaves();
    openSavesList();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await render();
  initPyodide();
});
