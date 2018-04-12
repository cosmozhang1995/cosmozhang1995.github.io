---
layout: post
title: 搭建OpenVPN并通过IPv6访问IPv4
pagetype: post
author: Cosmo
date: 2017-11-27 15:53:46 +0800
---

本文介绍如何在 Ubuntu 14.04 上搭建 OpenVPN，并通过 IPv6 访问之，如果服务器有 IPv4 的出口，那么就可以在不登录学校网关的情况下愉(mian)快(fei)上网啦。

今天在某小美女的办公室干活，因为没有网络账号，全程断网码代码，非常难受，突然想到之前上大学的时候，因为校园网欠费，想出来的在DO的IPv6主机上搭建VPN的招数，又想到我在实验室的电脑上长期跑着Ubuntu，灵机一动，既然这里和实验室都是CERNET，能不能用IPv6互通，从而用实验室能上网的那台机器当跳板，实现免费上网呢？

![网络结构图](http://cosmozhang1995-github-io.oss-cn-beijing.aliyuncs.com/45f37a4f-d382-11e7-bcd0-4a0001d4d5c0-ipv6-ipv4.png)

基本的网络结构就是如上，左边是我的小本本，它现在被限制只能上CERNET，中间是我在实验室的服务器，它具有双接口（严格来说是单接口双IP，一个v4，一个v6），能够访问外网，我的本本通过VPN走服务器，就可以蹭服务器的v4访问外网啦。

之前配置的是PPTP协议的VPN，但PPTP问题颇多，而且新版的 Mac OS 已经默认移除了PPTP的VPN支持，所以这次准备转投OpenVPN。

> 实际上据说 Linux 上的 pptpd 根本就是不支持IPv6的，因为其所依赖的 ppp 包不支持IPv6，但我当年确实跑通了。其实原理上来说PPP协议应该可以支持v6，只是流行的ppp包不支持罢了。可能当年用了什么黑科技吧，不记得了 :P

## 配置 OpenVPN

### 安装

首先安装openvpn，对于Ubuntu，apt已经提供了openvpn的安装包，而CentOS据说是需要源码安装的，本文以Ubutnu为例：

`sudo apt-get install openvpn`

### 配置证书和密钥

在开始使用OpenVPN之前，我们还需要生成一系列的RSA证书和密钥以供使用，OpenVPN开发了一套叫做[easy_rsa](https://github.com/OpenVPN/easy-rsa/archive/release/2.x.zip)的软件，已经提供了一系列的小工具来生成这些东西。

下载easy_rsa，并解压，进入easy_rsa工具集目录：

`wget https://github.com/OpenVPN/easy-rsa/archive/release/2.x.zip`

`unzip 2.x.zip
cd easy-rsa-release-2.x/easy_rsa/2.0`

可以`ls -l`一下看看，这里提供了一大堆的工具给你用，下面我们看看怎么用这些工具生成我们需要的东西。

首先编辑`vars`这个文件，这个文件会告诉后续的步骤你想要生成的rsa证书和密钥的配置，你也可以留作默认，编辑好之后，需要`source`一下，来使得更改生效。

`source ./vars`

这时他会提示你：NOTE: If you run ./clean-all, I will be doing a rm -rf on /path/to/easy-rsa/easy-rsa/2.0/keys

既然他让你run一遍那就run一遍吧：

`./clean-all`

然后我们来生成证书颁发机构：

`./build-ca`

这个命令会要求你输入一堆信息，你可以都直接Enter掉让他使用默认值，如果你之前配置过`vars`文件的话，你会观察到这些默认值都是你刚刚在那里配置过的，实际上，包括后面我们要运行的很多命令都是使用`vars`里面的配置当默认值。

然后生成服务端证书：

`./build-key-server server`

这里`server`是生成的服务端证书的文件名（不带后缀），可以任意取。

同时也需要生成一份客户端证书：

`./build-key client`

这里`client`是生成的客户端证书的文件名（也不带后缀），可以任意取，如果你愿意，也可以生成多份不同的证书，分发给不同的用户。

最后生成 Diffie Hellman 参数：

`./build-dh`

这里最后还需要再生成一个`ta.key`，不太清楚是干什么用的，但是没它不行：

`openvpn --genkey --secret ta.key`

现在可以`ls keys`，看一下`keys`目录下都有哪些文件：

`ca.crt`, `ca.key`：生成的颁发机构证书

`server.crt`, `server.csr`, `server.key`：生成的服务端证书和密钥

`client.crt`, `client.csr`, `client.key`：生成的客户端证书和密钥

`dh2048.pem`：生成的 Diffie Hellman 参数文件

### 配置服务端OpenVPN

新建一个OpenVPN配置文件`/etc/openvpn/server.conf`，编辑如下：

```
# OpenVPN支持2种设备模式（TUN和TAP）
# TUN运行在二层，TCP运行在3层
# 为了较好地支持IPv4，我么使用TUN
dev tun

# OpenVPN的默认协议配置是udp
# 使用TUN模式的IPv6模式，我们使用udp
proto udp6

# OpenVPN的默认端口是1194
# 但是由于某些我们都知道的原因
# 1194端口经常针对性的被干(he)扰(xie)
# 所以最好换个端口
port 11194

# 下面配置上我们刚刚生成的服务端证书信息
ca /path/to/easy-rsa/easy-rsa/2.0/keys/ca.crt
cert /path/to/easy-rsa/easy-rsa/2.0/keys/server.crt
key /path/to/easy-rsa/easy-rsa/2.0/keys/server.key
dh /path/to/easy-rsa/easy-rsa/2.0/keys/dh2048.pem

user nobody
group nogroup

# OpenVPN中，VPN实际上相当于一层路由
# 这里配置的就是路由的入口网段
# 是一个虚拟的网段，可以任意配置
server 172.16.18.0 255.255.255.0

# 以下继承OpenVPN的默认配置
persist-key
persist-tun
status /var/log/openvpn-status.log
verb 3
client-to-client
push "redirect-gateway def1"
push "dhcp-option DNS 4.2.2.1" # 这里使用一个可用的DNS即可
log-append /var/log/openvpn
comp-lzo
```

注意`server 172.16.18.0 255.255.255.0`这条，OpenVPN中，将一个VPN连接视为一层转发路由，这一配置就是配置了路由的入口网段，这是一个虚拟出的网段，所有连接到VPN的客户端都会被分配一个该网段内的虚拟地址，到达的数据包会被这条虚拟路由转发到服务器的实际接口上去。即使OpenVPN在IPv6上运行，这里仍然配置的是一个v4地址，因为OpenVPN的这个虚拟网段是只允许配置为v4的协议的。

下面启用IPv4转发：编辑`/etc/sysctl.conf`，修改`net.ipv4.ip_forward = 1`，编辑好之后运行`sysctl -p`使设置生效。

启用NAT转发：

`iptables -t nat -A POSTROUTING -s 172.16.18.0/24 -o eth0 -j SNAT --to-source 123.123.123.123`

这条配置里，`172.16.18.0/24`为源网段，就是你刚刚配置的那个虚拟网段，而`123.123.123.123`则是你服务器出口的实际IPv4地址，这样就完成了这个转发操作。

### 启动OpenVPN服务端

激动人心的时刻到了，运行：

`sudo service openvpn start`

此时OpenVPN应该可以正常启动了，启动后运行`netstat -anp | grep 11194`，看一下是否正常占用了11194端口，以确认OpenVPN确实正常启动了。

也可以配置为开机自动启动：

`chkconfig openvpn on`

---

近日在 Ubuntu 16.04 上测试发现 service 和 chkconfig 命令不太好使了，应该使用如下两条命令：

`systemctl start openvpn@server`

`update-rc.d openvpn start 20 2 3 4 5`

### 配置OpenVPN客户端

首先需要下载服务端上生成的客户端证书及密钥，还有证书颁发机构的证书，即`ca.crt`, `client.crt`, `client.key`这三个文件。

客户端的配置文件的位置依你所使用的OpenVPN客户端而决定，配置文件的基本配置如下：

```
# 设置为客户端配置文件
client

# 设备和协议，与服务端配置保持一致
dev tun
proto udp6

# 服务端地址及端口
# 这里我们愉快地配置为一个IPv6地址
# 端口要与服务端配置一致
remote 2001:1111:1111:1111:1111:1111:1111:1111 11194

# 保持默认配置
resolv-retry infinite
nobind
persist-key
persist-tun

# 配置为你存放机构证书和客户端证书、密钥的路径
ca /path/to/ca.crt
cert /path/to/client.crt
key /path/to/client.key

comp-lzo
verb 3
```

注意`remote 2001:1111:1111:1111:1111:1111:1111:1111 11194`这一句，IPv6的地址是如此地富裕，以至于一个接口往往能配置很多条IPv6地址，当你实际使用的时候，可能会遇到你发送的VPN请求的目的地址与服务端响应的源地址不一致的情况，这个时候你需要换一个合适的地址。我用的Tunnelblick客户端比较友好，报错信息里面已经显示了实际收到的源地址和期望的源地址，直接配置即可。

### 愉快地上网吧！

### 参考文献

[【教程】使用IPv6 Openvpn加速访问外国网站](https://tieba.baidu.com/p/3347619962?red_tag=2737683812)

[透过OpenVPN建立IPv4/IPv6隧道](http://blog.sina.com.cn/s/blog_130f5e21b0102wpml.html)
