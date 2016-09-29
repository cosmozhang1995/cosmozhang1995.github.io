---
layout: post
title: 在新浪SAE上部署高版本django
pagetype: post
author: Cosmo
---

新浪SAE加入python支持已经有一年多了吧，但是目前好像只能支持到1.5版本，然而最新的django都已经出到1.10了啊亲！那么如果我们想部署一个高版本的django到SAE上面怎么办呢？这里我分享一个我的实战经历，希望需要的小伙伴们可以从中找到一些有用的线索。

### 关于项目背景

最近开发了一个微信端的小网页，为了图快，就用了Django，Django果然是快，一夜的时间就搞定了～

然而，跟客户对接部署的时候，悲剧发生了。客户啥也不懂，他们并没有自己的域名，等域名申请备案，最起码也得个把月吧，这个时间客户可等不了，咋办呢。我突然想到早已多年没用过的SAE，听说SAE去年开始支持python了啊，而且我记得SAE会给一个三级域名，这不就妥啦～

说干就干，马上给SAE里面充了一块钱（恩没错就是一块钱，我才不会把我的钱都给这种辣鸡云呢），开始迁移。首先看看SAE的文档吧，嗯，文档似乎很简单，只要加一个`config.yaml`配置文件和一个`index.wsgi`就好啦。文档链接：[<fakeholder target="_href"></fakeholder>https://www.sinacloud.com/doc/sae/python/tutorial.html#shi-yong-web-kai-fa-kuang-jia](https://www.sinacloud.com/doc/sae/python/tutorial.html#shi-yong-web-kai-fa-kuang-jia)（shit！我能吐槽它这个锚点名称还是拼音吗！差评！）。

### 问题来了

那么问题来了，文档里面是用 django 1.2.7 演示的，而最高支持到的 django 版本也只到了 1.4，那我要部署一个高版本的 django　项目肿么办呢！要知道现在django可是都已经支持到1.10版本了啊！新浪并没有给出一个可行的解释办法，于是我首先尝试了一下直接强行挂django1.10的项目，结果不出意外的fail了：

![](http://p1.bqimg.com/4851/d1bef89b92f403e6.png)

### 解决思路

这显然是django出事了，怎么办呢，有问题，找度娘，百度后发现，似乎大家也都没有什么优雅的解决办法，唯一的办法就是，把高版本的django库直接从系统的django库拷到项目的目录里面，然后在`index.wsgi`或者`proj_name/wsgi.py`里面（`proj_name`为你的项目名称）把库的目录加到sys目录中去：

{% highlight python %}
# 修改过的 wsgi.py 入口文件
import os
import sys

root = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(root, '..', 'site-packages'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "proj_name.settings")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
{% endhighlight %}

以上，可以参见这篇博客：[<fakeholder target="_href"></fakeholder>http://www.cnblogs.com/weberypf/p/4274199.html](http://www.cnblogs.com/weberypf/p/4274199.html)

这里可能需要介绍一下，如何找到你的django库放在哪。我用的是linux系统，pip安装的django，不过python的包管理还是挺混乱的（至少Linux上挺混乱的），跟版本、环境、工具等等都有关系，最简单的办法是，直接全局搜索django，使用这个命令：`find / -name django`。

![](http://p1.bpimg.com/4851/bf18fb60dab52ae7.png)

> 这里需要跟新手们强调一下，一定要`sudo`或用根用户执行，不然你可能会得到一堆蛋疼的“permission denied”之类的警告输出。

可能会搜出来很多，这里说一下怎么辨别那个是真正的django的目录，一般python的包都安装在python的某个安装路径或是库路径下的`site-packages`或者`dist-packages`路径下，所以你看凡是父目录是这两个名字的，一般就对啦。当然，还有可能你同时安装了多个python版本，每个版本都有相应的django包，那你还需要看看到底是不是在对应的python版本的目录下。

好啦，可以看到，我的django位于`/usr/local/lib/python2.7/dist-packages/django`，我用的python2.7，所以它在`python2.7/dist-packages`中。一般python库都是一个目录（很少有一个库只有一个.py文件的）。那么，我们在我们的项目目录下建立一个文件夹，比如就叫`site-packages`吧，然后把整个django目录复制到这个`site-package`里面去。然后在我们的入口文件`proj_name/wsgi.py`中，将这个`site-packages`目录加入到sys路径里面去，python在查找包的时候就会从这个目录里面去查找了：

{% highlight python %}

root = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(root, '..', 'site-packages'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "proj_name.settings")

{% endhighlight %}


#### 转换数据库

好的，那么我们现在可以进入Django了，然而，问题继续：

![](http://p1.bqimg.com/4851/5ca464daba30625d.png)

啊，无法加载 pysqlite2 或 sqlite3 模块！咋回事呢～想了一下，我为了最大化的图方便，直接用了django默认的sqlite数据库，省去了自己建库的麻烦（没错我就是这么懒 = = ）。但素！蛋疼的新浪当然不会支持sqlite啦，所以怎么办？老办法，咱们把sqlite库也拷进去不就好啦～

于是继续搜索sqlite3，结果发现了一个诡异的现象：

![](http://p1.bqimg.com/4851/bd34bdd36c628668.png)

哎呀，怎么django的目录里面就有了sqlite3呢！其实并不奇怪，django总需要sqlite3作为默认数据库引擎的啊。不过奇怪的是，我明明已经有了django自带的sqlite3了，为什么还是不好使呢？具体原因我不是很清楚，不过我猜想，可能是因为SAE的文件系统对写文件进行了限制，导致程序创建或修改本地的文件是没有权限的。

那即然这样，我们只好老老实实的用新浪支持的MySQL咯。好在在新浪上用MySQL还是蛮容易的。首先在SAE控制台中建立你自己的MySQL数据库，具体方法就不说了，独立型和共享型视你的预算和需求而定。然后修改`proj_name/settings.py`，将原来使用sqlite3的配置

{% highlight python %}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

{% endhighlight %}

改成使用MySQL的配置：

{% highlight python %}

import sae.const

DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.mysql',
        'NAME':     sae.const.MYSQL_DB,
        'USER':     sae.const.MYSQL_USER,
        'PASSWORD': sae.const.MYSQL_PASS,
        'HOST':     sae.const.MYSQL_HOST,
        'PORT':     sae.const.MYSQL_PORT,
    }
}

{% endhighlight %}

这段代码在上面提到的[<fakeholder target="_href"></fakeholder>SAE文档](https://www.sinacloud.com/doc/sae/python/tutorial.html#shu-ju-ku-de-zhu-cong-du-xie)中有例子。SAE中使用数据库还是非常简单的，在PHP中，数据库参数是作为宏预定义好的，现在在python中，也已经在`sae.const`包中预定义了相应的常量，只要拿来用就好，非常方便，也不容易出错。

#### 迁移数据库

下面要迁移数据库，将原来的SQLite中的数据迁移到新的MySQL数据库中。有人问，我不迁移，直接重新建库可好？可以，没问题，SAE的MySQL是提供了基于PHPMyAdmin的管理界面的，然而，django有着自己的一套独立的数据库的管理体系，django官方给出的建立数据库的做法是编写`models.py`文件，并通过syncdb（在高版本中是migrate）来管理数据库的结构，django提供了一些工具能够自动帮我们在数据库中生成相应的scheme，此外我们可以使用django的admin模块来管理数据库中的数据（也就是大家熟知的CRUD操作）。所以，如果你自己建库的话，你必须非常清除和了解django的数据库结构规范，这是一件挺难也挺累的事情。

那么如何迁移呢，老手们当然可以提出很多方法，我就不一一细说。[<fakeholder target="_href"></fakeholder>SAE的文档](https://www.sinacloud.com/doc/sae/python/tutorial.html#ru-he-syncdb-dao-xian-shang-shu-ju-ku)提供了一种在本地和SAE间同步数据库的方法，如果你有兴趣可以参见文档操作，不过文档同时指出“本 feature 还在开发中，目前还很 buggy。”，所以是否采用这种方法，你可能要考虑一下。

我为了避免bug，直接放弃了这个方法，采用手动导出和导入的方法。使用django的dbshell，或者sqlite命令行界面，可以轻松完成导出操作，只需要一行命令：

`sqlite3 db.sqlite3 .dump > db.sql`

这会将`db.sqlite3`这个数据库中的结构和数据全部导出到`db.sql`文件中，然后再在SAE的PHPMyAdmin界面中导入这个文件即可，导入的时候注意以下几点：

1. SQLite导出的sql文件前两行的`PRAGMA foreign_keys=OFF;`、`BEGIN TRANSACTION;`和最后一行的`COMMIT;`不是MySQL语法，因此需要将这几句删掉。
2. SQLite导出的sql语句中，`AUTOINCREMENT`关键字在MySQL中的写法是`AUTO_INCREMENT`，需要替换一下。
3. SQLite中，表名和字段名都是用双引号`"`引起来的，但是在MySQL中，需要用反引号`` ` ``引起，也可以不引，但不准用双引号。这里注意替换。
4. SQLite导出的sql文件中有关于`sqlite_sequence`这个表的语句是针对目标SQLite数据库的，这里全部注释掉。

然后系统就work啦～

#### admin界面的静态文件

刚开始的时候，admin界面会非常丑，这是因为SAE没有帮你做静态文件的路由，而Django本身的`STATIC_URL`设置在SAE中不起作用，解决方式如下：

修改 settings.py 中的 STATIC_ROOT 为应用目录下 static 子目录的绝对路径。

运行 python manage.py collectstatic 将静态文件收集到应用的 static 子目录下。

修改 config.yaml ，添加对 static 文件夹下的静态文件的 handlers。

{% highlight yaml %}
handlers:
- url: /static
  static_dir: path/to/mysite/static
{% endhighlight %}

贴一张系统终于work了的图吧～

![](http://p1.bqimg.com/4851/5c410b0f58858204.png)

#### 一些其他的BUG

我这个项目是一个微信端网页，后端需要调用微信API，这里我是用python的requests库来完成的，非常方便。但是，如你所想，SAE也是没有提供这个库的支持的，所以你必须自己把这个库引进来，还是老办法，把它加进到项目目录下的`site-packages`目录下就好了，如果你之前没有把`site-packages`加入到sys路径下，那么你还要按照刚刚的方法把它加入到sys路径下。

另外requests库也依赖两个其他的库，chardet和urllib3，同样方法即可解决。

#### requests库的BUG

在解决requests库的问题的时候，发现加入了requests库后，发生了新的BUG，`cannot load name certs`。排错发现这个问题发生在requests库的`utils.py`的第24行，这一行想要导入同目录的`certs.py`文件：`from . import certs`，但是失败了。排查`certs.py`发现，这个程序很短，只有短短几行，其中关键是`where()`函数，似乎是返回了一个`.ca`文件的路径：

{% highlight python %}

def where():
    """Return the preferred certificate bundle."""
    # vendored bundle inside Requests
    return '/etc/ssl/certs/ca-certificates.crt'

{% endhighlight %}

看到它的返回值，大家已经猜到了问题在哪，没错，它返回了一个固定的路径，然而，SAE的文件系统比较特殊，那么在SAE系统中到底有没有这么一个文件呢？即使有，我们有没有权力读取它呢？这是个值得质疑的事情，于是我把这个`ca-certificates.crt`文件也拷进了项目目录下的`site-packages`目录里，并且让这个函数返回项目目录下的这个文件路径：

{% highlight python %}

root = os.path.split(os.path.realpath(__file__))[0]
cert_file_path = os.path.join(root, 'ca-certificates.crt')

def where():
    """Return the preferred certificate bundle."""
    # vendored bundle inside Requests
    return cert_file_path

{% endhighlight %}

不过这样改过之后，问题依旧，没办法，于是只好Google之，发现这居然还是requests库很著名的一个BUG，不过据说只有在你从github上下载的requests库中才会发生，而且在2.2.1版本后已经修正了这个BUG。可是我就是2.2.1版本啊，而且我是pip安装的啊，而且我本地跑的没有任何问题，只是上了SAE之后就无法加载这个模块了，很奇怪。这个issue的链接在这里：

[<fakeholder target="_href"></fakeholder>https://github.com/kennethreitz/requests/pull/2026](https://github.com/kennethreitz/requests/pull/2026)

看回到`utils.py`的第24行，`from . import certs`，github上的那个issue有提到说这个BUG可能是由于python2的杂乱的模块搜索机制导致的，于是，我可不可以不这么import呢？我把这句改成了`import certs`，然后，问题解决了！解决了……好吧，也许可能就是那个原因吧。






















