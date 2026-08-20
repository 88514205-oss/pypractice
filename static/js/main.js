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

async function renderChapterList() {
  const listEl = document.getElementById("chapter-list");
  try {
    const chapters = await api("/api/chapters");
    const progress = loadProgress();
    const totalSolved = Object.values(progress.chapters).reduce((s, c) => s + (c.solved || 0), 0);

    const statsBar = document.getElementById("stats-bar");
    if (statsBar) {
      statsBar.textContent = `已解 ${totalSolved} 题 · 已完成 ${Object.values(progress.chapters).filter(c => c.done).length}/${chapters.length} 章`;
    }

    listEl.innerHTML = chapters.map((ch, idx) => {
      const p = progress.chapters[ch.id] || {};
      const done = p.done ? "done" : "";
      const isCurrent = !p.done && (idx === 0 || (progress.chapters[chapters[idx - 1]?.id] || {}).done) ? "current" : "";
      return `
        <div class="chapter-card ${done} ${isCurrent}" onclick="location.href='/chapter/${ch.id}'">
          <div class="chapter-num">CHAPTER ${String(ch.id).padStart(2, "0")}</div>
          <div class="chapter-title">${ch.title}</div>
          <div class="chapter-desc">${ch.desc || ""}</div>
          <div class="chapter-progress">${p.solved ? `已完成 ${p.solved} 题` : "未开始"}</div>
        </div>`;
    }).join("");
  } catch (e) {
    listEl.innerHTML = `<p class="loading">加载失败: ${e.message}。确认已运行 server.py 喵</p>`;
  }
}

document.addEventListener("DOMContentLoaded", renderChapterList);

async function initConfigUI() {
  const modal = document.getElementById("config-modal");
  const openBtn = document.getElementById("open-config");
  if (!modal || !openBtn) return;

  openBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    modal.style.display = "flex";
    try {
      const cfg = await api("/api/config");
      document.getElementById("cfg-model").value = cfg.model || "deepseek-chat";
      const msg = document.getElementById("cfg-msg");
      msg.textContent = cfg.configured ? "✅ 猫猫老师已配置，随时可用" : "尚未配置，填好Key后保存即可";
      msg.style.color = cfg.configured ? "#27ae60" : "#e17055";
    } catch {}
  });

  document.getElementById("btn-cfg-cancel").addEventListener("click", () => {
    modal.style.display = "none";
  });

  document.getElementById("btn-cfg-save").addEventListener("click", async () => {
    const key = document.getElementById("cfg-key").value.trim();
    const model = document.getElementById("cfg-model").value.trim();
    const msg = document.getElementById("cfg-msg");
    if (!key) {
      msg.textContent = "Key不能为空哦";
      msg.style.color = "#e17055";
      return;
    }
    try {
      const result = await api("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key, model }),
      });
      if (result.ok) {
        msg.textContent = "✅ 保存成功！猫猫老师上线了";
        msg.style.color = "#27ae60";
        document.getElementById("cfg-key").value = "";
      } else {
        msg.textContent = result.error || "保存失败";
        msg.style.color = "#e17055";
      }
    } catch (e) {
      msg.textContent = "保存失败: " + e.message;
      msg.style.color = "#e17055";
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", initConfigUI);
