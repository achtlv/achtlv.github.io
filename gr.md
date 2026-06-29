### GitHub Latest Release Assets 加速

基于Cloudflare Workers，快速获取GitHub最新 Release Assets并重定向至加速链接。

#### 功能

 - 自动获取仓库最新Release的所有assets
 - 支持数字索引（如/1/）和关键词匹配（如/apk/）选择asset
 - 重定向至加速域名 d.achtlv.ccwu.cc
 - 所有请求经由Cloudflare，本地无直连GitHub

#### 用法

```
gr.achtlv.ccwu.cc/<作者>/<仓库>/<数字或关键词>
```

 - 数字：第3部分优先作为数字，提取列表里从上到下第n个asset（从1开始且默认为1）
 - 关键词：若第3部分为非纯数字，则提取第1个文件名包含该词（区分大小写）的asset

#### 示例

 - gr.achtlv.ccwu.cc/MetaCubeX/ClashMetaForAndroid/1/
 - gr.achtlv.ccwu.cc/MetaCubeX/ClashMetaForAndroid/apk/

#### 许可证

AGPL-3.0