CppScript 语法规范 v14.1（完整版）

语言：CppScript　｜　版本：v14.1　｜　规则文件：任意文本（≤ 100 KB）
面向 C++ 用户，无编译期、无指针、无头文件、无宏。
核心：main 的 return 只返回 URL，body 输出统一用 out 且实时流式推送。
v14.1 变更：?url=（规则，不要求 .txt）、?in=（输入流）、out 流式渲染。

---

目录

1. 基础
2. 类型系统
3. 变量与作用域
4. 运算符
5. 语句
6. 函数与 return
7. 原生数组
8. 容器
9. struct
10. 引用
11. 输入流
12. 内置函数
13. 内置变量
14. 执行限制与错误
15. 完整示例
16. 常见坑

---

1. 基础

1.1 文件结构

· 单个 UTF-8 文本（不要求扩展名是 .txt，.md .json .rule 都可以）
· 通过 ?url= 拉取，大小 ≤ 100 KB
· 语句以 ; 分隔
· 标识符 [A-Za-z_][A-Za-z0-9_]*，区分大小写
· 注释：// 单行、/* 多行（不嵌套） */
· 关键字、类型名小写

1.2 版本号

文件顶部可选：

```c
// dsl: 14
```

· 不写 → 默认按最新版本（当前 v14）解析
· 写了不支持的版本（如 // dsl: 99）→ E41

1.3 关键字

```
number  string  bool  auto  void  struct
if  else  switch  case  default
for  while  break  continue
return  delete  in  out  getchar
true  false
with  param  header  proxy  UA
```

1.4 最小示例

```c
void main() {
    return "https://example.com/latest.zip";
}
```

1.5 访问方式

```
https://cppscript.<你的子域>.workers.dev/?url=<规则文件URL>&key=<密钥>
```

参数 说明
?url= 规则文件 URL（必填，任意文本）
?in= 输入流（可选，URL 或文本）
?key= 敏感参数（可选，映射到内置变量 key）

---

2. 类型系统

2.1 类型一览

类型 字面量 说明
number 42 3.14 -2 双精度浮点
string "abc" 'abc' 单双引号等价
bool true false 
auto — 仅声明用，非真实类型
deque<T> — 双端队列容器
set<T> — 去重集合容器
map<K, V> — 键值映射容器
struct 名 — 自定义结构体（可嵌套）
T a[n]... — 原生数组（最高 4 维）
T& — 引用
void — 仅函数返回类型

没有：整型/浮点区分、char、指针、枚举、联合、nullptr、引用返回值。

2.2 隐式转换

场景 规则
+ 任一侧 string 转 string 拼接（1 + "a" → "1a"）
== != 类型不同 都转 string 比较
< > <= >= 任一侧 string → 字典序；都 number → 数值
赋值给 bool 0 → false，非零 → true；"" → false，非空 → true
&& \|\| ! if (x) 0/""/false → false，其余 → true
bool 参与算术/位运算 true → 1，false → 0

2.3 算术语义

表达式 结果
7 / 2 3.5（浮点除法）
-7 / 2 -3.5
7 % 2 1
-7 % 2 -1（余数符号同被除数）
7 % -2 1
x / 0 x % 0 运行时 E34

整数除法用 floor(7 / 2) = 3。

---

3. 变量与作用域

3.1 标量（可无初值）

```c
number n = 1;
string s = "abc";
bool   b = true;
number x;                 // 未初始化（合法）
```

· 可写：x = 5; → 已初始化
· 不可读：参与任何表达式 → 运行时 E36
· 全局、局部同规则

3.2 auto 推导

初始化器 结果
数字字面量 number
字符串字面量 string
bool 字面量 ✗ E25
变量 auto x = y; = y 的类型（含 bool/struct/容器）
函数调用 auto x = f(); = f 返回类型（f 不能 void）
a + b 两侧 number → number；否则 → string
a - b a * b a / b a % b number
比较 / 逻辑表达式 ✗ E25
容器 / struct 字面量 ✗ E25
无初值 auto x; ✗ E25

3.3 全局变量

函数外部声明的变量是全局变量，函数内可读写。

3.4 作用域

· 函数外 → 全局；函数内 → 函数；{ } → 块
· 内层可遮蔽外层
· 循环体内声明的变量每次迭代独立

3.5 delete

```c
delete x;                 // 删变量
delete a[i];              // 等价 a.erase(i)
delete m["key"];          // 等价 m.erase("key")
delete a;                 // 删数组 / 容器 / 容器组
delete r;                 // 只删引用，原变量保留
```

