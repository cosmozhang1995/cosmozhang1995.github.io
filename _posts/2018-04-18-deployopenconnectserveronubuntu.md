---
layout: post
title: 在Ubuntu上配置OpenConnect
pagetype: post
author: Cosmo
date: 2018-04-18 20:05:12 
---

OpenConnect是一个开源的VPN软件，目前为止似乎只有它的原生版没有被河蟹，本文介绍一下如何在Ubuntu上搭建OpenConnect服务器，以及如何使用AnyConnect连接这个VPN。

书接上文，自从上次配了个服务器之后，没多久就发现服务器down了，查看日志发现VPN一连上就reset了，后来上论坛上看了一下，觉得应该是OpenVPN的特征包已经被GFW识别出了。#到了后来直接服务器都登不上了，GFW真狠……#。话说现在GFW已经不是曾经的那个GFW了，模式识别、机器学习行为分析……无所不用其极啊……

但是，总要有人能翻墙吧，BAT和各大独角兽都给自己公司的内网搭设了专线VPN，上个Google、SO啥的完全不是问题，zf不可能封禁他们吧，不然这些公司怎么活？所以BAT用的翻墙软件咱们肯定能用，那BAT用啥呢，反正百度用的是Cisco的VPN————哦～原来BAT用的是Cisco的收费解决方案啊，这不是我们平民老百姓玩得起的啊……

但是这时OpenConnect横空出世了，打倒Cisco大地主，帮我们翻身农奴得解放～OpenConnect最牛逼的一点就是它破解了Cisco的VPN协议，所以，我们可以用OpenConnect服务假冒Cisco的VPN服务，愉快地假装BAT翻墙。

说起来其实是一套服务，其实我们只需要搭建一个OpenConnect服务端就好了，毕竟人家Cisco卖的是服务端解决方案，客户端都是一摸一样的AnyConnect软件，不收钱的，我们只需要用Cisco官方的AnyConnect软件连接假冒成Cisco服务端的OpenConnect服务端，就算大功告成。

那么开始动手吧～

## 搭建OpenConnect服务端ocserv

