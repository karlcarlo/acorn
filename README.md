橡树果 Acorn
=====

Acorn是一个轻量的Markdown博客，基于NodeJS、Express、MongoDB等构建，由[NutUX](http://ux.sohu.com)团队开发，可以很方便的搭建个人博客站点。


安装 Install
=====

首先确认已经安装node.js、npm和MongoDB等环境

###配置Acorn依赖###

    cd acorn
    npm install ./
    cp config.simple.js config.js

###编辑config.js###

    {
      application: {
        version: 'v0.2.2',
        name: "Acorn",
        host: 'http://127.0.0.1/', // 配置已上传图片的访问域名
        port: 3000, // 配置端口号
        root_account: 'root@localhost' // 更改你自己的管理员帐号，密码默认为 123456
      },
      session: {
        secret: "acorn_blog"
      },
      database: {
    	url: "mongodb://127.0.0.1/acorn_blog" // 配置MongoDB数据库地址
      },
      cookie: {
        name: 'acorn'
      }
    }

###初始化数据###

    cd scripts
    node init.js // 执行初始化程序

###启动Acorn博客###

    cd ..
    node app.js & // 启动Express


特性
======

* 基于node.js平台
* 使用轻量级标记语言Markdown撰写话题
* 应用MongoDB，NoSQL类型数据库驱动
* 借鉴RoR的敏捷框架理念，遵循MVC架构模式
* 轻量级、快速迭代


版本
=====

目前最新版本为：v0.2.2


意见和反馈
=====

任何批评、问题和意见等，都欢迎与我们联系：[nutux@sohu.com](http://ux.sohu.com)