@echo off
chcp 65001 >nul
title Python从print到GIL锁死
echo ======================================
echo   Python从print到GIL锁死
echo ======================================
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo [错误] 未找到 python，请先安装 Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

if not exist venv (
    echo [首次运行] 创建虚拟环境...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [检查依赖]...
pip install -q -r requirements.txt 2>nul || pip install -r requirements.txt

if not exist config.json (
    echo.
    echo [提示] 首次使用：在网页底部点 [配置AI] 填入 DeepSeek API Key
    echo        不填也能用题库和编辑器，只是没有AI老师
    echo.
)

echo [启动中]...
echo   打开浏览器访问: http://127.0.0.1:8899
echo   (按 Ctrl+C 停止)
echo.
python server.py

pause
