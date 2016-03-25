---
layout: post
title: 使用OpenCV中涉及到vector时发生的问题
pagetype: post
author: Cosmo
---

今天用OpenCV的`imencode`函数编码一个图片，结果在程序结束时发生了一个运行时错误。

#### 错误描述

Visual Studio 2015, Windows 10。使用OpenCV来编码图像，将`Mat`以指定的图片格式编码成字节序列，并存储在`vector<uchar>`中。

{% highlight cpp %}
#include "stdafx.h"

#include <iostream>
#include <vector>

#include <opencv\cv.h>
#include <opencv\cxcore.h>
#include <opencv\highgui.h>

#include "base64.h"

using namespace std;

int main()
{
	cv::Mat mat = cv::imread("C:\\Users\\花栗鼠的猫\\Pictures\\Saved Pictures\\1.jpg");
	vector<uchar> data;
	cv::imencode(".png", mat, data); // 问题代码在这里
	string base64str = base64_encode(&data.at(0), data.size());
	cout << base64str << endl;
	cvNamedWindow("queen");
	cv::imshow("queen", mat);
	cv::waitKey();
    return 0;
}
{% endhighlight %}

程序运行一切顺利，编码正常，编码后做的一切其他事情也正常，但最后退出时发生了下面的错误：

{% highlight cpp %}
Debug Assertion Failed!

Program: ...015 Projects\MFCActiveXControl1\Debug\ConsoleApplication1.exe
File: c:\program files (x86)\microsoft visual studio 14.0\vc\include\xmemory0
Line: 116

Expression: "reinterpret_cast<uintptr_t *>(_Ptr_ptr)[-1] == _BIG_ALLOCATION_SENTINEL" && 0

For information on how your program can cause an assertion
failure, see the Visual C++ documentation on asserts.

(Press Retry to debug the application)
{% endhighlight %}

#### 分析

经过简单的调试，感觉应该是程序退出时，在释放`data`向量时发生了内存分配错误。但苦思冥想不知道究竟为什么会发生这样的错误，如此简单的一段代码不可能存在内存问题呀。

无奈于是Google之，发现也有不少人遇到了类似错误，都是在使用OpenCV的各种函数时遇到的，有一个共同特点，就是都涉及到了`vector`。下面这个讨论算是比较全面的：

[http://answers.opencv.org/questions/67152/revisions/](http://answers.opencv.org/questions/67152/revisions/)

讨论中谈到的原因基本与我猜想的相同，是释放向量时发生的BUG。讨论里有人建议用Release配置编译，但我试了还是不行，结果是这样的：

{% highlight cpp %}
0x6F97C3A2 (ucrtbase.dll) (ConsoleApplication1.exe 中)处有未经处理的异常: 将一个无效参数传递给了将无效参数视为严重错误的函数。
{% endhighlight %}

大多数人建议在自己环境上重新编译OpenCV，这个感觉比较靠谱。但是本人C++技术比较渣，尤其不会用windows的编译环境，所以暂时没有尝试。

#### 解决方法

1. 尝试使用Release配置
2. 在自己环境上手动编译OpenCV源码