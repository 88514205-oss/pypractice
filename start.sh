#!/bin/bash
# Python从print到GIL锁死 - 一键启动（Linux/Mac）
# 用法: ./start.sh

echo "======================================"
echo "  🐍 Python从print到GIL锁死"
echo "======================================"

cd "$(dirname "$0")"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 python3，请先安装 Python 3.8+"
    read -p "按回车退出..."
    exit 1
fi

# 创建虚拟环境（如果没有）
if [ ! -d "venv" ]; then
    echo "📦 首次运行，创建虚拟环境..."
    python3 -m venv venv
fi

# 激活环境并安装依赖
source venv/bin/activate
echo "📦 检查依赖..."
pip install -q -r requirements.txt 2>/dev/null || pip install -r requirements.txt

# 提示配置API Key
if [ ! -f "config.json" ]; then
    echo ""
    echo "ℹ️  首次使用：可以在网页底部点 [⚙️ AI配置] 填入 DeepSeek API Key"
    echo "   不填也能用题库和编辑器，只是没有AI老师"
    echo ""
fi

echo "🚀 启动中..."
echo "   打开浏览器访问: http://127.0.0.1:8899"
echo "   (按 Ctrl+C 停止)"
echo ""

python3 server.py

read -p "按回车退出..."
