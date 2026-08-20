# 第9章 网络与API：让程序上网

> 学会了这一章，你的程序就能和全世界交流了。API 是现代程序的基础设施。

## 9.1 什么是 API

API（Application Programming Interface）就是**别人服务器上开好的接口**，你发请求过去，它返回数据。

```
你的程序 --请求--> 别人的服务器
你的程序 <--响应-- 别人的服务器（通常是JSON）
```

生活类比：你到餐厅点菜（请求），服务员把菜端上来（响应）。

## 9.2 HTTP 基础

HTTP 请求有几种常见方法：

```python
import requests

# GET：获取数据
resp = requests.get("https://api.github.com/users/88514205-oss")
print(resp.status_code)   # 200 = 成功
data = resp.json()        # 解析成字典
print(data["login"])      # 88514205-oss

# POST：提交数据
resp = requests.post(
    "https://httpbin.org/post",
    json={"name": "白糖"},
    headers={"User-Agent": "my-python/1.0"},
    timeout=10,
)

# PUT：更新 / DELETE：删除
```

## 9.3 状态码

```python
200  # OK 成功
201  # Created 已创建
301  # 永久重定向
400  # 请求错误（参数不对）
401  # 未认证（没登录）
403  # 禁止访问（没权限）
404  # 不存在
429  # 请求太频繁
500  # 服务器内部错误
```

## 9.4 实际例子：天气查询

```python
import requests

city = "上海"
url = f"https://wttr.in/{city}?format=3"
resp = requests.get(url, timeout=10)
print(resp.text)  # 上海: 🌦️ +21°C
```

## 9.5 带参数的请求

```python
# GET 查询参数
params = {"q": "python", "page": 1, "per_page": 10}
resp = requests.get("https://api.github.com/search/repositories", params=params)
print(resp.url)  # 自动拼接 ?q=python&page=1&per_page=10

# POST JSON 数据（调大模型就是干这个）
payload = {
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "你好"}],
}
headers = {"Authorization": "Bearer sk-你的key"}
resp = requests.post("https://api.deepseek.com/v1/chat/completions",
                     json=payload, headers=headers, timeout=30)
print(resp.json()["choices"][0]["message"]["content"])
```

## 9.6 异常和重试

```python
import time
import requests

def fetch(url, retries=3):
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()   # 非2xx会抛异常
            return resp.json()
        except requests.RequestException as e:
            print(f"第{attempt+1}次失败: {e}")
            time.sleep(1)  # 等1秒再试
    return None

data = fetch("https://api.example.com/data")
print(data)
```

## 小结

- API = 服务器开好的接口
- GET 获取 / POST 提交
- `requests` 库：get/post + json参数 + headers + timeout
- `resp.status_code` 看状态码
- `resp.json()` 解析响应
- 网络请求要处理异常和重试

去练习页试试吧。
