import json
import os
import re
import glob
from pathlib import Path

import base64
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent
CONTENT_DIR = BASE_DIR / "content"
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"

app = FastAPI(title="Python从print到GIL锁死")


def load_config():
    cfg_path = BASE_DIR / "config.json"
    example_path = BASE_DIR / "config.example.json"
    if cfg_path.exists():
        with open(cfg_path, "r", encoding="utf-8") as f:
            return json.load(f)
    with open(example_path, "r", encoding="utf-8") as f:
        return json.load(f)


config = load_config()


def encode_key(key):
    """简单混淆存储，避免明文直接落盘"""
    try:
        return "enc:" + base64.b64encode(key.encode("utf-8")).decode("ascii")
    except Exception:
        return key


def decode_key(stored):
    """读取时解码"""
    if not stored:
        return ""
    if isinstance(stored, str) and stored.startswith("enc:"):
        try:
            return base64.b64decode(stored[4:]).decode("utf-8")
        except Exception:
            return ""
    return stored


def config_status():
    stored = config.get("deepseek", {}).get("api_key", "")
    key = os.environ.get("DEEPSEEK_API_KEY") or decode_key(stored)
    configured = bool(key) and not key.startswith("sk-在这里")
    return {"configured": configured, "model": config.get("deepseek", {}).get("model", "deepseek-chat")}


@app.get("/api/config")
async def api_config():
    return config_status()


@app.post("/api/config")
async def api_save_config(request: Request):
    body = await request.json()
    key = (body.get("api_key") or "").strip()
    model = (body.get("model") or "").strip() or "deepseek-chat"
    if not key:
        return {"ok": False, "error": "API Key不能为空"}
    cfg = load_config()
    cfg.setdefault("deepseek", {})["api_key"] = encode_key(key)
    cfg["deepseek"]["model"] = model
    with open(BASE_DIR / "config.json", "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    global config
    config = cfg
    return {"ok": True}


def load_chapters():
    chapters = []
    files = sorted(glob.glob(str(CONTENT_DIR / "chapters" / "ch*.md")))
    for fp in files:
        name = os.path.basename(fp)
        m = re.match(r"ch(\d+)_(.+)\.md", name)
        if not m:
            continue
        num = int(m.group(1))
        slug = m.group(2)
        with open(fp, "r", encoding="utf-8") as f:
            head = f.read(2000)
        title_m = re.search(r"^#\s+(.+)$", head, re.MULTILINE)
        title = title_m.group(1).strip() if title_m else slug
        desc_m = re.search(r"^> (.+)$", head, re.MULTILINE)
        desc = desc_m.group(1).strip() if desc_m else ""
        chapters.append({"id": num, "slug": slug, "title": title, "desc": desc, "file": name})
    return chapters


def load_exercises(chapter_id):
    fp = CONTENT_DIR / "exercises" / f"ch{chapter_id:02d}.json"
    if fp.exists():
        with open(fp, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def load_pitfalls(chapter_id):
    fp = CONTENT_DIR / "pitfalls" / f"ch{chapter_id:02d}.json"
    if fp.exists():
        with open(fp, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def load_kw_index():
    fp = CONTENT_DIR / "kw_data.json"
    if fp.exists():
        with open(fp, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


KW_INDEX = load_kw_index()


def load_progress():
    fp = DATA_DIR / "progress.json"
    if fp.exists():
        with open(fp, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"chapters": {}, "stats": {"total_solved": 0, "streak": 0}}


def save_progress(data):
    fp = DATA_DIR / "progress.json"
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def search_docs(query):
    results = []
    q = query.lower()
    for kw, entry in KW_INDEX.items():
        if kw.lower() in q or q in kw.lower():
            results.append({"keyword": kw, "title": entry.get("title", ""), "desc": entry.get("desc", ""), "doc": entry.get("doc", "")})
    for ch in load_chapters():
        if any(k in q for k in [ch["title"].lower(), str(ch["id"])]):
            results.append({"chapter": ch["id"], "title": ch["title"], "desc": ch["desc"]})
    return results[:8]


@app.get("/", response_class=HTMLResponse)
async def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/chapter/{chapter_id}", response_class=HTMLResponse)
async def chapter_page(chapter_id: int):
    return FileResponse(STATIC_DIR / "chapter.html")


@app.get("/practice/{chapter_id}", response_class=HTMLResponse)
async def practice_page(chapter_id: int):
    return FileResponse(STATIC_DIR / "practice.html")


@app.get("/playground", response_class=HTMLResponse)
async def playground_page():
    return FileResponse(STATIC_DIR / "playground.html")


@app.get("/api/chapters")
async def api_chapters():
    return load_chapters()


@app.get("/api/chapter/{chapter_id}")
async def api_chapter(chapter_id: int):
    chapters = load_chapters()
    ch = next((c for c in chapters if c["id"] == chapter_id), None)
    if not ch:
        raise HTTPException(404, "章节不存在")
    fp = CONTENT_DIR / "chapters" / ch["file"]
    with open(fp, "r", encoding="utf-8") as f:
        content = f.read()
    return {
        "chapter": ch,
        "content": content,
        "exercises": load_exercises(chapter_id),
        "pitfalls": load_pitfalls(chapter_id),
    }


@app.get("/api/search")
async def api_search(q: str = ""):
    if not q:
        return []
    return search_docs(q)


@app.get("/api/progress")
async def api_progress():
    return load_progress()


@app.post("/api/progress")
async def api_save_progress(request: Request):
    body = await request.json()
    data = load_progress()
    for ch_id, info in (body.get("chapters") or {}).items():
        data["chapters"][ch_id] = info
    data["stats"] = body.get("stats", data["stats"])
    save_progress(data)
    return {"ok": True}


def get_ai_config():
    stored = config.get("deepseek", {}).get("api_key", "")
    key = os.environ.get("DEEPSEEK_API_KEY") or decode_key(stored)
    base_url = config.get("deepseek", {}).get("base_url", "https://api.deepseek.com/v1")
    model = config.get("deepseek", {}).get("model", "deepseek-chat")
    return key, base_url, model


def ask_deepseek(messages):
    key, base_url, model = get_ai_config()
    if not key or key.startswith("sk-在这里"):
        return None
    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {key}"},
                json={"model": model, "messages": messages, "temperature": 0.7},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[AI请求失败: {e}]"


def web_search(query, max_results=5):
    try:
        resp = httpx.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
            timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
        )
        resp.raise_for_status()
        results = []
        for m in re.finditer(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>', resp.text, re.S):
            url = m.group(1)
            title = re.sub(r"<[^>]+>", "", m.group(2)).strip()
            if "uddg=" in url:
                from urllib.parse import urlparse, parse_qs, unquote
                q = parse_qs(urlparse(url).query)
                if "uddg" in q:
                    url = unquote(q["uddg"][0])
            results.append({"title": title, "url": url})
            if len(results) >= max_results:
                break
        return {"results": results} if results else {"results": [], "note": "没有搜到结果"}
    except Exception as e:
        return {"error": str(e)}


def fetch_url_text(url):
    try:
        resp = httpx.get(
            url,
            timeout=20,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            },
        )
        resp.raise_for_status()
        html = resp.text
        html = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.S)
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        return {"url": url, "text": text[:4000]}
    except Exception as e:
        return {"error": str(e), "url": url}


def execute_tool(name, args):
    if name == "search_web":
        return web_search(str(args.get("query", "")), int(args.get("max_results", 5) or 5))
    if name == "fetch_url":
        return fetch_url_text(str(args.get("url", "")))
    return {"error": f"未知工具: {name}"}


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": (
                "搜索互联网上的技术文档与资料（Python官方文档、教程、博客等），"
                "返回相关网页的标题和链接。当需要查证知识点、查找官方文档、"
                "或用户的问题较新/较偏/超出已有知识时使用。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索关键词，例如 'python 列表 append 文档'"}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_url",
            "description": (
                "获取指定网页的正文内容（截取前4000字符），用于阅读文档细节。"
                "搜索到相关链接后，用此工具打开阅读并引用。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "要阅读的网页URL"}
                },
                "required": ["url"],
            },
        },
    },
]


