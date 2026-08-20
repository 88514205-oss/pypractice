# 第5章 文件：把数据存下来别弄丢了

> 程序关了就什么都没了。文件让数据能存到硬盘里，下次打开还在。这一章学会读写文件、处理异常。

## 5.1 读文件

```python
# 最常用方式：with 自动关闭文件
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()        # 全部读成字符串
print(content)

# 逐行读
with open("data.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())   # strip() 去掉换行符
```

## 5.2 写文件

```python
# "w" 覆盖写入（文件不存在会自动创建）
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("第一行\n")
    f.write("第二行\n")

# "a" 追加写入（不清空原内容）
with open("output.txt", "a", encoding="utf-8") as f:
    f.write("第三行\n")
```

模式说明：

- `"r"` 读（默认）
- `"w"` 写（覆盖）
- `"a"` 追加
- `"x"` 新建（已存在则报错）
- `"rb"` / `"wb"` 二进制（图片、压缩包）

## 5.3 JSON 文件 —— 程序间通用的格式

```python
import json

# 写入
data = {"name": "白糖", "age": 16, "hobbies": ["代码", "音乐"]}
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# 读取
with open("data.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
print(loaded["name"])  # 白糖
```

JSON 是 Web 世界通用的数据格式，后面调 API 会天天用它。

## 5.4 异常处理 —— 让程序摔倒了能爬起来

```python
try:
    num = int(input("输入数字: "))
    print(100 / num)
except ValueError:
    print("那不是数字！")
except ZeroDivisionError:
    print("不能除以0！")
except Exception as e:
    print(f"出了其他问题: {e}")
else:
    print("一切正常，没有异常")
finally:
    print("无论如何都会执行")
```

要点：

- `try`：放可能出错的代码
- `except`：捕获指定异常，可以有多个
- `else`：没异常时执行
- `finally`：无论有没有异常都执行

## 5.5 常见异常类型

```python
ValueError           # 值不对（int("abc")）
TypeError            # 类型不对（"a" + 1）
KeyError             # 字典键不存在
IndexError           # 下标越界
ZeroDivisionError    # 除以0
FileNotFoundError    # 文件不存在
```

## 小结

- `with open(...)` 读写文件，记得指定 `encoding="utf-8"`
- JSON 用 `json.dump` / `json.load` 读写
- `try/except` 捕获异常，程序不崩溃

去练习页试试吧。