函数参数不能 delete（E35）。

---

4. 运算符

4.1 优先级（C 风格，从高到低）

级 运算符 结合
1 () [] . 后缀 i++ i-- 左
2 ! ~ -（一元） 前缀 ++i --i 右
3 * / % 左
4 + - 左
5 << >> 左
6 < <= > >= 左
7 == != 左
8 & 左
9 ^ 左
10 \| 左
11 && 左（短路）
12 \|\| 左（短路）
13 = += -= *= /= %= <<= >>= &= ^= \|= 右

4.2 位运算

运算符 说明
a & b 按位与
a \| b 按位或
a ^ b 按位异或
~a 按位取反（~a == -(a+1)）
a << n 左移
a >> n 右移（算术右移）

操作数必须是整数 number（x == floor(x)），值域 [-2^31, 2^31-1]，否则 E34。

4.3 自增自减

表达式 返回 说明
i++ 旧值副本（右值） i 加 1
i-- 旧值副本（右值） i 减 1
++i 引用（新值） i 先加 1
--i 引用（新值） i 先减 1

· ++i / --i 返回引用，可链式：++(++i) ✓、(++i) = 5 ✓
· i++ / i-- 返回右值：(i++)++ ✗ E45、(i++) = 5 ✗ E46

4.4 bool 的 ++ / --

全部定义为取反（b = !b）：

```c
bool b = true;
bool old = b++;        // old = true,  b = false
bool nw  = ++b;        // b = true,    nw  = true
```

4.5 复合赋值

运算符 适用类型
x += y number、string（拼接）、bool
x -= y x *= y x /= y x %= y number、bool
x <<= n x >>= n x &= y x \|= y x ^= y number、bool（整数）

· 返回左值引用，可链式：(a += 1) *= 2 ✓
· string 只支持 +=，其他 → E11
· 位运算操作数必须整数 → E34

4.6 bool 的复合赋值

流程：b 转 number（true=1）→ y 转 number → 运算 → 非零转 true → 赋回。

```c
bool a = true;
a += 1;                // true
a -= 1;                // false
a -= 1;                // true（0-1=-1 非零）
```

---

5. 语句

5.1 if / else

```c
if (cond) { ... }
else if (cond2) { ... }
else { ... }
```

5.2 switch

```c
switch (x) {
    case 1: out("one"); break;
    case 2:
    case 3: out("two-or-three"); break;
    default: out("other");
}
```

· x 可为 number 或 string；case 值必须是字面量
· C 风格 fallthrough；break 跳出

5.3 for / while

```c
for (number i = 0; i < n; i++) { ... }
while (cond) { ... }
```

单循环上限 10 000 次。

5.4 范围 for

```c
for (auto x in arr) { out(to_str(x)); }              // deque/set/一维数组
for (string k in m) { out(k + " = " + to_str(m[k])); }  // map：迭代变量是 key
```

容器组 / 多维数组不支持（E30）。

5.5 break / continue

只在循环内有效。

---

6. 函数与 return

6.1 辅助函数

```c
number add(number a, number b) { return a + b; }
void log(string msg) { out(msg); }
```

· 返回类型显式声明，参数类型显式（不能 auto）
· 不支持：重载、默认参数、可变参数、函数指针、匿名函数、引用返回值
· 递归深度上限 100
· 前向引用允许
· 有返回类型函数所有路径必须 return（E18）

6.2 void main()

必须显式写 void，恰好一个，无参数。不写 void → E14。

6.3 主函数 return

主函数 return 只能返回 URL，body 输出统一用 out。

合法形式：

写法 响应
return "https://example.com/a.zip"; 302
return "example.com/a.zip"; 302（补 https）
return "中文.com/文件.zip"; 302（补 https + punycode + 路径编码）
return "abc.onion/file.zip"; 302（补 http）
return "abc.i2p/download"; 302（补 http）
return "url" with 301; 301
return with 404; 404 + 输出（或流式 200，见 §6.4）
return 404; 404 + 输出
return; 200 + 输出
自然结束 200 + 输出

禁止形式：

写法 错误
return "hello world"; E43（host 含空格）
return "hello" with 200; E44（body 只能 out）
return ""; E43

URL 规范化流程：

