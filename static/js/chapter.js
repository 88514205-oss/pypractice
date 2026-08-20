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

const chapterId = Number(location.pathname.split("/").pop());

async function render() {
  const data = await api(`/api/chapter/${chapterId}`);
  document.getElementById("chapter-title").textContent = `${data.chapter.title}`;
  document.getElementById("chapter-content").innerHTML = renderMarkdown(data.content);

  const progress = loadProgress();
  const chProgress = progress.chapters[chapterId] || { solved: 0, done: false };

  const exList = document.getElementById("exercise-list");
  exList.innerHTML = data.exercises.map((ex, i) => `
    <li>
      <a href="/practice/${chapterId}?q=${i}">${i + 1}. ${ex.title}</a>
      <span class="diff d${ex.difficulty || 1}">${"★".repeat(ex.difficulty || 1)}</span>
    </li>
  `).join("") || "<li>本章暂无题目</li>";

  const pfList = document.getElementById("pitfall-list");
  pfList.innerHTML = data.pitfalls.slice(0, 5).map(p => `
    <li class="pitfall-item" title="${p.reason}">
      💀 ${p.title}
    </li>
  `).join("") || "<li>本章暂无记录</li>";
}

document.addEventListener("DOMContentLoaded", render);
