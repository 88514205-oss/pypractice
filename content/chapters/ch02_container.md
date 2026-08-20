# 第2章 装东西的艺术：列表、字典与字符串

> 程序里到处都要"存数据"。这一章学会用容器把数据装起来、拿出来、改一改。

## 2.1 列表 list —— 一串有序的抽屉

列表用方括号 `[]`，里面的东西叫**元素**，用逗号隔开：

```python
fruits = ["苹果", "香蕉", "橙子"]
print(fruits)          # ['苹果', '香蕉', '橙子']
print(fruits[0])       # 苹果（下标从0开始！）
print(fruits[-1])      # 橙子（-1是最后一个）
```

常用操作：

```python
fruits = ["苹果", "香蕉"]

fruits.append("橙子")   # 末尾添加
fruits.insert(0, "梨")  # 指定位置插入
fruits.remove("香蕉")   # 删除指定元素
fruits.pop()           # 删除并返回最后一个
fruits[0] = "西瓜"      # 修改元素
print(len(fruits))     # 长度：2
```

## 2.2 字典 dict —— 带标签的储物柜

字典用花括号 `{}`，存的是**键值对**（key: value）：

```python
person = {
    "name": "白糖",
    "age": 16,
    "hobby": "写代码"
}

print(person["name"])    # 白糖
person["age"] = 17       # 修改
person["city"] = "上海"   # 新增
del person["hobby"]      # 删除
print("name" in person)  # True（判断键是否存在）
```

字典是无序的（Python 3.7+ 实际保持插入顺序），**按键访问**，不能用下标。

## 2.3 元组 tuple —— 不能改的列表

元组用圆括号 `()`，**创建后不能修改**：

```python
point = (3, 5)
print(point[0])     # 3
# point[0] = 99    # ❌ 报错！元组不可修改

a, b = point        # 解包：a=3, b=5
```

什么时候用元组？——数据不该被意外修改时，比如坐标、RGB颜色、日期。

## 2.4 集合 set —— 自动去重的袋子

集合用花括号 `{}` 或 `set()`，**自动去重、无序**：

```python
nums = {1, 2, 2, 3, 3, 3}
print(nums)          # {1, 2, 3}（重复的被去掉了）

nums.add(4)          # 添加
nums.discard(1)      # 删除（不存在也不报错）

a = {1, 2, 3}
b = {2, 3, 4}
print(a & b)         # 交集 {2, 3}
print(a | b)         # 并集 {1, 2, 3, 4}
```

## 2.5 字符串的常用方法

字符串也是"容器"（字符的序列）：

```python
s = "Hello, Python"

s.upper()            # "HELLO, PYTHON"
s.lower()            # "hello, python"
s.split(",")         # ['Hello', ' Python'] 按逗号切分
s.replace("Python", "World")  # "Hello, World"
s.strip()            # 去掉首尾空白
s.startswith("Hello")  # True
len(s)               # 13（长度）
s[0:5]               # "Hello"（切片：前闭后开）
```

## 2.6 遍历容器 —— for 循环初体验

```python
fruits = ["苹果", "香蕉", "橙子"]
for fruit in fruits:
    print(fruit)

person = {"name": "白糖", "age": 16}
for key, value in person.items():
    print(f"{key} = {value}")
```

for 循环会在下一章详细讲，这里先感受一下。

## 小结

- **列表** `[]`：有序、可改，最常用
- **字典** `{}`：键值对，按名字查数据
- **元组** `()`：不可改，保护数据
- **集合** `{}`：自动去重
- **字符串**：字符序列，有很多方法

去练习页试试吧。