```
1. raw 为空 → E43
2. 解析协议头：http:// 或 https:// 开头（大小写不敏感）→ 协议 + rest
3. 从 rest 提取 host（到第一个 '/' 或 ':' 之前）
4. host 非法字符检查：空白、控制字符、< > " { } | \ ^ [ ] ` @ # ? → E43
5. 端口检查：必须是 1..65535 的整数，否则 E43
6. 协议未定：host 以 .onion / .i2p 结尾 → http，否则 → https
7. new URL(protocol + '://' + rest) → 失败 → E43
8. 返回 url.href（IDN 自动 punycode，路径自动编码）
```

示例：

字符串 结果
"example.com/a.zip" https://example.com/a.zip
"中文.com/文件.zip" https://xn--fiq228c.com/%E6%96%87%E4%BB%B6.zip
"例子.中国/a" https://xn--fsqu00a.xn--fiqs8s/a
"abc.onion/file.zip" http://abc.onion/file.zip
"abc.i2p/download" http://abc.i2p/download
"example.com/a b.zip" https://example.com/a%20b.zip
"hello world" E43（host 含空格）
"" E43

6.4 out 与流式渲染（v14.1 核心）

out 是唯一 body 输出通道，且是实时流式推送。

6.4.1 双路响应

脚本行为 响应模式
从未调用 out buffer 模式：脚本执行完后，按 return 决定 302 / 200+body
调用过 out（至少一次） 流式模式：第一次 out 时立即返回 200 + ReadableStream，后续每次 out 实时推送

6.4.2 buffer 模式（未调 out）

```c
void main() {
    return "https://example.com/a.zip";     // 302
}

void main() {
    return with 404;                        // 404（空 body）
}

void main() {
    return;                                 // 200（空 body）
}
```

6.4.3 流式模式（调了 out）

```c
void main() {
    out("step 1\n");      // 客户端立即收到
    // ... 耗时操作
    out("step 2\n");      // 客户端立即收到
    out("step 3\n");      // 客户端立即收到
    return;               // 关闭流
}
```

· 响应状态码固定 200
· Content-Type: text/plain; charset=utf-8（固定）
· return with N / return N 中的 N 被忽略（已经 200 了）
· return "url" → E47：流式模式下不能重定向，末尾追加 [E47: cannot redirect after out()]
· 出错时：流末尾追加 [error: <message>] 并关闭连接

6.4.4 对比

场景 buffer 模式 流式模式
return "url" 302 E47 提示追加末尾
return with N N + body 200（N 忽略）
return; / 自然结束 200 + body 200（已推送完）
输出时机 一次性 逐 chunk
Content-Type 可自定义（with header） 固定 text/plain

6.4.5 何时用流式

· 长耗时脚本：用户想看到进度
· 大输出：不想全缓冲在内存
· 否则不调 out，享受 buffer 模式的灵活性（302 / 自定义状态码）

6.5 引用参数

```c
void addOne(number& x) { x = x + 1; }
void appendTo(deque<string>& arr, string v) { arr.push_back(v); }
```

调用时传左值，传字面量 → E33。

---

7. 原生数组

7.1 声明

```c
number a[5];                 // 5 个 number，默认 0
string b[3];                 // 3 个 string，默认 ""
Asset  d[4];                 // 4 个 Asset

number e[n];                 // n 必须已初始化（否则 E36）

number m[3][4];              // 3×4 二维
string t[2][3][4];           // 2×3×4 三维（最高 4 维）
```

· 元素类型：number / string / bool / struct 名
· 不支持元素类型是 deque / set / map
· 大小必须是已初始化的 number 变量或字面量
· auto a[5]; → E25

7.2 访问与遍历

```c
number a[5];
a[0] = 10;
out(to_str(a[2]));           // 0

number m[3][4];
m[1][2] = 99;

for (auto x in a) { out(to_str(x)); }              // 一维可范围 for
for (number i = 0; i < 3; i++) {
    for (number j = 0; j < 4; j++) {
        m[i][j] = i * 4 + j;
    }
}
```

越界 → 运行时 E23。

7.3 限制

· 无容器方法（push/pop/insert/erase/find/fill/clear）→ E32
· 元素只能通过下标读写
· delete a; 释放整个数组；delete a[i]; 不支持

7.4 声明方式对比

声明 是什么
number a[5]; 原生数组，固定 5 个元素
deque<number> a; 动态容器
deque<number> a(5); 容器，初始 size=5，可 push/pop
deque<number> a[5]; 容器组（5 个独立空容器）
number m[3][4]; 原生二维数组

---

8. 容器

8.1 三种容器

类型 说明
deque<T> 双端队列，可重复，支持下标
set<T> 去重，按插入顺序，支持下标
map<K, V> 键值映射

· deque/set 的 T ∈ number / string / bool / auto / struct 名
· map 的 K ∈ number / string；V ∈ number / string / bool / struct 名
· 不支持嵌套 → E19

8.2 声明

```c
deque<number> a = { 1, 2, 3 };
set<string>   s = { "x", "y" };
deque<number> b;              // 空
deque<number> c(5);           // size=5，元素全 0

