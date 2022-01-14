---
layout: post
title: 轨道动力学学习笔记
pagetype: post
author: Cosmo
date: 2022-01-14 23:03:00
---

最近研究轨道动力学这玩意儿上了瘾，推点小公式，自己记录一下。

# Textbook

[Rocket and Space Technology](http://www.braeunig.us/space/orbmech.htm)

# 基本的数学约定

## 坐标系和坐标系变换

我们使用**右手笛卡尔坐标系**，即右手大拇指指向X+、食指指向Y+、掌心朝向Z+。

我们约定如下的旋转矩阵：$\mathbb{R}_x(\theta)$、$\mathbb{R}_y(\theta)$、$\mathbb{R}_z(\theta)$分别表示向X、Y、Z负方向看去时绕该轴逆时针旋转$\theta$角度的旋转矩阵，于是有：

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

对于**地心赤道坐标系**，我们一般定义为：原点$O$在地心处，xOy平面为赤道平面，X方向朝春分点，Z方向朝北极。

一般，在天球坐标系上，我们假设天球半径为$1$，在地球坐标系上，则假设地球半径为$1$。

# 公式4.33-4.37推导

首先，我们不妨假设，在天球地心赤道坐标系上，轨道平面与赤道平面的交线（即升交点到降交点的连线）延Y轴方向，其中升、降交点分别于秋、春分点重合。

在天球上，设轨道（为一个大圆）的升交点为$A$，那么很显然$A$点的坐标为${(\cos{i}, 0, \sin{i})}^T$。设燃尽点点为$B$点，在过$O$点与$OB$垂直的平面（即B点的罗盘平面）上，北极点N点的投影为$N'$，将$\overrightarrow{ON'}$绕$OB$旋转$\beta$后得到$\overrightarrow{OC}$，那么$\overrightarrow{OC}$即为卫星在B点的速度在天球上投影的方向，因此$\overrightarrow{OC} || \square{AOB}$，于是$C$点位于$\square{AOB}$内，而$C$又位于天球上，因此$C$点位于轨道圆上。

接下来，我们计算$C$点的坐标，也即计算$B$点的速度矢量在天球上的投影的方向$\overrightarrow{OC}$。大致思路是：假设轨道由这样一个“初始轨道”变换而来，“初始轨道”与赤道重合且燃尽点$B$与秋分点$(1,0,0)$重合，那么在“初始轨道”上，$B$点的速度朝向为$(0,1,0)$，那么，我们只要将$(0,1,0)$随“初始轨道”一起变换到实际轨道上，就可以得到实际的$B$点速度方向，即$\overrightarrow{OC}$，即$C$点坐标。

为了记述方便，我们暂且记$\alpha = \Delta{\lambda}$，$\gamma = \frac{\pi}{2}$ - \beta。

有两种变换途径：

第一，先转向$l$，使得升交点与秋分点重合，再仰角$i$，得到轨道倾角。即先绕Z轴旋转$l$，再绕X轴旋转$i$。变换矩阵为：

$$ \mathbb{R}_x(i) \cdot \mathbb{R}_z(l) =
\left(\begin{array}{lll} 
    \cos{l}               & -\sin{l}              & 0 \\
    \cos{i} \cdot \sin{l} & \cos{i} \cdot \cos{l} & -\sin{i} \\
    \sin{i} \cdot \sin{l} & \sin{i} \cdot \cos{l} & \cos{i}
\end{array}\right)
$$


第二，先旋转出B点的方位角东偏北$\gamma$，然后仰角$\delta$，得到$B$点的纬度，最后再转向$\alpha$，使得升交点与秋分点重合。即先绕X轴旋转$\gamma$，然后绕Y轴旋转$-\delta$，最后绕Z轴旋转$\alpha$。变换矩阵为：

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
2. 根据元素$(3,1)$相等，我们可以得到$\sin{l} = \frac {\sin{\delta}} {\sin{i}}$；根据元素$(3,2)$相等，我们可以得到$\cos{l} = \frac {\cos{\delta} \cdot \cos{\beta}} {\sin{i}}$；两式相除得到$\tan{l} = \frac {\tan{\delta}} {\cos{beta}}$，即公式4.34；
3. 根据元素$(2,1)$相等，我们可以得到$\sin{\alpha} = \frac {\cos{i} \cdot \sin{l}} {\cos{\delta}}$；根据元素$(1,1)$相等，我们可以得到$\cos{\alpha} = \frac {\cos{l}} {\cos{\delta}}$；两式相除得到$\tan{\alpha} = \frac {\cos{i}} {\tan{l}}$，即公式4.35。

