---
title: "Deep Learning notes(3)"
published: 2026-09-27T08:05:00+08:00
description: "Study notes of Deep Learning: 梯度下降、学习率与参数更新"
image: "https://raw.githubusercontent.com/Lreb2006/charlore-images/main/images/20260927014729478.png"
tags: ["study", "deep-learning", "notes"]
category: "Notes"
lang: "zh-CN"
draft: false
pinned: false
comment: true
slug: "deep-learning-notes-3"
series: "深度学习笔记"
seriesOrder: 3
---

## 3 梯度下降 Gradient Descent

### 3.1 什么是梯度下降？

**定义**： 梯度下降（Gradient Descent）是一种最常用的优化算法，目标是通过不断调整模型参数（权重 $w$ 和偏置 $b$），让损失函数 $L$ 尽可能小，从而使模型预测更准确。

对于 Logistic 回归，我们的目标是找到一组 $w,b$，使成本函数 $J(w,b)$ 尽可能小。

可以把 $J(w,b)$ 想象成一个地形表面：

- 横轴是参数 $w$；

- 另一个横轴是参数 $b$；

- 高度是成本 $J(w,b)$。
  我们的任务就是从这个曲面上某个位置出发，一步步往低处走，最后到达最低点。

**公式**：

$$
w:=w-\alpha\frac{\partial J(w,b)}{\partial w}
$$

$$
b:=b-\alpha\frac{\partial J(w,b)}{\partial b}
$$

其中：

$w$：当前参数；

$\alpha$：学习率；

$\frac{\partial J(w,b)}{\partial w}$：当前点处成本函数关于 $w$ 的导数。

$\frac{\partial J(w,b)}{\partial b}$：当前点处成本函数关于 $b$ 的导数。

1. 如果当前位置在最低点**右侧**，通常斜率为**正**，因此 $\frac{dJ}{dw}>0$，更新后 $w$ **变小**，**向左**更新。

2. 如果当前位置在最低点**左侧**，通常斜率为**负**，因此 $\frac{dJ}{dw}<0$，更新后 $w$ **变大**，**向右**更新。

参数 $b$ 方向上同理，所以两边都会**朝最低点移动**。

### 3.2 为什么Logstic回归成本函数是凸函数？

**凸函数**：直观地说，凸函数的图像像碗或U形，任意两点连成的弦都在函数图像的上方，凸函数的局部极小点也是全局极小点。

标准逻辑回归 + sigmoid + 交叉熵损失，其成本函数关于参数 $w,b$ 是凸函数。

实际上深度神经网络通常非凸。

### 3.4 什么是学习率$\alpha$？

**定义**：学习率 α 是深度学习优化中的一个**超参数**，控制梯度下降每次参数更新的步长。

> **假设**当前 $w=5$，并且 $\frac{dJ}{dw}=2$
>
> 如果 $\alpha=0.1$，那么 $w:=5-0.1\times2=4.8$，一次只从 $5$ 更新到 $4.8$。
>
> 如果 $\alpha=1$，那么 $w:=5-1\times2=3$，

### 3.5 $dw$ 和 $db$

**规定**：$dw\equiv\frac{\partial J}{\partial w}$ 以及 $db\equiv\frac{\partial J}{\partial b}$。

实际 Logistic 回归中：

$$
w=
\begin{bmatrix}
w_1\\
w_2\\
\vdots\\
w_{n_x}
\end{bmatrix}
$$

关于 $w$ 的导数实际上包含了每个参数对应的导数，可以把它们组合成：

$$
dw=
\begin{bmatrix}
\frac{\partial J}{\partial w_1}\\
\frac{\partial J}{\partial w_2}\\
\vdots\\
\frac{\partial J}{\partial w_{n_x}}
\end{bmatrix}
$$

然后整体更新。