def ask_deepseek_tools(messages, tools, max_rounds=4):
    key, base_url, model = get_ai_config()
    if not key or key.startswith("sk-在这里"):
        return None
    msgs = list(messages)
    try:
        with httpx.Client(timeout=60) as client:
            for _ in range(max_rounds):
                payload = {"model": model, "messages": msgs, "temperature": 0.7, "tools": tools}
                resp = client.post(
                    f"{base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {key}"},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                msg = data["choices"][0]["message"]
                if msg.get("tool_calls"):
                    msgs.append(msg)
                    for tc in msg["tool_calls"]:
                        fn = tc.get("function", {})
                        name = fn.get("name", "")
                        try:
                            args = json.loads(fn.get("arguments") or "{}")
                        except Exception:
                            args = {}
                        result = execute_tool(name, args)
                        msgs.append(
                            {
                                "role": "tool",
                                "tool_call_id": tc.get("id", ""),
                                "content": json.dumps(result, ensure_ascii=False),
                            }
                        )
                    continue
                return msg.get("content")
            return "[AI: 工具调用轮次用尽]"
    except Exception as e:
        return f"[AI请求失败: {e}]"


@app.post("/api/ai/ask")
async def ai_ask(request: Request):
    body = await request.json()
    question = body.get("question", "")
    exercise = body.get("exercise", {})
    code = body.get("code", "")
    chapter_title = body.get("chapter_title", "")

    ctx = f"你在学习「{chapter_title}」。"
    if exercise:
        ctx += f"\n当前题目: {exercise.get('title','')}\n题目描述: {exercise.get('description','')}"
    if code:
        ctx += f"\n用户当前代码:\n{code}"

    messages = [
        {"role": "system", "content": (
            "你是一个叫猫猫的Python学习导师，毒舌但教学认真，'喵'偶尔点缀即可，教学效率优先。"
            "教学原则：不直接给完整答案，用反问和提示引导学习者自己思考。"
            "可以给思路关键词、小例子、常见坑的提示，但不要把完整解法代码一次写完。"
            "如果学习者明确表示已经写完了想对比参考，才给出参考解法。"
            "回答要简洁，控制在200字以内。"
        )},
        {"role": "user", "content": f"{ctx}\n\n学习者的提问: {question}"},
    ]
    reply = ask_deepseek(messages)
    if reply is None:
        return {"reply": "AI未配置：请在 config.json 里填 DeepSeek API Key（参考 config.example.json）"}
    return {"reply": reply}


