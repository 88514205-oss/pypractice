# 第1章 你好世界，先打声招呼

> Python的第一课：print、变量、注释。学会了就能让电脑替你说话。

## 1.1 print() —— 让程序开口说话

Python 里最简单的操作就是 `print()`，它的作用是把内容打印到屏幕上：

```python
print("你好，Python")
print(3 + 5)
print("结果 =", 10 * 2)
```

运行结果：

```
你好，Python
8
结果 = 20
```

几个要点：

- 文本要用引号包起来（单引号 `'...'` 或双引号 `"..."` 都行）
- 数字不用引号，直接写
- 括号里可以放多个内容，用逗号隔开，打印时会自动用空格分隔

## 1.2 变量 —— 给数据贴个标签

变量就是给数据起的名字，之后可以用名字反复使用：

```python
name = "白糖"
age = 16
height = 1.65

print(name)
print(age)
print(height)
```

变量名的规则：

- 由字母、数字、下划线组成
- **不能以数字开头**（`1name` 是错的，`name1` 可以）
- 不能用 Python 的保留字（`if`、`for`、`while` 这些不行）
- 大小写敏感：`Name` 和 `name` 是两个不同的变量

## 1.3 数据类型 —— 先认识四个基础类型

Python 里常见的基础数据类型：

```python
a = 42          # int 整数
b = 3.14        # float 浮点数（小数）
c = "你好"       # str 字符串（文本）
d = True        # bool 布尔值（True / False）
e = None        # NoneType 空值
```

可以用 `type()` 查看一个数据的类型：

```python
print(type(42))       # <class 'int'>
print(type("你好"))    # <class 'str'>
print(type(True))     # <class 'bool'>
```

## 1.4 注释 —— 给未来的自己留纸条

注释是给人看的，Python 会直接忽略它们：

```python
# 这是单行注释，用井号开头

"""
这是多行注释
可以用三个引号
包起来
"""

name = "白糖"  # 行尾也可以加注释
```

写注释是**好习惯**，过两周回头看代码，你会感谢当初写了注释的自己。

## 1.5 字符串拼接 —— 把文字拼起来

字符串可以用 `+` 拼接，也可以用 f-string 格式化：

```python
# 方式一：+ 拼接
greet = "你好" + " " + "Python"
print(greet)

# 方式二：f-string（推荐，Python 3.6+）
name = "白糖"
print(f"你好，{name}，欢迎来到Python世界")
```

> ⚠️ 字符串不能直接和数字相加：`"结果" + 3` 会报错。要先转成字符串：`"结果" + str(3)`

## 小结

这一章你学会了：

- `print()` 打印内容
- 变量的定义和使用
- 四种基础类型：int / float / str / bool
- 注释的写法
- 字符串拼接和 f-string

去练习页试试手吧。
