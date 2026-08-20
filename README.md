# 🐍 Python从print到GIL锁死

本地部署的 Python 自学平台。clone 或下载压缩包即可使用。

从第一行 `print()` 开始，一路学到并发、GIL、性能优化。带完整章节引导、练习题、易错点坟场、AI 教导（防偷懒模式）。

## ✨ 功能

- **章节引导**：从 print 到 GIL，分章节渐进式学习
- **在线练习**：浏览器内运行 Python（Pyodide），你的代码只在你浏览器里跑
- **AI 教导**：卡住了问 GIL 老师，只给提示不给答案；写完了求点评，给优化建议
- **易错点坟场**：每章整理经典踩坑记录
- **学习进度**：自动保存做题进度，浏览器本地存储 + 服务端备份
- **离线可用**：除了首次加载 Python 环境和 AI 功能外，题库/编辑器/进度全部本地运行

## 🚀 快速启动

### 1. 环境要求

- Python 3.8+
- （可选）一个 DeepSeek API Key（用于 AI 教导，不填也能用题库和编辑器）

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置 API Key（可选）

```bash
cp config.example.json config.json
# 编辑 config.json，填入你自己的 DeepSeek API Key
```

也可以使用环境变量（优先于 config.json）：

```bash
export DEEPSEEK_API_KEY=sk-你的Key
```

### 4. 启动

```bash
python3 server.py
```

访问 `http://127.0.0.1:8899`

## 📁 目录结构

```
├── server.py              # FastAPI 服务器
├── config.example.json    # 配置示例（复制为 config.json 使用）
├── requirements.txt
├── content/
│   ├── chapters/          # 章节教程（Markdown）
│   ├── exercises/         # 练习题（JSON）
│   ├── pitfalls/          # 易错点（JSON）
│   └── kw_data.json       # 关键词索引（AI 检索用）
├── static/                # 前端页面
└── data/                  # 学习进度（自动生成）
```

## 🆕 添加新章节

1. 在 `content/chapters/` 写 `chXX_名称.md`
2. 在 `content/exercises/` 写 `chXX.json`（题目数组）
3. 在 `content/pitfalls/` 写 `chXX.json`（易错点数组）
4. 重启服务即可

题目 JSON 格式：

```json
[
  {
    "id": 1,
    "title": "题目名",
    "description": "题目描述",
    "difficulty": 1,
    "hint": "提示（点击显示）",
    "starter_code": "初始代码",
    "expected_output": "期望输出"
  }
]
```

## 📝 内容进度

- [x] CH1 你好世界（print/变量）
- [x] CH2 数据容器（列表/字典/元组/集合）
- [x] CH3 流程控制（if/for/while）
- [x] CH4 函数
- [x] CH5 文件与异常
- [x] CH6 面向对象
- [x] CH7 常用模块
- [x] CH8 实战小项目
- [x] CH9 网络与API
- [x] CH10 数据库 SQLite
- [x] CH11 Web开发 FastAPI
- [x] CH12 云端部署
- [ ] 章节小测验
- [ ] 打卡/成就系统
- [ ] 一键打包发布（压缩包）

## 📜 License

MIT
