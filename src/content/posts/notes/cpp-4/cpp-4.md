---
title: "C++ Primer Fifth Edition notes(4)"
published: 2026-09-28T21:18:00+08:00
description: "Study notes of C++"
image: "https://raw.githubusercontent.com/Lreb2006/charlore-images/main/images/20260928211749334.png"
tags: ["study", "c++", "notes"]
category: "Notes"
lang: "zh-CN"
draft: false
pinned: false
comment: true
slug: "c++-primer-fifth-edition-notes-4"
series: "C++笔记"
seriesOrder: 4
---

## 2.4 const

### 1 `const`限定符的初始化

1. **初始化后不能再赋值**

> 例如：
>
> ```cpp
> const int bufSize = 512;
> int const bufSize = 512;	// 等价写法
> bufSize = 512;  // 错误
> ```

2. **定义时必须初始化**

> 例如：
>
> ```cpp
> const int i = get_size();  // 可以，运行时取得初始值
> const int j = 42;          // 可以
> const int k;               // 错误，缺少初始值
> ```

### 2 如何用 `const` 修饰对象？

**顶层** `const`：限制对象本身。

**底层** `const`：限制通过指针或引用访问的对象。

1. **修饰指针**

> 例如：
>
> ```cpp
> int x = 1, y = 2;
>
> const int* p1 = &x;       // 指向常量的指针：不能通过 p1 改 x，但 p1 可指向别处
> int const* p2 = &x;       // 同上，等价
>
> int* const p3 = &x;       // 常量指针：p3 不能指向别处，但可以通过 p3 改 x
> const int* const p4 = &x; // 既不能改所指对象，也不能改指针本身
>
> // *p1 = 3;   // 错误
> p1 = &y;      // 正确
>
> *p3 = 3;      // 正确
> // p3 = &y;   // 错误
> ```
>
> `const int* p`：**指向常量的指针**，底层`const`，`p`可变，`*p`不可变；
>
> `int* const p`：**常量指针**，顶层`const`，`p`不可变，`*p`可变；
>
> `const int* const p`：都不可变。

2. **修饰引用**

> 例如：
>
> ```cpp
> int x = 1;
> const int& r = x;
> // r = 2;          // 错误
>
> const int& r2 = 42; // 可以绑定临时量，生命周期被延长
>
> void print(const std::string& s); // 函数参数
> ```

### 3 `constexpr`与`const`的区别是什么？

**定义**：`constexpr` 是一个关键字，用它声明变量，就是要求这个变量在编译时确定初始值(常量表达式)，并且以后不能修改。

这里的**常量表达式**，就是值不会改变，而且编译时就能算出的表达式。

> 例如：
>
> ```cpp
> constexpr int max_files = 20;         // 合法，编译时知道是 20
> constexpr int limit = max_files + 1;  // 合法，编译时能算出 21
>
> int x;
> std::cin >> x; 
> constexpr int sz = x * 2;    // 错误，运行时才知道结果
> const int sz = x * 2;		 // 合法
> ```

| 声明方式 | 初始化后能否修改 | 初始值是否必须在编译时确定 |
| --- | --- | --- |
| `int` | 可以 | 不必 |
| `const int` | 不可以 | 不必 |
| `constexpr int` | 不可以 | 必须 |

`const` 只保证只读，不保证编译期；`constexpr` 保证可用于编译期常量表达式。

**在指针的声明中**：

| 声明 | 指针能否改指向 | 能否通过指针修改所指对象 |
| --- | --- | --- |
| `const int *p` | 可以 | 不可以 |
| `constexpr int *q` | 不可以 | 类型允许，但必须先指向有效对象 |

> 例如：
>
> ```cpp
> constexpr int i = 42;
> int j = 0;
>
> constexpr const int *p = &i;
> constexpr int *p1 = &j;
>
> p1 = nullptr;  // 错误，修改的是指针保存的地址
> *p1 = 10;      // 合法，修改的是 j 的值
> ```
>
> `constexpr` 让**指针自身**成为常量，不会自动给所指对象加上 `const`。
>
> `p1` 的地址必须在编译时确定，但 `j` 的值仍然可以改变。

