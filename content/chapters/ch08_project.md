# 第8章 实战：终于能做点正经东西了

> 前几章学的都是零件，这一章把它们拼成能用的东西。四个项目由易到难，都是真实能跑的。

## 项目1：猜数字游戏

```python
import random

secret = random.randint(1, 100)
tries = 0

print("我心里想了一个 1~100 的数字，猜猜看！")

while True:
    try:
        guess = int(input("你的猜测: "))
    except ValueError:
        print("请输入数字！")
        continue

    tries += 1
    if guess < secret:
        print("太小了")
    elif guess > secret:
        print("太大了")
    else:
        print(f"恭喜！你猜了 {tries} 次就猜中了")
        break
```

知识点：random、while、try/except、input、if

## 项目2：通讯录管理

```python
contacts = {}

def show_menu():
    print("\n1. 添加联系人  2. 查找  3. 删除  4. 列出全部  5. 退出")

def add():
    name = input("姓名: ")
    phone = input("电话: ")
    contacts[name] = phone
    print(f"已添加 {name}")

def find():
    name = input("要查找的姓名: ")
    print(contacts.get(name, "没找到这个人"))

def delete():
    name = input("要删除的姓名: ")
    if contacts.pop(name, None):
        print(f"已删除 {name}")
    else:
        print("没这个人")

def list_all():
    for name, phone in contacts.items():
        print(f"{name}: {phone}")

while True:
    show_menu()
    choice = input("选择: ")
    if choice == "1":
        add()
    elif choice == "2":
        find()
    elif choice == "3":
        delete()
    elif choice == "4":
        list_all()
    elif choice == "5":
        break
    else:
        print("无效选项")
```

知识点：字典、函数、while、input

## 项目3：简易记账本（带文件保存）

```python
import json
import os

DATA_FILE = "records.json"

def load_records():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_records(records):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

def add_record(records):
    item = input("项目: ")
    amount = float(input("金额: "))
    records.append({"item": item, "amount": amount})
    save_records(records)
    print("已记录")

def show_summary(records):
    total = sum(r["amount"] for r in records)
    for r in records:
        print(f"{r['item']}: {r['amount']}")
    print(f"总计: {total}")

records = load_records()
add_record(records)
show_summary(records)
```

知识点：json、os、文件读写、列表推导

## 项目4：简易待办清单

```python
todos = []

def add_task():
    todos.append({"text": input("任务: "), "done": False})

def show_tasks():
    for i, t in enumerate(todos, 1):
        status = "✅" if t["done"] else "⬜"
        print(f"{i}. {status} {t['text']}")

def done_task():
    show_tasks()
    idx = int(input("完成哪个? ")) - 1
    if 0 <= idx < len(todos):
        todos[idx]["done"] = True

while True:
    action = input("(a)添加 (s)显示 (d)完成 (q)退出: ")
    if action == "a":
        add_task()
    elif action == "s":
        show_tasks()
    elif action == "d":
        done_task()
    elif action == "q":
        break
```

知识点：列表嵌套字典、enumerate、索引

## 小结

这4个项目覆盖了前面所有章节的知识点。建议：**每个项目亲手敲一遍**，然后试着加功能——比如给猜数字加难度选择、给通讯录加文件保存。

去练习页试试吧。
