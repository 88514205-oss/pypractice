# 第4章 函数：把代码打包成饺子

> 重复的代码写一遍就够了。函数就是"打包好的代码块"，传参数进去，返回结果出来。

## 4.1 定义和调用函数

```python
def greet(name):
    return f"你好，{name}！"

print(greet("白糖"))   # 你好，白糖！
print(greet("红糖"))   # 你好，红糖！
```

结构拆解：

```python
def 函数名(参数):
    函数体
    return 返回值
```

- `def` 定义函数
- 参数可以有多个，也可以没有
- `return` 返回值，**没有 return 的函数返回 None**

## 4.2 参数类型

```python
# 默认参数（有默认值，可以不传）
def greet(name="游客"):
    return f"你好，{name}！"

print(greet())          # 你好，游客！
print(greet("白糖"))     # 你好，白糖！

# 多个参数
def add(a, b):
    return a + b

print(add(3, 5))        # 8

# 关键字参数（调用时指名道姓）
def info(name, age):
    print(f"{name}今年{age}岁")

info(age=16, name="白糖")  # 白糖今年16岁（顺序无所谓）
```

## 4.3 返回值

```python
def calc(a, b):
    return a + b, a - b  # 可以返回多个值（其实是元组）

sum_, diff = calc(10, 3)
print(sum_, diff)   # 13 7
```

## 4.4 局部变量和全局变量

```python
total = 100  # 全局变量

def change():
    total = 200  # 局部变量，和全局的不是同一个
    print("函数内:", total)

change()           # 函数内: 200
print("函数外:", total)  # 函数外: 100（全局的没变）
```

想改全局变量要用 `global` 关键字（但**不推荐**多用，容易出bug）：

```python
total = 100

def change():
    global total
    total = 200

change()
print(total)  # 200
```

## 4.5 内置函数们

Python 自带很多有用的函数：

```python
print()        # 打印
len()          # 长度
type()         # 类型
int()          # 转整数
str()          # 转字符串
float()        # 转浮点数
max(1, 5, 3)   # 最大值 5
min(1, 5, 3)   # 最小值 1
sum([1, 2, 3]) # 求和 6
abs(-5)        # 绝对值 5
round(3.14159, 2)  # 四舍五入保留2位 3.14
```

## 4.6 lambda 匿名函数（进阶彩蛋）

一句话定义的函数：

```python
add = lambda a, b: a + b
print(add(3, 4))  # 7

# 配合 sorted 按规则排序
people = [("白糖", 16), ("红糖", 14), ("主人", 17)]
people.sort(key=lambda p: p[1])  # 按年龄排序
print(people)  # [('红糖', 14), ('白糖', 16), ('主人', 17)]
```

## 小结

- `def` 定义函数，`return` 返回值
- 参数：默认参数、多参数、关键字参数
- 局部变量和全局变量要分清
- 常用内置函数直接用
- lambda 是一行版小函数

去练习页试试吧。
