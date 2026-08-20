# 第3章 让代码学会看脸色：if、for、while

> 程序要有"判断"和"循环"才有灵魂。这一章学会让代码根据条件走不同分支、重复干活。

## 3.1 if / elif / else —— 条件分支

```python
score = 85

if score >= 90:
    print("优秀")
elif score >= 60:
    print("及格")
else:
    print("不及格")
# 输出：及格
```

要点：

- **if** 后面跟条件，条件为真就执行缩进块
- **elif** = else if，可以多个
- **else** 是兜底，其他情况都不满足时执行
- 缩进（4个空格）表示代码块，**非常重要**

比较运算符：

```python
a == b   # 等于
a != b   # 不等于
a > b    # 大于
a >= b   # 大于等于
a < b    # 小于
a <= b   # 小于等于
a and b  # 并且（两个都真）
a or b   # 或者（一个真就行）
not a    # 取反
```

## 3.2 for 循环 —— 遍历一切

```python
# 遍历列表
for fruit in ["苹果", "香蕉", "橙子"]:
    print(fruit)

# 遍历数字范围 range(5) → 0,1,2,3,4
for i in range(5):
    print(i)

# range(1, 6) → 1,2,3,4,5
for i in range(1, 6):
    print(i)

# range(0, 10, 2) → 0,2,4,6,8（步长2）
for i in range(0, 10, 2):
    print(i)
```

## 3.3 break 和 continue —— 急刹车和跳过

```python
# break：立刻结束整个循环
for i in range(10):
    if i == 3:
        break
    print(i)   # 打印 0,1,2

# continue：跳过本次，继续下一次
for i in range(5):
    if i == 2:
        continue
    print(i)   # 打印 0,1,3,4
```

## 3.4 while 循环 —— 直到条件不满足

```python
count = 0
while count < 3:
    print(f"第{count}次")
    count += 1
# 输出：第0次 第1次 第2次
```

⚠️ while 一定要保证**循环能结束**，否则就是死循环（程序卡死）。

## 3.5 列表推导式 —— 一行生成列表（进阶彩蛋）

```python
# 生成 0~9 的平方
squares = [i * i for i in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 带条件的推导式：只保留偶数
evens = [i for i in range(10) if i % 2 == 0]
print(evens)  # [0, 2, 4, 6, 8]
```

## 小结

- **if/elif/else**：按条件走分支
- **for**：遍历列表、字典、range
- **break**：跳出循环
- **continue**：跳过本次
- **while**：条件循环（小心死循环）

去练习页试试吧。
