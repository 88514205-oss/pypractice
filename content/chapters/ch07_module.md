# 第7章 标准库：Python自带的军火库

> Python 自带大量模块，想用啥直接 import。这一章认识最常用的几个。

## 7.1 random —— 随机数

```python
import random

print(random.randint(1, 100))   # 1~100 随机整数
print(random.random())          # 0~1 随机小数
print(random.choice(["石头", "剪刀", "布"]))  # 随机选一个
print(random.shuffle([1,2,3,4]))  # 打乱列表

cards = [1, 2, 3, 4]
random.shuffle(cards)
print(cards)  # 顺序被打乱
```

## 7.2 time —— 时间

```python
import time

print(time.time())          # 当前时间戳（秒）
time.sleep(2)               # 暂停2秒
print(time.time())          # 2秒后
```

## 7.3 os —— 操作系统交互

```python
import os

print(os.getcwd())          # 当前目录
os.mkdir("new_folder")      # 创建目录
os.listdir(".")             # 列出当前目录文件
os.path.exists("test.txt")  # 判断文件是否存在
os.path.join("a", "b")      # 拼接路径
```

## 7.4 sys —— 系统参数

```python
import sys

print(sys.argv)       # 命令行参数列表
print(sys.version)    # Python版本
```

## 7.5 json —— 数据交换（重要！）

```python
import json

# 字典 → JSON字符串
data = {"name": "白糖", "skills": ["Python", "Docker"]}
json_str = json.dumps(data, ensure_ascii=False)
print(json_str)

# JSON字符串 → 字典
back = json.loads(json_str)
print(back["name"])   # 白糖
```

以后调 API、前后端通信、配置文件，全是 JSON 的活。

## 7.6 requests —— 请求网络（需要安装）

```python
# pip install requests
import requests

resp = requests.get("https://api.example.com/data")
print(resp.status_code)    # 200
print(resp.json())         # 解析JSON响应

resp = requests.post(
    "https://api.example.com/submit",
    json={"name": "白糖"},
    headers={"Authorization": "Bearer xxx"},
    timeout=10,
)
```

requests 是**第三方库**，需要 `pip install requests` 安装。

## 7.7 自己写模块

把代码存成 .py 文件，就能 import：

```python
# my_tools.py
def double(x):
    return x * 2

# 另一个文件
import my_tools
print(my_tools.double(5))  # 10
```

## 小结

- `random` 随机、`time` 时间、`os` 系统、`sys` 参数
- `json` 数据交换，Web世界通用语言
- `requests` 网络请求（第三方）
- 自己写的 .py 也能当模块 import

去练习页试试吧。
