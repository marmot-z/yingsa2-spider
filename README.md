这是一个定时爬取「趣运动」公众号羽毛球馆预定信息，将其推送至微信，~~并支持自动预定羽毛球场地的工具~~。

### 部署

1. 安装nodejs

   前往[nodejs](https://nodejs.org/en/download/)官网下载对应最新稳定版本的`nodejs`

2. 设置npm镜像

   ```
   npm config set registry https://registry.npm.taobao.org
   ```

3. 下载代码

   ```
   git clone https://github.com/marmot-z/yingsa2-spider.git
   cd yingsa2-spider/
   ```

4. 配置文件

   1. 配置定时`cron`表达式用于设置爬虫工作频率（其与正常`cron`表达式基本一致，只不过起最后一位不能使用`?`，只能使用`*`）
   2. 设置手机号码(`user.phoneNum`)和密码(`user.password`)用于登录
   3. 设置目标场地(`interested.sites`)和时间段(`interested.startHour`/`interested.endHour`)
   4. 设置推送相关的应用`token`和用户`uid`（详情请看[push.md](./push.md)）

5. 构建 & 启动

   ```
   npm install
   node ./index.js &
   ```

### 声明

> 此工具只是方便热爱运动的人用于预定羽毛球场，不能用于其他非法用途，出现相关问题概不负责