map<string, number> m;                        // 空
map<string, number> m2 = { "a": 1, "b": 2 };  // 字面量
```

8.3 deque / set 成员

成员 返回 说明
d[i] T 下标访问，越界 E23
d.size() number 元素个数
d.find(v) number 第一个等于 v 的下标，不存在 -1
d.front() / d.back() T 空 E23
d.push_back(v) / d.push_front(v) void 
d.pop_back() / d.pop_front() void 
d.erase(i) void 删下标 i
d.insert(i, v) void 在下标 i 处插入
d.clear() void 清空
d.fill(v) void 全部填 v

set 区别：push_back / push_front / insert 时若 v 已存在则无操作；fill(v) 后只有 1 个元素。

8.4 map 成员

成员 返回 说明
m[k] V 读：存在返回 value，不存在返回 V 默认值（不插入）
m[k] = v — 写：存在则改，不存在则插入
m.size() number 键值对数量
m.has(k) bool 键是否存在
m.erase(k) void 删除键（不存在则无操作）
m.clear() void 清空
m.keys() deque<K> 所有键（按插入顺序）
m.values() deque<V> 所有值（按插入顺序）

map 不能用整数下标 → E42。

```c
map<string, number> stats;
stats["apple"] = 10;
stats["apple"] = 15;         // 覆盖
out(to_str(stats["cherry"])); // 0（不存在返回 V 默认值）
for (string k in stats) {
    out(k + " = " + to_str(stats[k]) + "\n");
}
```

8.5 容器组 deque<T> a[n]

```c
deque<string> groups[3];      // 3 个独立空 deque
groups[0].push_back("apple");
groups[0][0];                 // "apple"
```

· 组本身不可 push/pop/clear/fill/insert/erase（E31）
· 范围 for 不支持（E30）

---

9. struct

9.1 定义

```c
struct Version {
    string tag;
    number major;
};

struct Release {
    Version version;         // 嵌套 struct
    string downloadUrl;
};
```

· 字段类型：number / string / bool / auto / 另一个已定义的 struct 名
· 被嵌套的 struct 必须在当前 struct 之前定义
· 禁止循环引用 → E40
· 嵌套深度上限 8 层
· 字段默认值：number=0，string=""，bool=false，struct=字段全默认

9.2 使用

```c
Release r;
r.version.tag = "v1.0.0";
r.url = "https://example.com/v1.0.0.zip";

Version v = { "v2.0.0", 2 };
Release r2 = { v, "https://example.com/v2.zip" };
Release r3 = { { "v3.0.0", 3 }, "https://example.com/v3.zip" };  // 嵌套字面量
```

---

10. 引用

10.1 基本用法

```c
number x = 10;
number& r = x;             // r 绑定 x
r = 20;                    // x 也变成 20
```

10.2 规则

· 声明时必须初始化，右侧必须是左值
· 绑定后不可重绑
· 支持类型：number& string& bool& auto& struct& deque<T>& set<T>& map<K,V>&
· 不支持：引用返回值、引用引用、const T&、数组引用、容器组引用
· number& r2 = 5; → E33

10.3 delete 引用

```c
delete r;                  // 只删引用，x 保留
```

10.4 引用作为参数

```c
void addOne(number& x) { x = x + 1; }
void appendTo(deque<string>& arr, string v) { arr.push_back(v); }
void bump(map<string, number>& m, string k) { m[k] = m[k] + 1; }
```

---

11. 输入流

11.1 输入流来源优先级

1. ?in=（最高优先）
2. 否则 POST / PUT / PATCH 的 body
3. 否则空（GET 无 ?in=）

11.2 ?in= 规则

```
1. 读取 ?in= 的值（URL 解码后）
2. 若值匹配 ^https?://（大小写不敏感）
   → 远程 GET 拉取，响应体原文作为输入流
   → 4xx/5xx → E50
   → 大小超 1 MB → E51
   → 过 SSRF 检查（E27）
3. 否则
   → 值本身直接作为文本输入流
   → 大小超 1 MB → E51