## 2.5 处理类型

### 1 什么是类型别名？

**定义**：类型别名给已有类型起一个新名字，不会创建新类型，只是让代码更可读、更好维护。

**基本语法**：

```cpp
// C 风格，C++ 也支持
typedef 原类型 别名;

// C++11 起推荐
using 别名 = 原类型;
```

1. **用** **`typedef`** **定义别名**

> 例如：
>
> ```cpp
> typedef double wages;
> typedef wages base, *p;
> ```
>
> 第一行使 `wages` 成为 `double` 的别名。
>
> 第二行中的 `base` 也是 `double` 的别名，`p` 则是 `double*` 的别名。

2. **用** **`using`** **定义别名**

> 例如：
>
> ```cpp
> using SI = Sales_item;
> SI item;	// 一个 Sales_item 变量
> ```

3. **`const`** **修饰指针别名时**

> 例如：
>
> ```cpp
> typedef char *pstring;
>
> const pstring cstr = 0;	// 等同于 char* const cstr = 0
> const pstring *ps;		// 等同于 char* const* ps;
>
> const char *cstr = 0;	// 等同于 const char* cstr = 0
> ```
>
> `pstring` 代表的类型是 **`char*`**，所以`const pstring` 是带有顶层 `const` 的指针类型。

### 2 `auto` 类型说明符

**定义**：`auto` 让编译器根据初始化式推导变量类型，变量必须初始化。

1. **处理指针**

> 例如：
>
> ```cpp
> const int ci = i, &cr = ci;
>
> auto b = ci;   // int
> auto c = cr;   // int
> auto d = &i;   // int*
> auto e = &ci;  // const int*
> ```
>
> `e` 可以改指向，但不能通过 `e` 修改它指向的 `const int`类型的变量。
>
> 如果希望新变量本身也是常量：`const auto f = ci;`

2. **处理引用**

> 例如：在 `auto` 后写 `&`，定义的就是引用。
>
> ```cpp
> auto &g = ci;        // g 是 const int&
> auto &h = 42;        // 错误：普通引用不能绑定到字面值
> const auto &j = 42;  // 正确：常量引用可以绑定到字面值
> ```

### 3 什么是值类别？

**定义**：值类别是 C++ 用来描述一个**表达式**是否代表一个具有明确**身份**的对象，以及它的资源是否可以被**移动**。

| 值类别 | 有身份？ | 可移动？ | 含义 |
| --- | --- | --- | --- |
| lvalue 左值 | 有 | 否 | 有名字、有固定位置的对象 |
| xvalue 亡值 | 有 | 是 | 有身份，但即将被移动/销毁 |
| prvalue 纯右值 | 无 | 是 | 临时计算结果，没有持久身份 |

组合成：

```txt
                 expression
                /          \
           glvalue         rvalue
          /       \       /      \
      lvalue     xvalue  xvalue   prvalue
```

> 例如：
>
> ```cpp
> int x = 1;
> int* p = &x;
> int& lr = x;
>
> // 左值
> x;          // lvalue
> * p;        // lvalue
> lr;         // lvalue
> ++x;        // lvalue
>
> // 亡值
> std::move(x);            // xvalue
> static_cast<int&&>(x);   // xvalue
>
> // 纯右值
> 42;         // prvalue
> x + 1;      // prvalue
> x++;        // prvalue
> &x;         // prvalue
> ```

### 4 `decltype` 类型说明符

**定义**：`decltype` 是 C++11 引入的类型说明符，作用是在编译期推导一个**表达式**的精确类型，但不会真正求值这个表达式。

**基本语法**：

```cpp
decltype(表达式)
decltype(auto)   // C++14
```

如果表达式是 **左值 lvalue**，`decltype(e)` 得到 `T&`

如果表达式是 **亡值 xvalue**，`decltype(e)` 得到 `T&&`

如果表达式是 **纯右值 prvalue**，`decltype(e)` 得到 `T`

