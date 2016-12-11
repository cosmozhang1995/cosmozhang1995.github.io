---
layout: post
title: BP神经网络的推导
pagetype: post
author: Cosmo
---

BP神经网络（Back-Propagate Neural Network）是今天神经网络算法的基础，它也是一个经典的数学优化问题，从数学的角度上来讲其实它并不深奥，只是以前不懂数学的我一直没有弄懂。最近由于学习的需要，重新捡起来看了一看，觉得似乎瞬间理解了BP的原理。

### 神经网络的数学描述

作如下假设：

- 网络共有*\eq n*层
- 激活函数为*\eq f(x)*
- 对第*\eq l+1*层：
	- neuron数目为*\eq s_{l+1}*
	- 第*\eq j*个neuron接收上一级第i个neuron的输入为：*\eq x_{ij}^{(l+1)}*
	- 第*\eq j*个neuron与上一级第*\eq i*个neuron的连接权值为：*\eq w_ij^{(l+1)}*
	- 第*\eq j*个neuron的偏置为：*\eq b_j^{(l+1)}*
	- 第*\eq j*个neuron的输入和为：*\eq u_j^{(l+1)}=\sum_{i=1}^{s_l}w_ij^{(l+1)}x_ij^{(l+1)}+b_j^{(l+1)}*
	- 第*\eq j*个neuron的激活输出为：*\eq t_j^{(l+1)}=f(u_j^{(l+1)})*

### 梯度下降法

首先说**梯度下降（gradient descent）**方法，梯度下降是一个最常用的数学优化方法，要优化一个损失函数*\eq f(x)*，就是要找到它的极小值，也就是要让*\eq x*向负梯度方向移动，梯度下降法每次迭代将*\eq x*向负梯度方向移动*\eq \eta*，*\eq \eta*为学习率，也就是：

*\eqc x_{n+1}=x_{n}-\eta f'(x_n)\ ,\ \eta > 0*

### BP算法

然后说**BP算法**，在BP算法中，我们要优化的也是损失函数，损失函数取成残差的模方，即

*\eqc E = \frac{1}{2} {\left\\\|y-u^{(n)}\right\\\|}^2*

将BP算法看作问题*\eq g*，即*\eq E = g(W^{(2)},W^{(3)},\cdots,W^{(n)},b^{(1)},b^{(2)},\cdots,b^{(n)};x^{(1)})*，优化权值*\eq W^{(i)}*和偏置*\eq b^{(i)}*。

#### δ规则

BP的精髓在于**δ规则**，而δ规则的精髓在于它建立了相邻两层神经元的损失函数的偏导的关系，这个关系可以解释为：后级神经元的误差依网络权重传递给前级神经元。下面给出δ规则的推导，注意偏导数的链式法则（chain rule）会在推导中起到重要的作用。

首先，我们定义一个δ值，δ的含义是“误差对偏置项的偏导”

*\eqc \delta_i^{(l)} = \frac{\partial E}{\partial b_i^{(l)}} = \frac{\partial E}{\partial u_i^{(l)}} \cdot \frac{\partial u_i^{(l)}}{\partial b_i^{(l)}} = \frac{\partial E}{\partial u_i^{(l)}} \cdot 1 = \frac{\partial E}{\partial u_i^{(l)}}*

上面这个式子非常重要，他告诉我们*\eq \delta_i^{(l)} = \frac{\partial E}{\partial b_i^{(l)}} = \frac{\partial E}{\partial u_i^{(l)}}*，原因很简单，因为*\eq b*在*\eq u*中是偏置项，也就是*\eq u*说对于*\eq b*的偏导是1。

下面推导相邻两层之间δ的关系。

*\eqc \parstyle\begin{align\*}
\delta_i^{(l)} &= \frac{\partial E}{\partial u_i^{(l)}}
&= \sum_{j=1}^{s_(l+1)} \frac{\partial E}{\partial u_j^{(l+1)}} \frac{\partial u_j^{(l+1)}}{\partial u_i^{(l)}}
&= \sum_{j=1}^{s_(l+1)} \delta_i^{(l+1)} \frac{\partial u_j^{(l+1)}}{u_i^{(l)}}
\end{align\*}*

其中

*\eqc \parstyle\begin{align\*}
\frac{\partial u_j^{(l+1)}}{\partial u_i^{(l)}} &= \frac{\partial (b_j^{(l+1)} + \sum_{k=1}^{s_l} w_{kj}^{(l+1)} f(u_k^{(l)})}{u_i^{(l)}}
&= \frac{\partial (w_{ij}^{(l+1)} f(u_i^{(l)}))}{\partial u_i^{(l)}} 
&= w_{ij}^{(l+1)} f'(u_i^{(l)})
\end{align\*}*

因此得到

*\eqn (1)* *\eqc \delta_i^{(l)} = f'(u_i^{(l)}) \sum_{j=1}^{s_(l+1)} w_{ij}^{(l+1)} \delta_j^{(l+1)}*

观察上式的形式，我们可以给出如下解释：预测误差在神经网络中反向传递，前一个神经元对于后一个神经元的误差的贡献就是它们之间的连接权值，而某一个神经元所造成的误差是它对所有下级神经元造成的误差的总和。

有了δ规则，我们可以确定所有的*\eq \frac{\partial E}{\partial b_i^{(l)}}*，也就是说确定了所有的偏置项的优化规则，而权值的优化规则也很好确定：

*\eqn (2)* *\eqc \frac{\partial E}{\partial w_{ij}^{(l)}} = \frac{\partial E}{\partial u_j^{(l)}} \cdot \frac{\partial u_j^{(l)}}{\partial w_{ij}^{(l)}} = \delta_j^{(l)} x_{ij}^{(l)}*

上面所有的推导形成了这样一个优化思路：通过在层与层之间的权值关系确定所有δ，通过所有δ确定所有权值和偏置的梯度方向，进而确定优化规则。

在层之间递归确定δ时，还缺少最后一环，即最后层也就是输出层的δ值，这也不难求：

*\eqn (3)* *\eqc \delta_i^{(n)} = \frac{\partial E}{\partial u_i^{(n)}} = (y_i^{(n)} - f(u_i^{(n)})) ( - f'(u_i^{(n)}))*

看，一切都是链式法则。现在我们有了递归的初值**[式(3)]**，有了递归规则**[式(1)]**，有了递归项对于优化规则的决定规则**[式(2)]**，就可以逐次迭代优化网络了。