```

URL 输入流内容
?in=https://example.com/data data 全文
?in=hello%20world "hello world"
?in=%E4%B8%AD%E6%96%87 "中文"
?in= ""（空文本）
无 ?in= + POST body body 全文

注意：& 是 URL 参数分隔符，文本里不要有 &。

11.3 游标

输入流有一个读取游标，初始在位置 0。getchar() 和 in() 共享同一个游标。

11.4 getchar()

```c
number c = getchar();
```

· 读到字符：返回该字符的 Unicode code point
· 已到 EOF：返回 -1
· 不跳过空白，不影响 in 的跳过空白行为
· 每次调用游标前进 1

11.5 in(x)（cin 风格）

```
1. 跳过前导空白（' ' '\t' '\n' '\r'）
2. 从当前位置读到下一个空白（或 EOF）为止，得到 token
3. 按 x 的类型转换：
   - number 变量：token → to_num()
   - string 变量：token 直接赋值
   - auto 变量：token 匹配 ^-?\d+(\.\d+)?([eE][-+]?\d+)?$ → number，否则 string
   - bool 变量：token 非空且非 "0" → true，否则 false
4. 游标停在 token 末尾
```

EOF 时 x 保持原状态（未初始化仍未初始化）。

in(x) 的 x 必须是可声明的变量名，否则 E48。

11.6 混合示例

```c
// 输入流："42,hello,3.14"
void main() {
    number n;
    string s;
    number pi;

    in(n);                  // 读到 '4' '2' 然后遇到 ',' → n = 42
    getchar();              // 读掉逗号
    in(s);                  // "hello"
    getchar();              // 读掉逗号
    in(pi);                 // 3.14

    out(to_str(n) + " " + s + " " + to_str(pi) + "\n");
    return;
}
```

---

12. 内置函数

12.1 请求

```c
string body = get(url);
string body = post(url, requestBody);
```

· 无论服务器返回什么，get/post 永远返回 string
· 4xx / 5xx 不终止，用 status() 判断
· 单次请求超时 10s，响应体上限 5MB

12.2 with 通用修饰符

修饰符 请求上下文 return 上下文
with N ✗ E52 ✓ 状态码
with param { ... } ✓ query 参数 ✗ E52
with header { ... } ✓ 请求头 ✓ 响应头
with UA <expr> ✓ User-Agent ✗ E52
with proxy <expr> ✓ 代理前缀 ✓ 重定向 URL 前缀
with { ... }（无关键字） ✓ = with param（兼容） ✗ E52

```c
// 请求上下文
get(url)
    with param { "q": "abc", "page": "1" }
    with header { "Accept": "application/json", "Authorization": "token " + key }
    with UA "Mozilla/5.0"
    with proxy "https://proxy.example/";

// return 上下文
return "https://github.com/a/b/releases/download/v1.0/x.zip"
    with 301
    with header { "Cache-Control": "max-age=3600" }
    with proxy "https://v6.gh-proxy.org/";
