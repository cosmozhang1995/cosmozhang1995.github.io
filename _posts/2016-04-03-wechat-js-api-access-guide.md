---
layout: post
title: 微信 JS API 接入指南
pagetype: post
author: Cosmo
---

很久没做微信平台了，最近做了一趟活，微信平台，发现以前的东西真是忘了不少呀。写一个记录，记下一些坑，省的自己和大家以后再踩。

#### JS SDK 介绍

> 微信JS-SDK是微信公众平台面向网页开发者提供的基于微信内的网页开发工具包。通过使用微信JS-SDK，网页开发者可借助微信高效地使用拍照、选图、语音、位置等手机系统的能力，同时可以直接使用微信分享、扫一扫、卡券、支付等微信特有的能力，为微信用户提供更优质的网页体验。

以上是微信官方的概述。简而言之，微信平台给我们提供了一个基于平台WebView的浏览器（也就是俗称“微信浏览器”），它有自己的行为，自己的JS引擎，甚至自己的UA。所以微信的 JS API 其实就是提供了对微信浏览器的各种特性的调用，当然，这些特性主要是围绕着微信的功能展开的。

所以说，通过 JS API，你可以：

- 定制分享内容
- 调用微信扫一扫
- 摇一摇
- etc. 

但是，你不能：

- 获取用户信息
- 给用户发消息
- 其他一切微信浏览器完不成的操作

### 准备工作

#### 公众号

当然啦，你做微信平台就是给公众号做的嘛。不过，这里的公众号必须要经过认证的（嗯没错，每年你要给腾讯交300大洋）。有了认证的公众号，你就会得到一个`appid`和一个`appsecret`，这两个东东就是开发者调用各种微信功能所必需的尚方宝剑。`appid`是可以公开的，它唯一标识了你的公众号（就像尚方宝剑的剑鞘，你一定要把它放在一个显眼的位置），`appsecret`一定要严格保密，不然别人就可以拿着你的`appsecret`胡作非为了（就像尚方宝剑的剑刃，没事不要乱晃，有事也要找个灰暗的小角落偷偷摸摸的干活）。记住：

> <fakeholder class="warning"></fakeholder> 一切用到`appsecret`的地方必须在你的服务器上。

> <fakeholder class="warning"></fakeholder> 应用开发红色法则：平台方交给你服务器方的东西，未经平台方允许，不得交给第三方（如客户端）使用！

`appid`和`appsecret`可以在微信平台管理界面的“开发-基本配置”页中看到，如下图：

