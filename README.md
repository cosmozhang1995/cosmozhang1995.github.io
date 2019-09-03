cosmozhang1995.github.io
========================

GitHub Pages

# Static files

Use OSS service of `aliyun.com`. For documentation, refer to [https://help.aliyun.com/product/31815.html?spm=5176.doc32026.3.1.1gXC2g](https://help.aliyun.com/product/31815.html?spm=5176.doc32026.3.1.1gXC2g).

To upload static files, use `./bin/upload`, which is a python script.

First install python sdk `oss2`:

`pip install oss2`

Then upload the file:

`./bin/oss update /path/to/static.jpg`

This will print out the uploaded file url.

To delete a file:

`./bin/oss delete http://bucket-name.bucket-endpoint/object-name`

or

`./bin/oss delete object-name`

