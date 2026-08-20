function renderMarkdown(src) {
  let html = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
    return `<pre class="code-block"><code>${code.trim()}</code></pre>`;
  });

  html = html.replace(/^###### (.*)$/gm, "<h6>$1</h6>");
  html = html.replace(/^##### (.*)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  html = html.replace(/^\s*[-*] (.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)\s*(?=<li>|$)/g, (m) => `<ul>${m}</ul>`);

  html = html.replace(/^\s*(\d+)\. (.*)$/gm, "<li>$2</li>");

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>');

  const lines = html.split("\n");
  const result = [];
  let inP = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (inP) { result.push("</p>"); inP = false; }
      continue;
    }
    if (/^<(h[1-6]|ul|ol|li|pre|blockquote)/.test(t)) {
      if (inP) { result.push("</p>"); inP = false; }
      result.push(t);
      continue;
    }
    if (!inP) { result.push("<p>"); inP = true; }
    result.push(t);
  }
  if (inP) result.push("</p>");
  return result.join("\n");
}