@app.post("/api/ai/review")
async def ai_review(request: Request):
    body = await request.json()
    code = body.get("code", "")
    exercise = body.get("exercise", {})
    chapter_title = body.get("chapter_title", "")
    mode = body.get("mode", "")

    if mode == "free":
        messages = [
            {"role": "system", "content": (
                "你是Python代码审阅老师。用户自由提交了一段代码，请你全面审查："
                "1. 代码正确性：有没有bug、有没有运行错误"
                "2. 代码风格：是否符合PEP8、命名是否合理"
                "3. 优化建议：哪里可以更Pythonic、更高效"
                "4. 给出改进后的参考版本（代码块形式）"
                "点评具体、鼓励为主，控制在400字以内。"
            )},
            {"role": "user", "content": f"用户的代码:\n{code}"},
        ]
    else:
        messages = [
            {"role": "system", "content": (
                "你是Python代码审阅老师。学习者写完了一道题，请你点评："
                "1. 代码是否正确、能否运行"
                "2. 有哪里可以优化（更Pythonic的写法）"
                "3. 给出一个参考解法（代码块形式）"
                "点评要具体，鼓励为主，控制在300字以内。"
            )},
            {"role": "user", "content": (
                f"章节: {chapter_title}\n题目: {exercise.get('title','')}\n"
                f"题目描述: {exercise.get('description','')}\n\n学习者的代码:\n{code}"
            )},
        ]
    reply = ask_deepseek(messages)
    if reply is None:
        return {"reply": "AI未配置：请在 config.json 里填 DeepSeek API Key（参考 config.example.json）"}
    return {"reply": reply}


@app.post("/api/chat")
async def api_chat(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    context = body.get("context", "")
    if not messages:
        return {"reply": "说点什么吧~"}
    sys_prompt = {
        "role": "system",
        "content": (
            "你是猫猫，一个Python学习导师，教学效率第一：回答直接清晰、切中要害，"
            "把知识讲明白为主。'喵'偶尔点缀即可，不要过度卖萌、不要堆砌语气词，"
            "不要因为人设耽误回答效率。"
            "引导式教学：优先让学习者自己思考，给思路和小提示；"
            "但如果学习者明确要答案、卡住了或直接问解法，就给出清晰完整的解答和示例代码。"
            "教学原则：不直接给完整答案，用反问和提示引导学习者自己思考。"
            "可以给思路关键词、小例子、常见坑的提示，但不要把完整解法代码一次写完。"
            "如果学习者明确表示想对比参考，才给出参考解法。"
            "回答要简洁，控制在300字以内。"
            "【联网能力】你可以调用 search_web 搜索互联网文档（Python官方文档/教程/博客），"
            "并用 fetch_url 阅读文档正文。当知识点需要确认、用户问得较偏、或需要最新资料时，"
            "先搜索再回答，并在回答末尾附上参考链接（格式：参考: 标题 - URL）。"
        ),
    }
    if context:
        sys_prompt["content"] += "\n用户当前正在写的代码（提问时参考，不要逐行复述）：\n" + context
    full = [sys_prompt] + messages[-20:]
    reply = ask_deepseek_tools(full, TOOLS)
    if reply is None:
        return {"reply": "AI未配置：请在首页底部点「AI配置」填 DeepSeek API Key（参考 config.example.json）"}
    return {"reply": reply}



@app.post("/api/chat/compress")
async def api_chat_compress(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    if not messages:
        return {"summary": ""}
    sys_prompt = {
        "role": "system",
        "content": (
            "你是一个对话压缩器。把用户提供的对话记录压缩成一段简洁摘要，"
            "保留关键信息：学到的知识点、讨论过的代码问题、猫猫老师给过的提示和结论。"
            "用中文，200字以内，直接输出摘要内容，不要任何前缀。"
        ),
    }
    reply = ask_deepseek([sys_prompt] + messages[-30:])
    if reply is None:
        return {"summary": "AI未配置，无法压缩"}
    return {"summary": reply}


@app.middleware("http")
async def no_cache_all(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

if __name__ == "__main__":
    import uvicorn

    host = config.get("server", {}).get("host", "0.0.0.0")
    port = config.get("server", {}).get("port", 8899)
    print(f"▶ Python从print到GIL锁死 已启动: http://{host}:{port}")
    print(f"▶ 未配置API Key时，AI教导不可用，但题库/编辑器/进度照常可用")
    uvicorn.run(app, host=host, port=port)
