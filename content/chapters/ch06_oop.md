# 第6章 面向对象：万物皆可盘

> 面向对象（OOP）是把数据和操作数据的方法打包在一起。这一章学会用类(class)创建自己的数据类型。

## 6.1 类和对象

```python
class Cat:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def meow(self):
        print(f"{self.name}: 喵~")

    def info(self):
        print(f"{self.name}今年{self.age}岁")

# 创建对象
white = Cat("白糖", 16)
white.meow()      # 白糖: 喵~
white.info()      # 白糖今年16岁
```

要点：

- `class` 定义类，类名大写开头
- `__init__` 是**构造函数**，创建对象时自动调用
- `self` 代表对象自己，方法里第一个参数永远是 self
- 用 `对象.方法()` 调用方法

## 6.2 属性和方法

```python
class Student:
    school = "喵喵中学"  # 类属性（所有对象共享）

    def __init__(self, name, score):
        self.name = name     # 实例属性（每个对象自己的）
        self.score = score

    def pass_or_fail(self):
        return "及格" if self.score >= 60 else "不及格"

s1 = Student("白糖", 95)
s2 = Student("红糖", 40)

print(s1.school)      # 喵喵中学
print(s1.pass_or_fail())  # 及格
print(s2.pass_or_fail())  # 不及格
```

## 6.3 继承 —— 子类复用父类

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        print("...")

class Dog(Animal):
    def speak(self):        # 覆盖父类方法
        print(f"{self.name}: 汪！")

class Cat(Animal):
    def speak(self):
        print(f"{self.name}: 喵~")

d = Dog("旺财")
c = Cat("白糖")
d.speak()   # 旺财: 汪！
c.speak()   # 白糖: 喵~
```

子类自动拥有父类的方法和属性，也可以**重写**父类方法。

## 6.4 常用魔法方法

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):        # print对象时调用
        return f"Point({self.x}, {self.y})"

    def __add__(self, other): # 支持 + 运算
        return Point(self.x + other.x, self.y + other.y)

    def __eq__(self, other):  # 支持 == 比较
        return self.x == other.x and self.y == other.y

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1)            # Point(1, 2)（靠__str__）
print(p1 + p2)       # Point(4, 6)（靠__add__）
print(p1 == Point(1, 2))  # True（靠__eq__）
```

## 6.5 什么时候用类？

**不是所有代码都要用类。** 简单脚本用函数就行。以下情况适合用类：

- 需要保存状态（比如游戏角色有血量、等级）
- 多个相关的数据和操作要打包
- 需要创建多个相似对象

## 小结

- `class` 定义类，`__init__` 构造
- `self` 代表对象自己
- 继承让子类复用父类
- 魔法方法让对象支持 `+`、`==`、`print`

去练习页试试吧。
