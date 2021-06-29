# 编辑器开发周期

## 第一期

- 实现实用工具函数
- 实现 command 模块
- 实现 selection 模块
- 实现 utils 模块
- 实现了简单版的 bold
## 决定重构了 实现原生也解决不了问题

```txt

<!-- 段落文本 paragraph 为最小单位-->
<div data-paragraph-wrapper contenteditable="true">
    <p data-paragraph><span data-text="normal"></span></p>
</div>

<!-- 列表 -->
<div data-List>
    <ul>
        <li>
            <div data-paragraph contenteditable="true">
                <p data-paragraph><span data-text="normal"></span></p>
            </div>
        </li>
        <li></li>
    </ul>
</div>
```



```

<A>发我是一段文<B>字但<C>是我</C>也不</B>知道怎么测试自己</A>

<span style="font-style: bold">
    <text>我是默认文字</text>
</span>

<span style="font-color:red">
    <span style="font-style: bold">
        <text>我是默认文字</text>
    </span>
</span>

<span style="text-decoration: underline">
    <span style="font-color:red">
        <span style="font-style: bold">
            <text>我是默认文字</text>
        </span>
    </span>
</span>
```