首先OpenConnect（以下简称OC）的服务端软件是叫做`ocserv`（[官方repo在此](https://gitlab.com/ocserv/ocserv)），我们接下来其实都是在跟这个`ocserv`过不去。

本次实验所用的环境是DigitalOcean的5美元服务器，搭载 Ubuntu 16.04 系统。

## 准备SSL证书

OC用的是标准的TLS协议搭建隧道（现在Cisco还有专门的IPSec隧道协议，这一点OC还没能做到），因此我们的服务器需要一套SSL证书（密钥+证书），鉴于我们是穷人，自然是不可能花钱去申请这么一套证书的，所以我们还需要自己假扮证书颁发机构，这个机构又需要一套证书。

> 一套证书包括一个密钥和一个证书，其实就是一对非对称公私钥，私钥就是密钥，公钥就是证书。

我们使用`certtool`这个工具来生成SSL证书，这个工具发布在`gnutls-bin`这个包里，可以直接`apt-get install -y gnutls-bin`安装，安装完成后就可以直接使用`certtool`了。

### 证书颁发机构

首先生成证书颁发机构的密钥`ca-key.pem`：

`certtool --generate-privkey --outfile ca-key.pem`

然后生成证书，证书需要一些签名信息，所以我们先创建一个模板文件`ca.tmpl`，其内容为：

```
cn = "example-ca.com"
organization = "example-ca.com"
serial = 1
expiration_days = 3650
ca
signing_key
cert_signing_key
crl_signing_key
```

然后就可以用上面的密钥结合这个模板文件中的信息，生成证书`ca-cert.pem`：

`certtool --generate-self-signed --load-privkey ca-key.pem --template ca.tmpl --outfile ca-cert.pem`

至此我们就造出了一个证书颁发机构，它具有公开的证书`ca-cert.pem`，以及自己保密持有的密钥`ca-key.pem`。当然，由于我们这个颁发机构不在各大厂商（如微软、苹果等）的受信任机构列表中，所以实际使用的时候，客户端会提示我们说证书来自不受信任的颁发机构，这个时候当然是选择原谅他啦～

### 服务端证书

然后生成服务器的证书，和上面一样的套路，同样是先生成私钥：

`certtool --generate-privkey --outfile server-key.pem`

然后准备证书模板，这次的模板内容为：

```
cn = "example-server.cm"
organization = "example-server.com"
expiration_days = 3650
signing_key
encryption_key
tls_www_server
```

然后创建证书，这次创建的证书是由上面的证书颁发机构颁发的，因此需要颁发机构的签名，创建的命令如下：

`certtool --generate-certificate --load-privkey server-key.pem --load-ca-certificate ca-cert.pem --load-ca-privkey ca-key.pem --template server.tmpl --outfile server-cert.pem`

服务端证书就这么创建完啦～

### 用户证书

有些情况下，每个用户也需要一个自己的证书（下面会具体说明），所以我们现在来创建一个用户证书，首先同样是生成私钥：

`certtool --generate-privkey --outfile zhangsan-key.pem`

用户证书的创建模板如下：

```
cn = "Zhang San"
unit = "Google Inc."
expiration_days = 365
signing_key
tls_www_client
```

同服务器一样，用户证书也是由颁发机构颁发的，生成它的命令如下：

`certtool --generate-certificate --load-privkey zhangsan-key.pem --load-ca-certificate ca-cert.pem --load-ca-privkey ca-key.pem --template zhangsan.tmpl --outfile zhangsan-cert.pem`

此外，AnyConnect支持导入的证书格式为PKCS12的格式，因此需要将密钥和证书一起打包成PKCS12格式的证书，命令如下：

`certtool --to-p12 --load-privkey zhangsan-key.pem --pkcs-cipher 3des-pkcs12 --load-certificate zhangsan-cert.pem --outfile zhangsan.p12 --outder`

那么用户 Zhang San 的证书就创建好啦。

为了比较方便地为用户生成证书，我写了一个脚本`gen_user_certs`：

```
#!/bin/bash
echo "" > $1.tmpl
echo "cn = $1" >> $1.tmpl
echo "unit = $1" >> $1.tmpl
echo "expiration_days = 3650" >> $1.tmpl
echo "signing_key" >> $1.tmpl
echo "tls_www_client" >> $1.tmpl
certtool --generate-privkey --outfile $1-key.pem
certtool --generate-certificate --load-privkey $1-key.pem --load-ca-certificate /etc/ocserv/certs/ca-cert.pem --load-ca-privkey /etc/ocserv/certs/ca-key.pem --template $1.tmpl --outfile $1-cert.pem
certtool --to-p12 --load-privkey $1-key.pem --pkcs-cipher 3des-pkcs12 --load-certificate $1-cert.pem --outfile $1.p12 --outder
```

`chmod +x gen_user_certs`赋予它可执行权限，然后运行`gen_user_certs <username>`即可，譬如：

`gen_user_certs wangwu`

## 安装和配置`ocserv`

Ubuntu的源里默认就有`ocserv`，因此直接用`apt`安装即可：

`apt-get install -y ocserv`

安装完成后，应该会生成`/etc/ocserv`目录，其中有一个`ocserv.conf`配置文件，我们打开它，来配置`ocserv`，几条比较关键的配置如下：

```
# 登陆方式，这里配置为使用证书登录
auth = "certificate"

# 允许同时连接的客户端数量
max-clients = 4

# 限制同一客户端的并行登陆数量
max-same-clients = 2

# 服务监听的IP（也就是服务器的IP，可不设置，默认就是监听所有IP）
listen-host = 1.2.3.4

# 服务监听的TCP/UDP端口
# 如果你不设置，默认端口都是443
# 但经过我的测试，似乎443端口登不上去，不知是不是墙的原因
tcp-port = 1234
udp-port = 1234

# 自动优化VPN的网络性能
try-mtu-discovery = true

# 确保服务器正确读取用户证书（后面会用到用户证书）
# 示例配置文件的注释中说可以填 2.5.4.3 或 0.9.2342.19200300.100.1.1
# 原配置文件默认已经填写了 0.9.2342.19200300.100.1.1
# 但经我测试这个是没法用的，必须要填 2.5.4.3
cert-user-oid = 2.5.4.3

# 服务器证书与密钥
server-cert = /path/to/server-cert.pem
server-key = /path/to/server-key.pem

# 证书颁发机构证书，用于验证用户证书是否受信
ca-cert = /path/to/ca-cert.pem

# 客户端连上vpn后使用的dns
dns = 8.8.8.8
dns = 8.8.4.4

# 注释掉所有的route，这样服务器就会转发所有的包；
# 否则服务器只会转发目的网段在route之中的包。
#route = 192.168.1.0/255.255.255.0

# 启用cisco客户端兼容性支持
cisco-client-compat = true
```

> `route`可以配置多条，你可以把常用的banned网站的IP都通过`route`加进来，从而实现智能分流（不在route列表里的不走VPN），比如这位大神的配置：[https://github.com/don-johnny/anyconnect-routes/blob/master/routes](https://github.com/don-johnny/anyconnect-routes/blob/master/routes)，但是很不幸，由于OpenConnect的原理所限，你不可能像socks那样直接配置域名甚至使用PAC。

> 不管因为什么原因，如果你不幸没有`/etc/ocserv/ocserv.conf`这个文件，可以去`ocserv`的`repo`上去下载[`sample.conf`](https://gitlab.com/ocserv/ocserv/raw/master/doc/sample.config)，然后在此基础上进行改动。

## 配置NAT转发

和OpenVPN相似，OpenConnect同样是基于网关转发的VPN模型，所以我们一样要配置VPN转发。在网上学习的时候我发现了一个神器`ufw`，它是Ubuntu上的防火墙管理工具，有了它就可以做`iptables`的大部分工作，同时它使用起来又比`iptables`简单。`ufw`是基于配置文件的，它的配置文件都在`/etc/ufw`目录下，配置好之后通过`ufw reload`命令重新加载。如果你是第一次使用，在`reload`前还需要通过`ufw enable`来开启`ufw`。

首先设置`ufw`的默认策略，修改`/etc/default/ufw`，把默认转发策略改成`ACCEPT`：

`DEFAULT_FORWARD_POLICY="ACCEPT"`

然后开启IP转发，编辑`/etc/ufw/sysctl.conf`，根据你的需要，开启IPv4或IPv6：

```
# 如果你不需要IPv4转发，注释掉下面这一行
net/ipv4/ip_forward=1

# 如果你不需要IPv6转发，注释掉下面这两行
net/ipv6/conf/default/forwarding=1
net/ipv6/conf/all/forwarding=1
```

> 我不确定是否还要编辑`/etc/sysctl.conf`，如果不行你可以试试编辑它，修改`net.ipv4.ip_forward = 1`，编辑好之后运行`sysctl -p`使设置生效。

然后添加转发条目，编辑`/etc/ufw/before.rules`，在末尾的`COMMIT`后加入如下配置：

```
*nat
:POSTROUTING ACCEPT [0:0]
-A POSTROUTING -s 0.0.0.0/0 -o eth0 -j MASQUERADE
COMMIT
```

关于这段配置，做几个小说明：

1. 这个文件实际上就是在编辑`iptables`的规则
2. 第一行`*nat`表示下面的规则属于`nat`这个表（还记得`iptables`的路由表概念吗）
3. 第三行就是配置NAT转发，表示将来源于任何地址、发到`eth0`接口的包的源地址都修改为`eth0`的地址，`-j MASQUERADE`是一个神奇的语句，相当于`-j SNAT --to 接口当前地址`，可以自动查询接口的当前地址并NAT到这个地址上。所以如果你的服务器IP是固定的，也可以直接写成`-j SNAT --to 123.123.123.123`
4. 关于`iptables`配置NAT，可以具体参见网上的文章，[比如这篇](https://blog.csdn.net/donghaixiaolongwang/article/details/63263226)

这些配置都做完之后，用`ufw reload`命令使其生效（如果你的`ufw`处于禁用状态，需要先`ufw enable`启用之）。

配置完之后可以查看一下`iptables`的规则，看是不是符合意愿，使用命令`iptables -t nat -L`查看`nat`表的规则，我的结果如下：

```
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination         

Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination         

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination         
SNAT       all  --  anywhere             anywhere             to:123.123.123.123
```

注意，我没有使用`MASQUERADE`而是直接用了`SNAT --to`指到我的服务器地址，所以最后一条规则是那样的。

最后还需要放行你的VPN端口：

```
ufw allow 1234
ufw allow 1234/udp
```

## 开启`ocserv`

现在我们可以启动`ocserv`啦，按道理来说应该可以通过`service ocserv start`来启动，但我发现这种方式启动的`ocserv`会监听默认端口443，而不是你在配置文件里自定义的端口（进一步测试发现`ocserv`实际上是加载了配置文件的，因为我在配置文件中的`auth`的确字段生效了），所以我放弃了这种方式，改用命令启动：

`ocserv -c /etc/ocserv/ocserv.conf -f -d 1`

其中，`-c xxx`是指定配置文件，`-f`表示前台运行（如果不加这个选项`ocserv`会自动转到后台运行，不阻塞控制台），`-d 1`表示verbose的等级，会打印出来调试信息。

## 配置客户端

下面我以iOS版的AnyConnect为例来说明，首先需要去AppStore下载AnyConnect，打开后界面如下：

![](http://cosmozhang1995-github-io.oss-cn-beijing.aliyuncs.com/91744b68-4319-11e8-a213-a0999b04d051-1001524061940_.pic.jpg)

### 添加用户证书

首先我们需要添加用户证书，你需要先把你的用户证书上传到一个http服务器上，让它可以用http协议下载，如：`http://123.123.123.123/zhangsan.p12`，然后点“诊断”-“导入用户证书”，输入上面的URL，会提示你输密码，这里输入你生成p12证书时的密码即可。

![](http://cosmozhang1995-github-io.oss-cn-beijing.aliyuncs.com/9715ffcc-431b-11e8-b4d7-a0999b04d051-1001524061940_3.jpg)

### 配置服务器信息

回到首页，点击“连接”-“添加VPN”连接，输入服务器地址和端口，如`123.123.123.123:1234`，然后点击“高级”-“证书”，选择你刚刚导入的证书。

![](http://cosmozhang1995-github-io.oss-cn-beijing.aliyuncs.com/a479ca57-431b-11e8-b720-a0999b04d051-1001524061940_4.jpg)

### 连接

回到首页，点击右上角的开关，就可以愉快连接啦～

![](http://cosmozhang1995-github-io.oss-cn-beijing.aliyuncs.com/ce6af1bd-431b-11e8-b633-a0999b04d051-1001524061940_2.jpg)

首次连接的时候会出现弹框，告诉你这个证书不可信任，前面说过了，原谅他，我们点击弹框右上角的“导入”，就可以将我们的服务器证书加入信任列表，以后就不会再提示了～

## 另一种认证方式

我们还可以让`ocserv`采用 用户名+密码 的认证方式，这种情况下客户端不需要添加用户证书了（当然你也就没必要生成一个用户证书给用户了），而是需要通过一个用户名密码去登录，不过每次登录都需要输入用户名密码，还是挺麻烦的。

首先配置`ocserv.conf`，作以下修改：

```
# 登陆方式，这里改为使用密码登录，并配置密码库文件
auth = "plain[/path/to/ocpasswd]"

# 证书颁发机构证书，用于验证用户证书是否受信
# 这里不需要验证用户证书了，可以注释掉这一句
#ca-cert = /path/to/ca-cert.pem
```

然后添加一个用户，比如`zhangsan`：

`ocpasswd -c /etc/ocserv/ocpasswd zhangsan`

然后会提示输入密码，完成后用户就创建成功了。

重启`ocserv`，在客户端删掉用户证书，重新连接，就会被要求输入用户名密码了。

## 参考文献

1. [Console log for ocserv configuration](https://gist.github.com/methou/ffd9ec4c9f9e80cb57be)
2. [使用ocserv搭建 Cisco Anyconnect 服务器](https://www.logcg.com/archives/1343.html)
3. [TLS/SSL工作原理](https://blog.csdn.net/hherima/article/details/52469360)


