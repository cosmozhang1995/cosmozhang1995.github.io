---
layout: post
title: 利用两台服务器建立安全的HTTP代理
pagetype: post
author: Cosmo
date: 2022-02-11 10:54:42 
---

GFW已经无孔不入，众多翻越工具纷纷躺枪。我之前介绍过[利用ocserv搭建VPN服务器的办法](/2018/04/19/deployopenconnectserveronubuntu.html)，虽然很稳定，但是需要在客户端设备上安装AnyConnect客户端，不是很方便。对于一般的HTTP访问，我们还是希望能用轻量的HTTP代理解决问题。

遗憾的是，直接通过境外HTTP代理访问禁站会导致你的客户端与代理服务端之间的连接被GFW封掉。我们猜测GFW的工作原理是这样的：首先它工作在中国互联网的出口网关处，国内客户端通往境外的流量一定会被GFW拦截处理。GFW已经能够通过各种方式识别通过流量的特征，并判断是否为非法流量，HTTP和HTTPS流量对GFW来说当然是无压力的，因此它能够轻易识别，并封禁所有这个源地址到这个目标地址的这个端口的流量。

# 方案思路

我们的思路是这样的：

首先，GFW不会监控国内流量，因此任何国内到国内的非法流量包都是不在GFW的管控范围内的，你可能会问，国内到国内会有非法流量吗？当然会，对GFW来说，非法的流量包的特征，不仅仅包括网络层和传输层的协议字段，也包括更高应用层的协议字段（例如HTTP包头、SOCKS包头等），“国内到国内”这个说法，用OSI语言来说，只能说是网络层协议的特征都是合法的，我们照样可以在合法的网络层上面搭载非法的应用层数据，这实际上就是各种应用层代理的工作原理。

既然国内流量不受管控，我们可以把HTTP代理部署到国内的服务器上，我们不管通过国内代理访问什么站点，GFW都是不会封禁我们和国内服务器的连接的。但问题是，国内服务器如果直接访问国外的非法站点，还是会被墙掉，因此我们需要另一台国外的代理，让国内代理再通过国外代理来访问目标站点。整个拓扑大概是这样的：

```
客户端 ----> 国内代理 ---[GFW]---> 国外代理 ---> google.com
```

很明显这个拓扑是有问题的，国内代理到国外代理的路径还是要经过GFW，虽然GFW不会封掉客户端和国内代理之间的连接，但是它会封掉国内代理和国外代理的连接！

解决这个问题的思路是，在国内代理和国外代理之间建立一层安全的三层协议，也就是IP隧道，然后在这个协议的基础上转发代理的请求。幸运的是，我们已经有安全的IP隧道的解决方案了，那就是**openconnect**。

现在，拓扑变成了这样：

```
客户端 ----> 国内代理 ------------> 国外代理 ---> google.com
                 |=====[GFW]=====>|

图例：
  ===  IP隧道
  ---  应用层流量
```

由于IP隧道上的流量通过GFW是安全的，因此我们成功绕过了GFW。

# 实施

## 国外代理

我们使用nginx来搭建代理。关于nginx如何搭建HTTP代理，网上有很多文章，内容基本一致，大致就是使用nginx自带的http_proxy模块。因此具体原理我们不再叙述，请读者自行百度。

不过要说明的是，nginx不能代理HTTPS请求，因为HTTPS代理的原理和HTTP代理不一样。

HTTP代理的原理非常简单，其实就是忽略HTTP包的真实Host，直接把HTTP包发送到代理服务器上，代理服务器从request line或者header中解析出真实的host，再将原包直接发送给目标站点。

而HTTPS代理比较复杂。

首先，基本的HTTPS请求大概流程如下：
1. 客户端与服务端建立TCP连接
2. 客户端发送hello消息给服务端，服务端回应给客户端自己的证书
3. 客户端校验证书合法性，并和服务端交换密钥
4. 开始发送HTTP请求，所有明文的请求和响应均通过交换好的密钥加密后再发送