```

规则：

· 多次 with 合并，同名后者覆盖
· with param/header 的 value 可以是表达式（key 仍是字面量）
· with proxy 拼接规则：最终 URL = proxy 前缀 + 原 URL，SSRF 检查的是最终 URL
· 响应头不允许 Location / Content-Length / Transfer-Encoding → E53
· 多个 with proxy 后者覆盖前者

12.3 响应信息

```c
number code = status();    // 最近一次请求的 HTTP 状态码
```

12.4 JSON

函数 返回 说明
json_str(body, path) string 取字符串；对象/数组返回 JSON 文本；不存在 ""
json_num(body, path) number 转数字，失败 0
json_bool(body, path) bool 转 bool，失败 false
json_len(body, path) number 数组/对象长度，失败 0

JSONPath 子集：$.a.b、$.a[0]、$.a[*]（仅结尾）。

12.5 字符串

函数 返回 说明
urlencode(s) string URL 编码
replace(s, from, to) string 全部替换
contains(s, p) / startsWith(s, p) / endsWith(s, p) bool 
len(s) number 字符串长度
to_num(s) number 字符串转数字，失败 0
to_str(x) string number/bool 转字符串
regex(s, pattern) string 第一捕获组，无匹配 ""

12.6 数学

函数 返回 说明
min(a, b) / max(a, b) 同类型 number 或 string（同类型）
pow(base, exp) number base ^ exp
rand() number [0, 1) 浮点
rand(n) number [0, n) 整数
ceil(x) number 向上取整
floor(x) number 向下取整

12.7 输入输出

```c
getchar()                 // 读一个字符（code point），EOF 返回 -1
in(x)                     // cin 风格读 token
out(x)                    // 追加输出并实时流式推送（见 §6.4）
q_get("name")             // URL query 参数，未传 ""
```

---

13. 内置变量

变量 类型 来源 可修改
keyword string 路径 ✗
repoPath string 路径 ✗
tag string 路径 ✗
selector string 路径 ✗
prerelease string 路径 ✗
p1–p4 string 路径 ✗
key string ?key= ✗

URL 形式 repoPath tag selector
/owner/repo/1 owner/repo latest 1
/owner/repo/v1.0/linux owner/repo v1.0 linux
/keyword/1 搜索得出 latest 1

同名声明 → E07；修改 / delete → E49。

---

14. 执行限制与错误

14.1 硬限制

项 上限
规则大小 100 KB
单次请求超时 10 s
单次响应体 5 MB
总 fetch 次数 20
总执行时间 15 s（超时 → 504 timeout）
单循环迭代 10 000
递归深度 100
struct 嵌套深度 8
原生数组维数 4
字符串长度 1 MB
JSON 深度 32
输出缓冲区 1 MB
输入流大小 1 MB

14.2 上下文清理

每个请求独立执行环境。正常结束 / 出错 / 超时 → 全部变量、容器、输入流、缓冲区整体丢弃。

14.3 安全

· 所有 get / post / ?in= / 主函数 return 的目标都过 SSRF 检查
· 拒绝内网 IP、非 http/https
· 可配置 ALLOWED_DOMAINS 白名单
· $env_XXX 只暴露 ENV_ALLOWLIST 中的变量

14.4 错误码

码 含义
E01 未闭合字符串
E02 非法字符
E03 缺少表达式
E04 缺少分号
E05 未声明变量
E06 重复声明
E07 覆盖内置变量
E08 未知函数
E09 参数个数错误
E10 参数类型错误
E11 未知运算符 / 类型不适用
E12 break/continue 位置错误
E13 return 类型不匹配
E14 缺少 void main() / main 未写 void
E15 多个 main
E16 编译期下标越界
E17 set 使用 (n) 或 [n]
E18 有返回值函数缺 return
E19 容器嵌套
E20 运行时类型不匹配
E21 循环超限
E22 递归超限
E23 越界 / 空容器访问
E24 fetch 次数超限
E25 类型不匹配 / auto 无法推导
E27 SSRF 拦截
E28 脚本超时
E30 对容器组 / 多维数组使用范围 for
E31 对容器组改变组大小
E32 原生数组调用容器方法
E33 引用必须绑定左值
E34 除零 / 取余零 / 位运算非整数或越界
E35 对函数参数 delete
E36 使用未初始化变量
E40 struct 循环引用
E41 不支持的 DSL 版本 / 缺少 ?url=
E42 map 使用非 K 类型下标
E43 main 的 return 字符串不是合法 URL
E44 main 的 return 字符串 + 2xx/4xx/5xx
E45 ++/-- 的操作数不是 number/bool 类型的左值
E46 对右值赋值 / 自增
E47 流式模式下 return "url"（不能重定向）
E48 in(x) 的 x 不是可声明变量
E49 修改 / delete 只读内置变量
E50 ?in= 远程拉取 HTTP 失败
E51 ?in= 或 POST body 超过 1 MB / 响应体超过 5 MB
E52 with 修饰符在当前上下文无意义
E53 return 响应头包含禁止的 key

错误信息格式：

```
CppScript runtime error at line 8, col 12:
    E36: use of uninitialized variable 'x'

snippet:
    7 |     number x;
    8 |     out(to_str(x));
      |                 ^
```

---

15. 完整示例

15.1 带 token 的 GitHub 请求

```c
// dsl: 14
// 访问：?url=...&key=ghp_xxxxx

void main() {
    if (key == "") {
        out("missing ?key=\n");
        return with 401;
    }

    string body = get("https://api.github.com/repos/" + repoPath + "/releases/latest")
                  with header {
                      "Accept": "application/vnd.github+json",
                      "Authorization": "token " + key
                  }
                  with UA "CppScript/14";

    if (status() == 401) {
        out("invalid key\n");
        return with 401;
    }
    if (status() != 200) {
        out("github error: " + to_str(status()) + "\n");
        return with 502;
    }

    number n = json_len(body, "$.assets");
    for (number i = 0; i < n; i++) {
        string name = json_str(body, "$.assets[" + to_str(i) + "].name");
        if (contains(name, selector)) {
            string url = json_str(body, "$.assets[" + to_str(i) + "].browser_download_url");
            return url with proxy "https://v6.gh-proxy.org/";
        }
    }

    out("no match\n");
    return with 404;
}
```

注意：这个例子调用了 out，所以会进入流式模式。如果 return url 成功，因为 out 已经触发流式，会走 E47。正确写法是把 out 从成功路径移除：

```c
void main() {
    if (key == "") {
        return with 401;      // 无 out，走 buffer 模式
    }
    // ... 请求
    return url with proxy "https://v6.gh-proxy.org/";
}
```

15.2 纯下载加速（不调 out）

```c
// dsl: 14

