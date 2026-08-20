const CH_STAR_SVG = '<svg class="ico ico-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>';
const CH_ALERT_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
function stars(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += CH_STAR_SVG;
  return s;
}

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
      <span class="diff d${ex.difficulty || 1}">${stars(ex.difficulty || 1)}</span>
    </li>
  `).join("") || "<li>本章暂无题目</li>";

  const pfList = document.getElementById("pitfall-list");
  pfList.innerHTML = data.pitfalls.slice(0, 5).map(p => `
    <li class="pitfall-item" title="${p.reason}">
      ${CH_ALERT_SVG} ${p.title}
    </li>
  `).join("") || "<li>本章暂无记录</li>";
}

document.addEventListener("DOMContentLoaded", render);
