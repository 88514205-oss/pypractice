# 第11章 Web开发：让你的代码给别人用

> 前面写的都是命令行程序。这一章学会用 FastAPI 把代码变成网页服务，别人用浏览器就能访问。

## 11.1 第一个FastAPI应用

```python
# pip install fastapi uvicorn
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "你好，世界！"}

@app.get("/hello/{name}")
def hello(name: str):
    return {"message": f"你好，{name}！"}
```

启动：

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
# 或 python -m uvicorn main:app --reload
```

浏览器访问 `http://127.0.0.1:8000/hello/白糖` → `{"message": "你好，白糖！"}`

## 11.2 路径参数和查询参数

```python
@app.get("/user/{user_id}")
def get_user(user_id: int):          # 类型注解会自动校验
    return {"id": user_id, "name": f"用户{user_id}"}

@app.get("/search")
def search(q: str = "", page: int = 1):   # 查询参数 ?q=xx&page=2
    return {"query": q, "page": page}
```

访问 `/search?q=python&page=2` → `{"query": "python", "page": 2}`

## 11.3 POST 接收数据

```python
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    price: float

@app.post("/items")
def create_item(item: Item):          # 自动解析请求体JSON
    return {"received": item.name, "price": item.price}
```

用 requests 调用：

```python
import requests
resp = requests.post("http://127.0.0.1:8000/items",
                     json={"name": "键盘", "price": 299})
print(resp.json())  # {'received': '键盘', 'price': 299.0}
```

## 11.4 做个真正的AI接口

```python
from fastapi import FastAPI
import requests

app = FastAPI()

DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

@app.post("/chat")
def chat(msg: str):
    resp = requests.post(
        DEEPSEEK_URL,
        json={
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": msg}],
        },
        headers={"Authorization": "Bearer sk-你的key"},
        timeout=30,
    )
    return {"reply": resp.json()["choices"][0]["message"]["content"]}
```

## 11.5 自动文档

FastAPI 自带交互式文档，启动后访问：
- `http://127.0.0.1:8000/docs` — Swagger UI，可以网页上直接测试接口
- `http://127.0.0.1:8000/redoc` — 另一种文档

## 小结

- `@app.get("/path")` 定义GET接口
- 路径参数 `{id}` + 类型注解自动校验
- 查询参数 `q: str = ""`
- POST 用 Pydantic 模型接收JSON
- 自动文档 `/docs`

去练习页试试吧。