> 例如：
>
> ```cpp
> int x = 0;
> const int cx = 1;
> int& rx = x;
>
> decltype(x) a;          // int
> decltype(cx) b = 2;     // const int
> decltype(rx) c = x;     // int&，必须初始化
>
> decltype((x)) d = x;    // int&，注意多了一层括号
>
> decltype(x + 1) e = 3;  // int，x+1 是纯右值
>
> decltype(++x) f = x;    // int&，前置 ++ 返回左值
> decltype(x++) g = 4;    // int，后置 ++ 返回纯右值
> ```
>
> 因为 `x` 是未加括号的变量名，得到声明类型 `int`；而 `(x)` 是一个左值表达式，所以得到 `int&`。
>
> 例如：声明变量类型
>
> ```cpp
> int a = 1;
> double b = 2.0;
>
> decltype(a + b) c = 3.0; // c 是 double
> ```
>
> 例如：`decltype(auto)`
>
> ```cpp
> int x = 0;
>
> decltype(auto) r = (x); // int&
> decltype(auto) v = x;   // int
> ```
>
> `decltype(auto)` 会按 `decltype` 的规则推导返回类型，能保留引用和 `const`。
>
> 例如：不求值获取表达式类型
>
> ```cpp
> int func();
>
> decltype(func()) x; // x 是 int，但不会调用 func()
> ```

与`auto`的不同：

| 特性 | `auto` | `decltype` |
| --- | --- | --- |
| 推导规则 | 类似模板参数推导 | 精确保留类型和值类别 |
| 顶层`const` | 通常忽略 | 保留 |
| 引用 | 通常忽略 | 保留 |
| 是否需要初始化 | 变量必须初始化 | 变量可默认初始化，若类型允许 |
| 典型例子 | `auto a = rx;`得到`int` | `decltype(rx) b = x;`得到`int&` |

## 2.6 自定义数据结构

### 1 如何定义类和数据成员？

**定义**：在 C++ 中，类用 `class` 或 `struct` 定义，数据成员就是写在类里面的变量。

**基本语法**：

```cpp
class 类名 {
访问修饰符:
    数据类型 成员名;
    成员函数；
}; // 注意最后有分号
```

> 例如：定义`Sales_data`类
>
> ```cpp
> #include <string>
>
> struct Sales_data {
>     std::string bookNo;
>     unsigned units_sold = 0;
>     double revenue = 0.0;
> };
> ```
>
> `struct` 后面是类名 `Sales_data`。花括号内是**类体**。其中的三个变量称为**数据成员**，它们决定每个 `Sales_data` 对象包含哪些数据。

或使用`class`来定义：

> 例如：
>
> ```cpp
> #include <iostream>
> #include <string>
>
> class Student {
> private:              // 私有数据成员，类外不能直接访问
>     int id_;
>     std::string name_;
>     double score_;
>
> public:               // 公有成员函数，类外可以调用
>     Student(int id, std::string name, double score)
>         : id_(id), name_(std::move(name)), score_(score) {}
>
>     void print() const {
>         std::cout << id_ << " " << name_ << " " << score_ << std::endl;
>     }
> };
> ```
>
> 访问控制：
>
> - `public`：类外可访问
>
> - `private`：只有类内和友元可访问
>
> - `protected`：类内和派生类可访问
>
> `class` 默认访问权限是 `private`，`struct` 默认是 `public`。
>
> ```cpp
> class A {
>     int x;   // 默认 private
> };
>
> struct B {
>     int y;   // 默认 public
> };
> ```

### 2 如何使用类和数据成员？

#### **创建对象**

> 例如：
>
> ```cpp
> Sales_data accum, trans;
> ```
>
> `accum` 和 `trans` 各有自己的 `bookNo`、`units_sold` 和 `revenue`。修改一个对象的成员，不会改变另一个对象对应的成员。
>
> ```cpp
> Sales_data *salesptr;
> ```
>
> 这行只定义了一个指针，没有创建新的 `Sales_data` 对象。此时 `salesptr` 还没有初始化，不能用它访问对象。
>
> ```cpp
> Student s1(1, "Tom", 90.5);	 // 栈上创建对象，自动调用构造函数
>
> Student* s2 = new Student(2, "Jerry", 88.0); 	// 堆上创建对象
>
> Student arr[2] = {
>         Student(3, "Alice", 80.0),
>         Student(4, "Bob", 85.0)
>     }; 		// 对象数组
> ```
>
> 创建并初始化对象。

