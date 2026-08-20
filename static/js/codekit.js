// codekit.js - 共享代码工具：语法检查 + 自动保存

// Python 语法检查（基于 Pyodide，只在有 pyodide 时生效）
function makePyLint(pyodideRef) {
  return function (text) {
    const found = [];
    if (!pyodideRef.current) {
      return found;
    }
    try {
      // 用 Python 的 compile() 只检查语法，不执行代码
      pyodideRef.current.runPython(`
import json
def check_syntax(code):
    try:
        compile(code, "<student>", "exec")
        return []
    except SyntaxError as e:
        return [{"line": e.lineno or 0, "msg": e.msg}]
    except Exception as e:
        return []
`);
      const result = pyodideRef.current.runPython(`check_syntax(${JSON.stringify(text)})`);
      for (const err of result) {
        found.push({
          from: { line: Math.max(0, err.line - 1), ch: 0 },
          to: { line: Math.max(0, err.line - 1), ch: 1000 },
          message: "语法错误: " + err.msg,
          severity: "error",
        });
      }
    } catch (e) {
      // pyodide 还没就绪时跳过 lint
    }
    return found;
  };
}

// 自动保存：临时保存到 sessionStorage（刷新保留，关闭标签页自动清除，不膨胀）
function setupAutosave(editor, storageKey, getCode) {
  if (!editor) return;
  editor.on("change", () => {
    try {
      sessionStorage.setItem(storageKey, getCode());
    } catch (e) {}
  });
}

// 从 sessionStorage 恢复临时代码（无保存则返回默认）
function loadSaved(storageKey, defaultCode) {
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved !== null && saved !== undefined && saved.trim() !== "") {
      return saved;
    }
  } catch (e) {}
  return defaultCode;
}

// 清空指定 key 的自动保存
function clearSaved(storageKey) {
  try {
    sessionStorage.removeItem(storageKey);
  } catch (e) {}
}

// ===== 手动存档系统（localStorage，数量受限防膨胀）=====
const SAVES_KEY = "pp_saves";
const MAX_SAVES = 30;

function loadSaves() {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveToSaves(code, meta) {
  const saves = loadSaves();
  const entry = {
    id: Date.now(),
    ts: new Date().toLocaleString("zh-CN"),
    code: code,
    meta: meta || "",
  };
  saves.unshift(entry);
  // 防膨胀：只保留最近 MAX_SAVES 条
  const trimmed = saves.slice(0, MAX_SAVES);
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(trimmed));
  } catch (e) {}
  return entry;
}

function deleteSave(id) {
  const saves = loadSaves().filter((s) => s.id !== id);
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
  } catch (e) {}
}

function clearAllSaves() {
  try {
    localStorage.removeItem(SAVES_KEY);
  } catch (e) {}
}
