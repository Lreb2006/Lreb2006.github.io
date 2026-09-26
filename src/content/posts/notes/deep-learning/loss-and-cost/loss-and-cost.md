---
title: "Deep Learning notes(2)"
published: 2026-09-27
description: "Study notes of Deep Learning: 损失函数、成本函数与Logistic回归训练"
image: "https://raw.githubusercontent.com/Lreb2006/charlore-images/main/images/927-20260927014623-8bd0zqb.png"
tags: ["study", "deep-learning", "notes"]
category: "Notes"
lang: "zh-CN"
draft: false
pinned: false
comment: true
slug: "deep-learning-notes-2"
series: "深度学习笔记"
seriesOrder: 2
---

## 2 损失函数与成本函数

### 2.1 什么是损失函数$L(\hat y,y)$？

**损失函数 Loss Function**：衡量**一个**训练样本预测得有多差。

理想情况下：

- 预测正确时，损失应该小；

- 预测错误时，损失应该大；

- 而且越自信地预测错误，惩罚最好越严重。

> **例如**真实值 $y=1$：$\hat y=0.99$：预测很好；$\hat y=0.7$：还可以；$\hat y=0.001$：不仅错，而且错得非常自信。
> 因此我们希望损失函数能够体现这种差异。

### 2.2 为什么一般不用平方误差？

**原因**： sigmoid 是一个非线性函数，和平方误差组合以后，关于参数 $w,b$ 的优化问题可能成为**非凸优化问题**。

平方差：$L(\hat y,y)=\frac12(\hat y-y)^2$

> **假设**真实标签 $y=1$，模型预测 $\hat y=0.8$，那么损失为 $\frac12(0.8-1)^2=0.02$；如果预测 $\hat y=0.1$，损失为 $\frac12(0.1-1)^2=0.405$。看起来非常合理。

但在Logistic回归中 $\hat y=\sigma(w^Tx+b)$ ，所以平方差实际上变成 $L(w,b)=\frac12\left(\sigma(w^Tx+b)-y\right)^2$。

而非凸函数可能存在**多个局部最小值**，不适合作为标准Logistic回归的目标损失函数。

### 2.3 Logistic回归使用什么损失函数？

$$
L(\hat y,y)
=
-\left[
y\ln\hat y
+
(1-y)\ln(1-\hat y)
\right]
$$

该损失函数通常称为 **Log Loss、Binary Cross-Entropy，二元交叉熵损失。**

1. **当** **$y=1$时**：

$$
L(\hat y,1)=-\ln\hat y
$$

> **假设**真实答案为 $y=1$。
>
> 当 $\hat y=0.9$ 时，$L=-\ln0.9\approx0.105$。
> 当 $\hat y=0.5$ 时，$L=-\ln0.5\approx0.693$。
> 当 $\hat y=0.1$ 时，$L=-\ln0.1\approx2.303$。
> 当 $\hat y=0.001$ 时，$L=-\ln0.001\approx6.908$。
>
> ![image.png](https://raw.githubusercontent.com/Lreb2006/charlore-images/main/images/20260925202806529.png)

2. **当** **$y=0$** **时**：

$$
L(\hat y,0)=-\ln(1-\hat y)
$$

> **假设**真实答案为 $y=0$。
>
> $\hat y=0.1$，则 $L=-\log0.9\approx0.105$。
>  $\hat y=0.5$，则 $L=-\log0.5\approx0.693$。
>  $\hat y=0.9$，则 $L=-\log0.1\approx2.303$。
>  $\hat y=0.999$，则 $L=-\log0.001\approx6.908$。
>
> ![image.png](https://raw.githubusercontent.com/Lreb2006/charlore-images/main/images/20260925203829804.png)

预测越自信地犯错，惩罚越严重。

### 2.4 什么是成本函数$J(w,b)$？？

**成本函数 Cost Function**：衡量**整个**训练集预测得有多差。

把所有样本的损失取平均：

$$
J(w,b)
=
\frac1m
\sum_{i=1}^{m}
L\left(\hat y^{(i)},y^{(i)}\right)
$$

即成本函数衡量参数 $w,b$ 在整个训练集上的总体表现。

### 2.5 Logistic回归训练的计算链

$$
w,b
\rightarrow
z^{(i)}
\rightarrow
\hat y^{(i)}
\rightarrow
L^{(i)}
\rightarrow
J(w,b)
$$

即给定训练数据：

$$
\left\{
(x^{(1)},y^{(1)}),
(x^{(2)},y^{(2)}),
\cdots,
(x^{(m)},y^{(m)})
\right\}
$$

对于每个样本：

$$
z^{(i)}=w^Tx^{(i)}+b
$$

sigmoid函数：

$$
\hat y^{(i)}=\sigma(z^{(i)})
$$

损失函数：

$$
L^{(i)}
=
-\left[
y^{(i)}\log\hat y^{(i)}
+
(1-y^{(i)})\log(1-\hat y^{(i)})
\right]
$$

成本函数：

$$
J(w,b)=\frac1m\sum_{i=1}^{m}L^{(i)}
$$

**目的**：找到一组 $w,b$，让整个训练集上的平均损失 $J(w,b)$ 尽可能小。