void main() {
    string body = get("https://api.github.com/repos/" + repoPath + "/releases/latest")
                  with header { "Accept": "application/vnd.github+json" };

    if (status() != 200) {
        return 404;
    }

    number n = json_len(body, "$.assets");
    for (number i = 0; i < n; i++) {
        string name = json_str(body, "$.assets[" + to_str(i) + "].name");
        if (contains(name, selector)) {
            return json_str(body, "$.assets[" + to_str(i) + "].browser_download_url")
                   with proxy "https://v6.gh-proxy.org/";
        }
    }
    return 404;
}
```

15.3 流式进度

```c
// dsl: 14
// 访问：?url=...

void main() {
    out("start\n");

    string body = get("https://api.example.com/releases/" + repoPath);
    out("fetched: " + to_str(len(body)) + " bytes\n");

    number n = json_len(body, "$.assets");
    for (number i = 0; i < n; i++) {
        string name = json_str(body, "$.assets[" + to_str(i) + "].name");
        out("asset " + to_str(i + 1) + ": " + name + "\n");
    }

    out("done\n");
    return;   // 关闭流
}
```

15.4 进制转换器（流式版）

```c
// dsl: 14
// 访问：?url=...&n=255&base=16

string DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

string digitChar(number d) {
    if (d < 0 || d >= 36) return "?";
    return regex(DIGITS, "^.{" + to_str(d) + "}(.)");
}

string toBase(number n, number base) {
    if (base < 2 || base > 36) return "ERR_BASE";
    if (n == 0) return "0";
    bool neg = false;
    if (n < 0) { neg = true; n = -n; }
    number num = floor(n);
    string result = "";
    while (num > 0) {
        number r = num % base;
        num = floor(num / base);
        result = digitChar(r) + result;
    }
    if (neg) result = "-" + result;
    return result;
}

void main() {
    string nStr    = q_get("n");
    string baseStr = q_get("base");

    if (nStr == "") {
        out("用法: ?n=值&base=目标进制\n");
        return;
    }
    if (baseStr == "") {
        out("缺少 ?base=\n");
        return;
    }

    number base = to_num(baseStr);
    if (base < 2 || base > 36) {
        out("进制必须在 2-36 之间\n");
        return;
    }

    number value = to_num(nStr);
    string result = toBase(value, base);
    out(result + "\n");
    return;
}
```

注意：这里全用 out + return;，会走流式模式（状态码 200）。

15.5 输入流分析

```c
// dsl: 14
// 访问：?url=...&in=https://example.com/data.txt

void main() {
    number lines = 0;
    number chars = 0;
    number c = getchar();
    while (c != -1) {
        chars++;
        if (c == 10) lines++;
        c = getchar();
    }
    out("lines: " + to_str(lines) + "\n");
    out("chars: " + to_str(chars) + "\n");
    return;
}
```

15.6 中文域名 + Onion + I2P

```c
// dsl: 14

