---
layout: post
title: 使用JS调用MFC开发的ActiveX控件接口
pagetype: post
author: Cosmo
---

使用ActiveX可以开发适合IE浏览器的浏览器插件，实际使用中经常需要用js调用ActiveX的功能（接口），下面介绍一下基于MFC开发的ActiveX接口如何被JS调用。

#### ActiveX的可用技术

目前ActiveX插件主要基于两种框架开发，一种是MFC，一种是ATL，他们都是基于COM接口的框架。除了ActiveX以外，其他的浏览器插件都是基于 Netscape 的 NPAPI 接口规范开发的。

#### 创建ActiveX项目

使用 Visual Studio 2013，新建工程，选择 VC++ → MFC → ActiveX插件，即可创建出一个示例的ActiveX插件项目。其中主要包含三个类 `MFCActiveXControl1`、`MFCActiveXControl1Ctrl`、`MFCActiveXControl1PropPage`（`MFCActiveXControl1`是工程名称），插件的主要功能是在`MFCActiveXControl1Ctrl`中实现的。

#### 添加接口

Visual Studio 2013 能自动为MFC插件创建接口。`MFCActiveXControl1Lib.idl`这个文件定义了所有作为COM接口暴露出去的接口，其中示例项目默认就已经实现了一个 `AboutBox` 接口，可以看到在`MFCActiveXControl1Lib.idl`中，它被定义为一个COM接口，并属于`MFCActiveXControl1Ctrl`类，因此我们可以到`MFCActiveXControl1Ctrl`类中查看该接口的声明和实现。

在VS的类视图中，展开`MFCActiveXControl1Lib.idl`，可以看到`_DMFCActiveXControl1`和`_DMFCActiveXControl1CtrlEvents`，前者定义了作为方法的COM接口（调度），后者定义了作为事件的COM接口。右键点击`_DMFCActiveXControl1Ctrl`，选择 添加→方法，可以使用向导添加一个方法。

通过向导添加完成后，我们查看下面三个文件：

`MFCActiveXControl1Lib.idl`：这里为`MFCActiveXControl1Ctrl`类添加了对应方法的定义。

`MFCActiveXControl1Ctrl.h`：方法声明

`MFCActiveXControl1Ctrl.cpp`：方法定义、方法的COM映射（包括方法名、方法的显示名称、方法的id、返回值类型、参数类型等）

#### 在HTML中调用插件

查看`MFCActiveXControl1Lib.idl`文件，可以看到它为每个类都定义了一个 Class ID，这是一个UUID。工程编译出 OSX 文件后，需要使用`regsvr MFCActiveXControl1.osx`注册控件（加`-u参数可以反注册`）才能调用。实际发布插件时，应当发布一个安装包，客户端用户安装安装包后才能使用插件。

在HTML中嵌入ActiveX，使用以下代码：

{% highlight html %}
<object id="myactivex" classid="clsid:6bba1da3-f185-11e5-95a2-a0999b04d051" codebase="MFCActiveXControl1.cab#version=1.0.0"></object>
{% endhighlight %}

其中`6bba1da3-f185-11e5-95a2-a0999b04d051`为IDL文件中为`MFCActiveXControl1Ctrl`类定义的 Class ID。

#### 使用 JavaScript 调用COM接口

插件加载完成后，在IE的JS环境下，`myactivex`变量已经生成，变量指向`id="myactivex"`的`<object>`元素。只需要使用JS语句`myactivex.AboutBox()`即可调用`AboutBox()`方法。调用也可以穿参数，还可以返回返回值。

> <fakeholder class="warning"></fakeholder>如果你调用`myactivex.AboutBox`，会发现这个成员是`undefined`，但这并不影响什么。`myactivex.AboutBox()`是可以正常调用的。