#### **访问成员**

1. **访问普通成员**：`对象.成员`

> 例如：
>
> ```cpp
> struct Point {
>     int x;
>     int y;
> };
>
> int main() {
>     Point p;
>     p.x = 10;
>     p.y = 20;
>     std::cout << p.x << "," << p.y << "\n";
> }
> ```
>
> `struct` 默认成员是 `public`，所以可以直接赋值。

2. **访问指针成员**：`指针->成员`

> 例如：
>
> ```cpp
> s2->print();                // 指针用 ->
> s2->setScore(91.0);
> delete s2;                  // 手动释放
> ```

3. **访问私有成员**：`对象.公有函数()`

> 例如：
>
> ```cpp
> s1.setScore(95.0);
> std::cout << "新成绩: " << s1.getScore() << "\n";
> ```

4. **访问静态成员**：`类名::静态成员`

**定义**：静态成员是用 `static` 关键字修饰的类成员，它不属于某个具体的对象，而属于**整个类**。也就是说，不管创建了多少个对象，静态成员只有一份，所有对象共享它。

静态成员包括：**静态数据成员**、**静态成员函数**。

> 例如：访问静态数据成员
>
> ```cpp
> #include <iostream>
>
> class Counter {
> public:
>     static int count;   // 类内声明
>
>     Counter()  { ++count; }
>     ~Counter() { --count; }
> };
>
> int Counter::count = 0; // 类外定义并初始化
>
> int main() {
>     Counter a, b;
>     std::cout << Counter::count << "\n"; // 2
>     return 0;
> }
> ```
>
> 这里 `count` 被所有 `Counter` 对象共享。创建两个对象后，`count` 变成 2。
>
> ```cpp
> class Counter {
> public:
>     inline static int count = 0; // C++17
> };
> ```

> 例如：访问静态成员函数
>
> ```cpp
> class Counter {
> public:
>     static int count;
>
>     Counter() { ++count; }
>
>     static int getCount() {   // 静态成员函数
>         return count;
>     }
> };
>
> int Counter::count = 0;
>
> int main() {
>     Counter a, b;
>     std::cout << Counter::getCount() << "\n"; // 2
> }
> ```
>
> 静态成员函数没有 `this`，可以通过类名直接调用。

#### **调用成员函数**

1. **通过对象调用**：`对象.成员函数()`

> 例如：
>
> ```cpp
> Student s1(1, "Tom", 90.5);
> s1.print();	 // 调用成员函数
> ```

2. **通过指针调用**：`指针->成员函数()`

> 例如：
>
> ```cpp
> Student* s2 = new Student(2, "Jerry", 88.0);
> s2->print();	// 指针用 ->
> ```

### 3 如何编写自己的头文件？

**定义**：头文件本质是一种数据结构的接口声明，类通常定义在头文件中。

头文件`.h`的**基本写法**：

```cpp
#ifndef MY_MATH_H
#define MY_MATH_H

// 头文件内容

#endif
```

上述三行为**头文件保护符**的写法，或用`#pragma once`，用来防止同一个源文件多次包含这个头文件，上述是更标准可移植的写法。

> 例如：`Sales_data.h`
>
> ```cpp
> #ifndef SALES_DATA_H
> #define SALES_DATA_H
>
> #include <string>
>
> struct Sales_data {
>     std::string bookNo;
>     unsigned units_sold = 0;
>     double revenue = 0.0;
> };
>
> #endif
> ```

### 4 为什么需要头文件保护符？

**定义**：头文件保护符是用来防止**同一个头文件在同一个翻译单元中被多次包含**的一组预处理指令。

> 例如：一个头文件可能被多次包含。
>
> ```cpp
> #include <string>
> #include "Sales_data.h"
> ```
>
> 而 `Sales_data.h` 自己又包含 `<string>`。
>
> 其他头文件也可能间接包含 `Sales_data.h`。如果类定义被重复放入同一个源文件，编译器会看到多个相同的类定义并报错。
