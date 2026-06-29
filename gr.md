### GitHub Latest Release Assets 加速

基于Cloudflare Workers，快速获取指定的GitHub Latest Release Asset并重定向至加速链接。

#### 功能

 - 自动获取仓库最新Release的所有assets
 - 支持数字索引（如/1/）和关键词匹配（如/apk/）选择asset
 - 重定向至加速域名 d.achtlv.ccwu.cc
 - 所有请求经由Cloudflare，本地无直连GitHub

#### 用法

```
gr.achtlv.ccwu.cc/<作者>/<仓库>/<选择器>
```

 - 选择器为数字或关键词，优先作为数字，若为非纯数字，则作为关键词
 - 数字：提取列表里从上到下第n个asset（从1开始）
 - 关键词：提取第1个文件名包含该词（区分大小写）的asset

#### 示例

 - gr.achtlv.ccwu.cc/MetaCubeX/ClashMetaForAndroid/1/
 - gr.achtlv.ccwu.cc/MetaCubeX/ClashMetaForAndroid/apk/

#### 开源许可&源码

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.txt) & [源码](https://v6.gh-proxy.org/https://raw.githubusercontent.com/achtlv/achtlv.github.io/refs/heads/main/gr/worker.js)