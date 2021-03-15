# 提交规范

为了方便协作，默认遵守以下原则

**应该包含**:

<提交类型>(作用范围): <主题> [问题 id]
<主题内容>
<备注额外信息>

```txt
<type>(<scope>): <subject> [<issue_id>]
// 空一行
<body>
// 空一行
<footer>
```

参考连接 [conventionalcommits](https://www.conventionalcommits.org/)

## type

### 一般类型

以下根据情况判断

- feat: 新功能(feature),新特性
- fix: 修复 bug
- perf: 性能优化
- refactor: 重构(既不是新增功能，也不是修改 bug 的代码变动)
- docs: 文档(documents)
- style: 代码格式(不影响代码运行的格式变动，注意不是指 CSS 的修改)
- test: 提交测试代码(单元测试，集成测试等)
- build: 代码构建，影响到版本问题
- revert: 恢复上一次提交
- ci: 构建工具改动
- chore: 其他修改
- release: 发布版本

### 自定的特定类型

- record: 记录每天更新
- improve: 改善部分逻辑或者代码

## scope(可选)

一般指 commit 提交受到影响的范围

## subject

主题，本次提交的主要内容概要说明

### issue_id(可选)

指解决 issued id

## body

提交的主体内容，例如

```txt
1.fix xxx
2.add ...
```

## footer(可选)

一般指额外补充信息。