这部分可以参见[这篇文章](https://zhuanlan.zhihu.com/p/27395037)。

从上面流程可以看出，只有第4步中的HTTP请求的组装过程是在HTTP协议层上进行的，而其他工作都是在TCP协议层上做的，因此HTTP协议层的代理是没法做这些工作的。

为了让HTTP协议层的代理能够正确地转发HTTPS请求，RFC规定了HTTPS代理的工作方式：
1. 客户端与代理建立正常的HTTP或HTTPS连接。这一步不论是代理HTTP请求还是代理HTTPS请求都要做。注意，客户端与代理可以建立HTTP还是HTTPS连接，与我们想通过代理转发HTTP还是HTTPS连接是无关的，也就是说我们可以通过工作在HTTP协议上的代理转发HTTPS请求，这是没有问题的。客户端与代理之间建立的连接仅用于在客户端与代理之间发送请求，这些请求可能和客户端原本要发给目标站点的请求没有区别，也可能是只有代理才认识的请求，总之是代理负责解析这些请求，而不是目标站点。因此客户端与代理之间建立HTTP连接和建立HTTPS连接的区别仅仅是客户端与代理之间如何沟通，而不影响代理和目标站点之间如何沟通。理解了这些，为了叙述方便，接下来我们都认为
2. 客户端发送CONNECT请求给代理，例如`CONNECT www.google.com`，CONNECT是RFC专门规定给HTTPS代理用的method。
3. 代理收到CONNECT请求后，与目标host建立TCP连接，并在整个客户端与代理的HTTP会话期间保持这个TCP会话
4. 客户端通过HTTP请求把实际要发送给代理的HTTPS数据载荷发送给代理，代理再把这些载荷通过上面建立的TCP会话发送给目标站，并收取目标站的响应数据，通过HTTP响应发送给客户端

这部分可以参见[这篇文章](https://zhuanlan.zhihu.com/p/28767664)。

这里面很关键的一点是CONNECT请求，nginx不能处理CONNECT请求，因此需要[ngx_http_proxy_connect_module](https://github.com/cosmozhang1995/ngx_http_proxy_connect_module)这个模块来完成这部分工作。说是一个模块，实际上还是依赖于对nginx进行一些魔改，因此我们需要编译出一个新的nginx。具体的编译方式和使用方式已经在其文档中列出了，这里不多做介绍。

最后，直接上一下nginx的配置：
```
...
http {
    server {
	    resolver 8.8.8.8;

        listen 8080 default_server;
        listen [::]:8080 default_server;

        listen 8443 ssl ssl_server;
        listen [::]:8443 ssl ssl_server;

        ssl_certificate /etc/nginx/certs/server_cert.pem;
        ssl_certificate_key /etc/nginx/certs/server_key.pem;

        server_name _;

        proxy_connect;
        proxy_connect_allow            443 8443;
        proxy_connect_connect_timeout  10s;
        proxy_connect_read_timeout     10s;
        proxy_connect_send_timeout     10s;

        location / {
            proxy_pass $scheme://$host$request_uri;
        }
    }
}
```

## IP隧道

利用ocserv搭建VPN网关的方式，已经在[之前的文章](/2018/04/19/deployopenconnectserveronubuntu.html)中介绍过了。

在我们的场景中，国外代理是VPN服务端，国内代理是VPN客户端，我们的IP隧道实际上只是给国内代理访问国外代理用的，因此我们只要允许IP隧道路由自己的网络就行了。相关的ocserv的配置是这样的：

```
ipv4-network = 192.168.130.0/24
route = 192.168.130.0/24
```

对于国外代理来说，我们只允许国内代理通过IP隧道访问自己，因此可以配置一下系统防火墙，在ubuntu上可以使用`ufw`完成：

```
ufw allow from any to 192.168.130.1 port 8080
ufw allow from any to 192.168.130.1 port 8443
```

接下来，我们来到国内代理服务器上，它需要建立与国外代理的连接。我们写了一个脚本：

```
#!/bin/bash
# connect-vpn

VPN_HOST=<国外代理的域名>

until host $VPN_HOST
	do sleep 1
done

LOG_DIRECTORY=/var/log/oc-ip-tunnel
sudo mkdir -p $LOG_DIRECTORY

sudo openconnect \
    -c <连接VPN的客户端证书> \
    -p <客户端证书密码> \
    -b \
    --pid-file=/run/oc-ip-tunnel.pid \
    $VPN_HOST:<IP隧道服务端口> \
    1> $LOG_DIRECTORY/oc.log 2> $LOG_DIRECTORY/oc.err
```

相应的也有断开连接的脚本：
```
#!/bin/bash
# disconnect-vpn

sudo kill $(cat /run/oc-ip-tunnel.pid)
```

并把它加入启动项：
```
# foreign-vpn.service

[Unit]
Description=connect to foreign vpn
After=network.target

[Service]
Type=forking
ExecStart=/path/to/connect-vpn
ExecStop=/path/to/disconnect-vpn
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
```

然后运行`sudo systemctl enable foreign-vpn.service`启用这个启动项，即可。

## 国内代理

ngx_http_proxy_connect_module模块的问题是，它不能作为中转的代理，将CONNECT请求中转到另一个代理上去。实际上，ngx_http_proxy_module的proxy_pass命令也不会中转代理，尽管有upstream的概念存在，但它是不管upstream到底是另一个代理（即自己是中转代理）、还是真实的服务器（即自己是反向代理）的。只不过，对于HTTP代理来说，代理只需要无脑转发原请求包即可。但对于HTTPS代理来说，中转代理和最终代理逻辑是不同的：最终代理需要处理CONNECT请求，与目标host建立TCP连接，而中转代理需要把CONNECT请求原样发送给下一跳代理。这个问题详见[ngx_http_proxy_connect_module issue #210](https://github.com/chobits/ngx_http_proxy_connect_module/issues/210)。

当然，我们可以修改ngx_http_proxy_connect_module的逻辑，给他加上中转代理的功能；亦或者直接修改nginx代码，使proxy_pass能传递CONNECT请求。不过，这里我们采用了一种更简单的方式，即直接使用nginx的stream模块：
```
stream {
    server {
        listen 8080;
        proxy_pass 192.168.130.1:8080;
    }
}

http {
    ...
}
```

注意，stream模块可能需要重新编译安装nginx，在编译时加上stream模块的选项：
```
./configure --with-stream
```

这样，国内代理就直接工作在四层协议上，将四层数据原封不动地通过IP隧道转发给国外代理了。

> 实际上stream就是我们所谓的透明代理。而我们上面讨论的HTTP代理和HTTPS代理其实都是中间人代理。透明代理和中间人代理的区别是：透明人代理不解读代理的内容，而中间人代理需要对代理内容进行解读和处理。使用透明代理的好处是，代理逻辑简单，安全问题少；而中间人代理虽然逻辑复杂，但能够针对代理的内容作更多的针对性处理，例如可以在代理服务器上解析目标站点的域名（在我们的场景中这是很有用的）。
