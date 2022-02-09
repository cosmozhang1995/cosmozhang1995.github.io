---
layout: post
title: systemctl简易教程
pagetype: post
author: Cosmo
date: 2022-02-09 14:51:53 
---

systemctl是目前几个主流linux都推荐的服务管理工具，这里记录一下systemctl的实用教程。本教程基于 Ubuntu 20 系统。

# 什么是systemctrl

systemctl是目前几个主流linux都推荐的服务管理工具，它提供了统一的管理linux守护进程的接口。

在systemctl之前，我们习惯于使用service来管理服务，目前，Ubuntu中已经将大部分的service重定向到systemctl了，这意味着，如果你在Ubuntu上修改`/etc/init.d/`中的服务脚本（也就是`service`加载的那些服务），会发现没有什么作用。查看脚本一般可以看到这样一条语句：`. /lib/lsb/init-functions`，在这个子程序中，命令被重定向为使用systemctl了。

# 如何使用

很简单：

```shell
systemctl <command> <service>
```

其中，`service`为具体的服务名称，`command`为要对此服务进行的操作，常见的有：
- `start`：启动
- `stop`：停止
- `restart`：重新启动
- `enable`：设置开机自启
- `disable`：取消开机自启

# 如何自定义一个服务

自定义的服务，都位于`/usr/lib/systemd/system`下，一般以`.service`为后缀。

我们可以自建一个`xxx.service`文件，这就对应了一个自建的服务，文件名就是服务名。

service文件实际上是对此服务的一个配置文件，我们可以参考一下其他的配置。这里我们参考一下nginx的配置：

```conf
[Unit]
Description=A high performance web server and a reverse proxy server
Documentation=man:nginx(8)
After=network.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/local/nginx/sbin/nginx -t -q -g 'daemon on; master_process on;'
ExecStart=/usr/local/nginx/sbin/nginx -g 'daemon on; master_process on;'
ExecReload=/usr/local/nginx/sbin/nginx -g 'daemon on; master_process on;' -s reload
ExecStop=-/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 --pidfile /run/nginx.pid
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
```

可以看到，配置文件分了几个部分。

Unit部分，定义了服务的基本信息，其中After比较重要，定义了服务的依赖顺序，也就是当前服务应该依赖哪个服务。

Service就是服务的具体定义了，我们说明几个关键项：
- Type：进程类型，常用的选择有：
  - `simple`：认为`ExecStart`命令的主进程就是服务进程，`ExecStart`命令会在服务进程结束后才退出。也就是说，如果你的`ExecStart`命令在服务进程结束之前退出的话（参见`forking`的情形），你会发现systemctl会在`ExecStart`命令退出后主动杀死服务进程。
  - `forking`：认为`ExecStart`命令只是一个单纯的启动命令，服务进程是由`ExecStart`命令fork出去的，且`ExecStart`命令的主进程会在服务进程启动后退出。
- PIDFile：存储进程号的文件
- ExecStart：启动命令，对此命令会有一些要求，参见`Type`配置项

Install部分，在WantedBy中定义了服务应该在哪个启动级别下加载。

完整的配置文件的说明，可以参见[这篇文档](https://www.freedesktop.org/software/systemd/man/systemd.service.html)。

注意，如果你修改了一个服务配置文件，你需要调用`systemctl daemon-reload`来重新加载所有的服务。

# 如何令服务开机启动

```shell
systemctl enable <service>
```

此命令实际上是在`/etc/systemd/system/`下对应服务启动级别的目录里，创建一个软链，指向`/lib/systemd/system/<service>`。系统启动时，会从`/etc/systemd/system/`下对应当前启动级别的目录里，加载所有的服务配置并按照依赖顺序拉起它们。

> 注意：网上某些文章说，自定义开机自启服务只要在`/etc/systemd/system/`下创建对应的服务配置文件就可以了。这种方法其实是**不正确**的！应该按照上述方法，在`/lib/systemd/system/`下创建服务文件，在通过`systemctl enable`来把它加载进`/etc/systemd/system/`中。