![](http://7xsaqs.com1.z0.glb.clouddn.com/Screen%20Shot%202016-04-03%20at%206.47.59%20PM.png)
![](http://7xsaqs.com1.z0.glb.clouddn.com/Screen%20Shot%202016-04-03%20at%206.48.07%20PM.png)

当然，作为开发者，我们也可以搞一个自己的测试账号，微信的这个东东做的还是很友好的！测试账号不需要花钱认证，即可使用各种微信接口。我就是用测试号进行开发的。

#### 配置公众号

公众号的基本配置就不说啦，不然你也看不到这里来。为了使用 JS API，我们需要配置JS安全域名。只有在安全域名下才能调用 JS API，否则 JS API 初始化时会报`invalid url domain`错误。JS安全域名配置如下图：

![](http://7xsaqs.com1.z0.glb.clouddn.com/Screen%20Shot%202016-04-03%20at%207.17.27%20PM.jpg)

### 获取 JS API 签名

获取签名基本上分3步走：

1. 获取`access_token`（需要`appid`、`appsecret`）
2. 获取`jsapi_ticket`（需要`access_token`）
3. 计算签名（需要`jsapi_ticket`、调用API的页面URL）

前两步需要通过调用微信官方HTTP接口获取，第3步需要在自己服务端实时计算得出。

#### 获取 access_token

为了确保安全，微信是不允许任何应用具有永久的接口权限的，所以一般调用微信的接口（所有接口，不止 JS API）都不是直接凭`appsecret`去调的，而是通过一个叫做`access_token`的东西来调的。你可以凭借`appid`和`appsecret`来调用微信的接口去换取`access_token`，那你要问了，这跟我直接用`appsecret`有啥区别呢？区别在于：`access_token`是有保质期的，一般为7200秒，逾期无效。所以即使你的`access_token`泄露了，攻击者也顶多有7200秒的时间来实施攻击。

获取`access_token`的接口为：

https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=`APPID`&secret=`APP_SECRET`

> <fakeholder class="danger"></fakeholder> 这个接口有调用限制，万万不要频繁调用！

#### 获取 jsapi_ticket

终于到了 JS API 登场了！获取到`access_token`后，我们还要获取`jsapi_ticket`。接口如下：

https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=`ACCESS_TOKEN`&type=jsapi

> <fakeholder class="danger"></fakeholder> 这个接口有调用限制，万万不要频繁调用！

#### 计算签名

签名生成规则如下：参与签名的字段包括noncestr（随机字符串）, 有效的jsapi_ticket, timestamp（时间戳，以秒为单位）, url（当前网页的URL，不包含#及其后面部分） 。对所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后，使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串string1。这里需要注意的是所有参数名均为小写字符。对string1作sha1加密，字段名和字段值都采用原始值，不进行URL 转义。

即signature=sha1(string1)。 示例：

- noncestr=Wm3WZYTPz0wzccnW
- jsapi_ticket=sM4AOVdWfPE4DxkXGEs8VMCPGGVi4C3VM0P37wVUCFvkVAy_90u5h9nbSlYy3-Sl-HhTdfl2fzFy1AOcHKP7qg
- timestamp=1414587457
- url=http://mp.weixin.qq.com?params=value

步骤1. 对所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后，使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串string1：

```
jsapi_ticket=sM4AOVdWfPE4DxkXGEs8VMCPGGVi4C3VM0P37wVUCFvkVAy_90u5h9nbSlYy3-Sl-HhTdfl2fzFy1AOcHKP7qg&noncestr=Wm3WZYTPz0wzccnW&timestamp=1414587457&url=http://mp.weixin.qq.com?params=value
```

步骤2. 对string1进行sha1签名，得到signature：

```
0f9de62fce790f9a083d5c99e95740ceb90c27ed
```

> <fakeholder class="danger"></fakeholder> 根据软件开发红色法则，jsapi_ticket千万不能给客户端，所以这一步必须在服务器完成（事实上上述三步都要在服务器完成）。

#### 最佳实践

看起来很复杂的样子是吧，实际操作中其实一般都是这个架构：

![](http://7xsaqs.com1.z0.glb.clouddn.com/wc-server-browser.png)

你的服务器通过配置文件保存`appid`和`appsecret`，运行时向微信请求并全局缓存`access_token`和`jsapi_ticket`，如果发现过期了才会重新向微信请求它们。然后你设计一个接口，客户端调用这个接口，你服务器根据访问的`url`实时计算一个`signature`，然后把`appid`、`signature`、生成该签名所用到的`noncestr`和`timestamp`返回给客户端。

#### 生成脚本

作为前端开发者，为了调试方便，我写了一个获取 JS API 的 Python 脚本，需要的可以拿去用～

这个脚本通过调用微信接口获取`access_token`和`jsapi_ticket`，并缓存在`cache.json`文件中。然后他会根据缓存或者请求的结果计算出一个`signature`并打印出来。每次调用时如果发现缓存过期了就会重新请求`access_token`和`jsapi_ticket`。你可以通过加`-r`参数强制不使用缓存。

{% highlight python %}
import requests
import hashlib
import base64
import uuid
import time
import sys, os
import json

appId = "wx704b0b407ae5eac3"
appSecret = "ecff44d4f7f37fa1de684cd69ea4a7d1"
url = "http://172.19.245.3:8000/dev/index.html?userId=6"

cache_obj = {}
cache_file = os.path.join(os.path.split(os.path.realpath(__file__))[0], 'cache.json')

if os.path.exists(cache_file) and os.path.isfile(cache_file) and (not "-r" in sys.argv):
    f = open(cache_file)
    try:
        cache_obj = json.load(f)
        f.close()
    except Exception:
        pass

def getAccessToken(appId, appSecret):
    current_time = int(time.time())
    if ('access_token' in cache_obj) and (current_time < cache_obj['access_token']['expire_time']):
        return cache_obj['access_token']['access_token']
    print "[WARNING] Requesting access_token"
    r = requests.get("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s" % (appId, appSecret))
    access_token = r.json()
    access_token['expire_time'] = current_time + access_token['expires_in']
    cache_obj['access_token'] = access_token
    writeCache()
    return access_token['access_token']

def getJSAPITicket(accessToken):
    current_time = int(time.time())
    if ('jsapi_ticket' in cache_obj) and (current_time < cache_obj['jsapi_ticket']['expire_time']):
        return cache_obj['jsapi_ticket']['ticket']
    print "[WARNING] Requesting JS API ticket"
    r = requests.get("https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=%s&type=jsapi" % accessToken)
    jsapi_ticket = r.json()
    jsapi_ticket['expire_time'] = current_time + jsapi_ticket['expires_in']
    cache_obj['jsapi_ticket'] = jsapi_ticket
    writeCache()
    return jsapi_ticket

def getJSAPIParams(ticket, url, appId):
    noncestr = base64.b64encode(str(uuid.uuid1()))
    timestamp = int(time.time())
    string1 = "jsapi_ticket=%s&noncestr=%s&timestamp=%d&url=%s" % (ticket, noncestr, timestamp, url)
    signature = hashlib.sha1(string1).hexdigest()
    return {
        "appId": appId,
        "timestamp": timestamp,
        "nonceStr": noncestr,
        "signature": signature
    }

def writeCache():
    f = open(cache_file, 'w')
    json.dump(cache_obj, f, indent = 4)
    f.close()

access_token = getAccessToken(appId, appSecret)
ticket = getJSAPITicket(access_token)
params = getJSAPIParams(ticket, url, appId)

print json.dumps(params, indent=4)
{% endhighlight %}

### JS API 的调用

要去吃饭啦，回头再写这部分。这部分比较简单，大家看微信的[<fakeholder target="_blank"></fakeholder>文档](http://mp.weixin.qq.com/wiki/11/74ad127cc054f6b80759c40f77ec03db.html#.E6.AD.A5.E9.AA.A4.E4.B8.89.EF.BC.9A.E9.80.9A.E8.BF.87config.E6.8E.A5.E5.8F.A3.E6.B3.A8.E5.85.A5.E6.9D.83.E9.99.90.E9.AA.8C.E8.AF.81.E9.85.8D.E7.BD.AE)也能看懂啦～













