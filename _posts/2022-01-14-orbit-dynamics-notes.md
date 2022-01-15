---
layout: post
title: 轨道动力学学习笔记
pagetype: post
author: Cosmo
date: 2022-01-14 23:03:00
---

最近在玩[kOS](https://ksp-kos.github.io/KOS/index.html)，为了鼓捣出自动化的任务代码，开始学习一些浅显的轨道动力学。

# Textbook

[Rocket and Space Technology](http://www.braeunig.us/space/orbmech.htm)

# 基本的数学约定

## 坐标系和坐标系变换

我们使用**右手笛卡尔坐标系**，即右手大拇指指向$X+$、食指指向$Y+$、掌心朝向$Z+$。

我们约定如下的旋转矩阵：$\mathbb{R}_x(\theta)$、$\mathbb{R}_y(\theta)$、$\mathbb{R}_z(\theta)$分别表示向$X$、$Y$、$Z$负方向看去时绕该轴逆时针旋转$\theta$角度的旋转矩阵，于是有：

$$
\mathbb{R}_x(\theta) = \left(
\begin{array}{}
1 & 0 & 0 \\
0 & \cos{\theta} & -\sin{\theta} \\
0 & \sin{\theta} & \cos{\theta} \\
\end{array}
\right)
$$

$$
\mathbb{R}_y(\theta) = \left(
\begin{array}{}
\cos{\theta} & 0 & \sin{\theta} \\
0 & 1 & 0 \\
-\sin{\theta} & 0 & \cos{\theta}
\end{array}
\right)
$$

$$
\mathbb{R}_z(\theta) = \left(
\begin{array}{}
\cos{\theta} & -\sin{\theta} & 0 \\
\sin{\theta} & \cos{\theta} & 0 \\
0 & 0 & 1
\end{array}
\right)
$$

对于**地心赤道坐标系**，我们一般定义为：原点$O$在地心处，$xOy$平面为赤道平面，$X$方向朝春分点，$Z$方向朝北极。

一般，在天球坐标系上，我们假设天球半径为$1$，在地球坐标系上，则假设地球半径为$1$。

# 公式4.33-4.37推导

为了记述方便，我们暂且记$\alpha = \Delta{\lambda}$，$\gamma = \frac{\pi}{2} - \beta$。在这个问题中，我们只关心天球坐标和在天球面上的方向，因此接下来我们所讨论的轨道、赤道等，都是指它们在天球上的投影，也就是说我们所讨论的轨道实际上是天球上的一个大圆。

首先，不妨假设这条轨道的升、降交点分别与秋、春分点重合，这样，轨道平面与赤道平面的交线即升、降交点的连线，就与秋、春分点的连线重合，也就是$X$轴。

接下来，我们将轨道看做轨道由这样一个“初始轨道”变换而来：一条与赤道重合且燃尽点与秋分点$(1,0,0)$重合的大圆轨道。那么有两种变换途径均可达到目的：

第一种途径：先转向$l$，使得升交点到达秋分点，再绕轨道平面与赤道平面的交线即$X$轴旋转$i$，得到轨道倾角。即先绕$Z$轴旋转$l$，再绕$X$轴旋转$i$。变换矩阵为：

$$ \mathbb{R}_x(i) \cdot \mathbb{R}_z(l) =
\left(\begin{array}{lll} 
    \cos{l}               & -\sin{l}              & 0 \\
    \cos{i} \cdot \sin{l} & \cos{i} \cdot \cos{l} & -\sin{i} \\
    \sin{i} \cdot \sin{l} & \sin{i} \cdot \cos{l} & \cos{i}
\end{array}\right)
$$


第二，先绕燃尽点的法线方向旋转出燃尽点的方位角东偏北$\gamma$，注意由于此时燃尽点位于秋分点，因此燃尽点的法线方向即为$(1,0,0)$，然后仰角$\delta$，使燃尽点到达指定纬度，最后再转向$\alpha$，使得升交点到达指定位置，也使燃尽点到达指定经度。即先绕$X$轴旋转$\gamma$，然后绕$Y$轴旋转$-\delta$，最后绕$Z$轴旋转$\alpha$。变换矩阵为：

$$ \mathbb{R}_z(\alpha) \cdot \mathbb{R}_y(-\delta) \cdot \mathbb{R}_x(\gamma) =
\left(\begin{array}{lll} 
      \cos{\alpha} \cdot \cos{\delta}
    & -\cos{\alpha} \cdot \sin{\delta} \cdot \sin{\gamma} - \sin{\alpha} \cdot \cos{\gamma}
    & -\cos{\alpha} \cdot \sin{\delta} \cdot \cos{\gamma} + \sin{\alpha} \cdot \sin{\gamma}
    \\
      \sin{\alpha} \cdot \cos{\delta}
    & -\sin{\alpha} \cdot \sin{\delta} \cdot \sin{\gamma} + \cos{\alpha} \cdot \cos{\gamma}
    & -\sin{\alpha} \cdot \sin{\delta} \cdot \sin{\gamma} - \cos{\alpha} \cdot \sin{\gamma}
    \\
      \sin{\delta}
    & \cos{\delta} \cdot \sin{\gamma}
    & \cos{\delta} \cdot \cos{\gamma}
\end{array}\right)
$$

上面两个变换矩阵是相等的，因此9个元素两两相等，于是：
1. 根据元素$(3,3)$相等，我们可以得到$\cos{i} = \cos{\delta} \cdot \sin{\beta}$，即公式4.33；
2. 根据元素$(3,1)$相等，我们可以得到$\sin{l} = \frac {\sin{\delta}} {\sin{i}}$；根据元素$(3,2)$相等，我们可以得到$\cos{l} = \frac {\cos{\delta} \cdot \cos{\beta}} {\sin{i}}$；两式相除得到$\tan{l} = \frac {\tan{\delta}} {\cos{\beta}}$，即公式4.34；
3. 根据元素$(2,1)$相等，我们可以得到$\sin{\alpha} = \frac {\cos{i} \cdot \sin{l}} {\cos{\delta}}$；根据元素$(1,1)$相等，我们可以得到$\cos{\alpha} = \frac {\cos{l}} {\cos{\delta}}$；两式相除得到$\tan{\alpha} = \frac {\cos{i}} {\tan{l}}$，即公式4.35。

