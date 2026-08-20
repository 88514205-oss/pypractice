# 第10章 数据库：记性不好就要用笔记

> 程序重启后数据就没了？把数据存进数据库，断电都不怕。这一章学会 SQLite——Python 自带的轻量数据库。

## 10.1 为什么要用数据库

```
JSON/文件:  简单，但数据多了查询慢、容易乱
数据库:     结构化、查询快、支持复杂操作
SQLite:     Python 内置，零配置，单文件，适合本地应用
```

## 10.2 连接和建表

```python
import sqlite3

# 连接（文件不存在会自动创建）
conn = sqlite3.connect("app.db")
cur = conn.cursor()

# 建表：users 表，id 自增，name 文本，age 整数
cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER
    )
""")
conn.commit()
```

## 10.3 增删改查（CRUD）

```python
# 插入
cur.execute("INSERT INTO users (name, age) VALUES (?, ?)", ("白糖", 16))
conn.commit()

# 批量插入
users = [("红糖", 14), ("主人", 17), ("路人", 20)]
cur.executemany("INSERT INTO users (name, age) VALUES (?, ?)", users)
conn.commit()

# 查询
cur.execute("SELECT * FROM users")
print(cur.fetchall())     # 全部行

cur.execute("SELECT name FROM users WHERE age > 15")
print(cur.fetchall())     # 符合条件的行

# 更新
cur.execute("UPDATE users SET age = 18 WHERE name = ?", ("主人",))
conn.commit()

# 删除
cur.execute("DELETE FROM users WHERE name = ?", ("路人",))
conn.commit()
```

⚠️ **永远用 `?` 占位符传参**，不要用 f-string 拼接 SQL，否则会出 SQL 注入漏洞。

## 10.4 参数化查询（安全）

```python
# ❌ 危险！用户输入直接拼进SQL
# name = input("名字: ")
# cur.execute(f"SELECT * FROM users WHERE name = '{name}'")

# ✅ 安全！用占位符
name = input("名字: ")
cur.execute("SELECT * FROM users WHERE name = ?", (name,))
```

## 10.5 关闭连接

```python
conn.close()  # 用完要关，或直接用 with
```

## 10.6 小例子：简易备忘录

```python
import sqlite3

conn = sqlite3.connect("memo.db")
cur = conn.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS memos (id INTEGER PRIMARY KEY, text TEXT)")

# 添加
cur.execute("INSERT INTO memos (text) VALUES (?)", ("记得喂猫",))
conn.commit()

# 列出
cur.execute("SELECT * FROM memos")
for row in cur.fetchall():
    print(row)

conn.close()
```

## 小结

- SQLite 零配置，`sqlite3.connect("文件.db")` 就行
- 建表用 CREATE TABLE
- 增删改查：INSERT / SELECT / UPDATE / DELETE
- **参数用 `?` 占位符**，防注入
- 记得 `conn.commit()` 和 `conn.close()`

去练习页试试吧。