void main() {
    string file = q_get("file");
    if (file == "") return 400;

    // 全部合法，引擎自动处理
    // return "中文.example.com/下载/" + file;              → https + punycode
    // return "abcdef.onion/files/" + file;                 → http
    // return "xyz.i2p/download/" + file;                   → http
    // return "例子.中国/" + file;                            → https + punycode
    return "中文.example.com/下载/" + file;
}
```

注意：这里没有 out，走 buffer 模式，能正常 302。

---

16. 常见坑

坑 1：main 必须写 void

```c
// main() { }              // ✗ E14
void main() { }             // ✓
```

坑 2：return 只返回 URL

```c
// return "hello";         // ✗ E43
// return "hello world";   // ✗ E43
return "example.com/a";    // ✓ 302
```

坑 3：out 和 return "url" 不能混用

```c
void main() {
    out("hello\n");                          // 触发流式
    return "https://x.com/a";                // ✗ E47（流式模式不能重定向）
}
```

正确做法：要 302 就别 out；要输出就别 return "url"。

坑 4：流式模式状态码固定 200

```c
void main() {
    out("error\n");
    return with 500;        // 实际返回 200（流式已激活）
}
```

正确做法：错误信息放 out，状态码只能是 200（流式限制）。或者不用 out，用 return with 500; 走 buffer 模式。

坑 5：中文域名的点必须是半角

```c
return "中文.中国/x";       // ✓
// return "中文。中国/x";   // ✗ E43（全角句号）
```

坑 6：.onion / .i2p 默认补 http

```c
return "abc.onion/a";      // → http://abc.onion/a
return "abc.i2p/a";        // → http://abc.i2p/a
```

坑 7：in 从输入流读，不是 query

```c
// v13 之前
in(n);                    // ✗ 现在从输入流读，GET 请求下是空的
// 正确
number n = to_num(q_get("n"));    // ✓ 从 query 读
```

坑 8：?in= 的值是 URL 还是文本

```c
?in=https://example.com/data     → 远程拉取
?in=hello%20world                → 文本 "hello world"
?in=                             → 空文本
```

坑 9：位运算操作数必须整数

```c
number a = 3.5;
// a & 1;                  // ✗ E34
```

坑 10：原生数组不能 push

```c
number a[5];
// a.push_back(10);        // ✗ E32
```

坑 11：a(n) vs a[n] vs T a[n] vs map

```c
number arr[5];             // 原生数组，5 个 number
deque<number> c(5);        // 容器，size=5，可 push/pop
deque<number> g[5];        // 容器组，5 个独立空 deque
map<string, number> m;     // 键值映射，空
```

坑 12：map 下标不存在的 key 返回默认值

```c
map<string, number> m;
m["x"] = 10;
out(to_str(m["y"]));       // 0（不存在返回 V 默认值，不插入）
```

坑 13：struct 不能循环引用

```c
struct A { number x; };
struct B { A a; };         // ✓ 单向嵌套
// struct S { S inner; };  // ✗ E40（自引用）
```

坑 14：未初始化变量读 → E36

```c
number x;
// out(to_str(x));         // ✗ E36
x = 5;
out(to_str(x));            // ✓
```

坑 15：auto 不能推 bool

```c
// auto ok = true;         // ✗ E25
bool ok = true;            // ✓
```

坑 16：除法是浮点

```c
out(to_str(7 / 2));        // "3.5"
out(to_str(floor(7 / 2))); // "3"
```

坑 17：容器组 / 多维数组不能范围 for

```c
deque<number> g[3];
// for (auto x in g) { }   // ✗ E30
for (number i = 0; i < g.size(); i++) {
    for (auto x in g[i]) { }  // ✓ 内层是单容器
}
```

坑 18：map 遍历迭代变量是 key

```c
map<string, number> m = { "a": 1, "b": 2 };
for (string k in m) {
    out(k + " = " + to_str(m[k]) + "\n");
}
```

坑 19：右移是算术右移

```c
number x = -12;
out(to_str(x >> 1));       // -6
```

坑 20：++i 返回引用，i++ 返回副本

```c
number i = 5;
++(++i);                   // ✓ i = 7
// (i++)++;                // ✗ E45
(++i) = 100;               // ✓ i = 100
```

坑 21：bool 的 ++ / -- 是取反

```c
bool b = true;
b++;                       // b = false
```

坑 22：key 不可修改

```c
// key = "new";            // ✗ E49
if (key == "") { ... }     // ✓ 读取
```

坑 23：with proxy 不叠加

```c
get(url) with proxy "https://a.com/" with proxy "https://b.com/"
// 最终用 b.com
```

坑 24：响应头不能写保留字段

```c
// return "url" with 302 with header { "Location": "x" };  // ✗ E53
```

坑 25：规则文件不要求 .txt 扩展名

```
?url=https://example.com/rule          ✓ 合法
?url=https://example.com/rule.txt      ✓ 合法
?url=https://example.com/rule.json     ✓ 合法（内容会被当文本解析）
```

---

附录：版本演化

版本 主要变化
v1–v8 基础设计：类型、容器、struct、引用、内置函数
v9 位运算、原生多维数组、void main()、命名 CppScript
v10 HTTPS 优先、中文域名、版本默认最新、map、struct 嵌套
v11 return 只返回 URL、out 输出 body、.onion / .i2p 补 http、E43/E44
v12.1 ++ / -- / 复合赋值，和 C++ 一致（返回左值引用）
v12.2 bool 的 ++ / -- = 取反；bool 复合赋值先转 number 再转回
v13 输入流、getchar、in 改为 cin 风格
v13.2 ?txtin= 输入流来源（URL 或文本）
v14 key 只读变量、with 通用修饰符（param/header/UA/proxy/status）
v14.1 ?txturl= → ?url=（不要求 .txt）；?txtin= → ?in=；out 流式渲染

---

CppScript v14.1 · 2026-10