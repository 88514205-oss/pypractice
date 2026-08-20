# 第12章 云端部署：让它24小时在线

> 本地写的服务关掉电脑就没了。部署到云服务器上，7×24小时在线。这一章学会 Linux 部署和 Docker 容器化。

## 12.1 你需要一台服务器

买一台云服务器（阿里云/腾讯云/华为云都有学生机，很便宜），或者用你手上的任何Linux机器。

```bash
# 连接服务器（本地终端执行）
ssh root@你的服务器IP
```

## 12.2 部署你的FastAPI应用

```bash
# 在服务器上
mkdir -p /opt/myapp && cd /opt/myapp

# 上传代码（本地执行）
scp main.py requirements.txt root@服务器IP:/opt/myapp/

# 回到服务器
cd /opt/myapp
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 12.3 用 systemd 守护进程

```bash
# /etc/systemd/system/myapp.service
[Unit]
Description=My FastAPI App
After=network.target

[Service]
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable myapp     # 开机自启
systemctl start myapp      # 启动
systemctl status myapp     # 查看状态
```

这样服务崩了会自动重启，服务器重启也会自动拉起。

## 12.4 Docker 容器化

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# 构建和运行
docker build -t myapp .
docker run -d -p 8000:8000 --name myapp --restart=always myapp
```

`--restart=always` 让容器崩了自动重启。

## 12.5 Nginx 反向代理

Nginx 在前面挡请求，转发给后端应用：

```nginx
# /etc/nginx/sites-available/myapp
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

这样用户访问 `http://your-domain.com` 就直接进你的应用了。

## 12.6 常用 Linux 命令

```bash
ls          # 列出文件
cd /opt     # 切换目录
pwd         # 当前目录
mkdir xxx   # 建目录
rm file     # 删文件
ps aux      # 查看进程
top         # 系统监控
htop        # 更友好的监控
df -h       # 磁盘空间
free -h     # 内存
systemctl   # 管理服务
docker ps   # 查看容器
docker logs myapp   # 看容器日志
```

## 小结

- ssh/scp 连接和传文件
- venv 隔离Python环境
- systemd 守护进程自动重启
- Docker 容器化部署
- Nginx 反向代理 + 域名

去练习页试试吧。
