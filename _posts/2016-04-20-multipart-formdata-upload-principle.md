---
layout: post
title: multipart/form-data POST文件上传详解
pagetype: post
author: Cosmo
---
本文解释了通过 multipart/form-data 格式的HTTP请求上传文件的原理。

#### 简单的HTTP POST

大家通过HTTP向服务器发送POST请求提交数据，都是通过form表单提交的，代码如下：

{% highlight html %}
<form method="post"action="http://w.sohu.com" >
     <input type="text" name="txt1">
     <input type="text" name="txt2">
</form>
{% endhighlight %}

提交时会向服务器端发出这样的数据（已经去除部分不相关的头信息），数据如下：

{% highlight html %}
POST / HTTP/1.1
Content-Type:application/x-www-form-urlencoded
Accept-Encoding: gzip, deflate
Host: w.sohu.com
Content-Length: 21
Connection: Keep-Alive
Cache-Control: no-cache
 
txt1=hello&txt2=world
{% endhighlight %}
 
对于普通的HTML Form POST请求，它会在头信息里使用Content-Length注明内容长度。头信息每行一条，空行之后便是Body，即“内容”（entity）。它的`Content-Type`是`application/x-www-form-urlencoded`，这意味着消息内容会经过URL编码，就像在GET请 求时URL里的QueryString那样。txt1=hello&txt2=world

#### POST上传文件

最早的HTTP POST是不支持文件上传的，给编程开发带来很多问题。但是在1995年，IETF出台了RFC1867,也就是`《RFC 1867 - Form-based File Upload in HTML》`，用以支持文件上传。所以`Content-Type`的类型扩充了`multipart/form-data`用以支持向服务器发送二进制数据。因此发送POST请求时候，表单`<form>`属性`enctype`共有二个值可选，这个属性管理的是表单的MIME编码：

1. `application/x-www-form-urlencoded(默认值)`
2. `multipart/form-data`

其实form表单在你不写`enctype`属性时，也默认为其添加了`enctype`属性值，默认值是`enctype="application/x- www-form-urlencoded"`.
 
通过form表单提交文件操作如下：

{% highlight html %}
<form method="post"action="http://w.sohu.com/t2/upload.do" enctype=”multipart/form-data”>
    <input type="text" name="desc">
    <input type="file" name="pic">
</form>
{% endhighlight %}
 
浏览器将会发送以下数据：

{% highlight html %}
POST /t2/upload.do HTTP/1.1
User-Agent: SOHUWapRebot
Accept-Language: zh-cn,zh;q=0.5
Accept-Charset: GBK,utf-8;q=0.7,*;q=0.7
Connection: keep-alive
Content-Length: 60408
Content-Type:multipart/form-data; boundary=ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC
Host: w.sohu.com
 
--ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC
Content-Disposition: form-data;name="desc"
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit
 
[......][......][......][......]...........................
--ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC
Content-Disposition: form-data;name="pic"; filename="photo.jpg"
Content-Type: application/octet-stream
Content-Transfer-Encoding: binary
 
[图片二进制数据]
--ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC--

{% endhighlight %}
 
我们来分析下数据，第一个空行之前自然还是HTTP header，之后则是Entity，而此时的Entity也比之前要复杂一些。根据RFC 1867定义，我们需要选择一段数据作为“分割边界”（ boundary属性），这个“边界数据”不能在内容其他地方出现，一般来说使用一段从概率上说“几乎不可能”的数据即可。 不同浏览器的实现不同，例如火狐某次POST的`boundary=---------------------------32404670520626`， Opera为`boundary=----------E4SgDZXhJMgNE8jpwNdOAX`，每次POST浏览器都会生成一个随机的30-40位长度的随机字符串，浏览器一般不会遍历这次post的所有数据找到一个不可能出现在数据中的字符串，这样代价太大了。一般都是随机生成，如果你遇见boundary值和post的内容一样，那样的话这次上传肯定失败，不过我建议你去买彩票，你太幸运了。Rfc1867这样说明

> A boundary is selected that does not occur in any of the data. (This selection is sometimes done probabilisticly.)}。
 
 
选择了这个边界之后，浏览器便把它放在`Content-Type`里面传递给服务器，服务器根据此边界解析数据。下面的数据便根据boundary划分段，每一段便是一项数据。(每个field被分成小部分，而且包含一个value是"form-data"的`Content-Disposition`的头部；一个`name`属性对应field的ID,等等，文件的话包括一个filename)

IE和Chrome在filename的选择策略上有所不同，前者是文件的完整路径，而后者则仅仅是文件名。

数据内容以两条横线结尾，并同样以一个换行结束。在网络协议中一般都以连续的`CR`、`LF`（即`\r`、`\n`，或`0x0D`、`Ox0A`）字符作为换行，这与Windows的标准一致。如果您使用其他操作系统，则需要考虑它们的换行符。

另外`Content-length`指的是所用数据的长度。