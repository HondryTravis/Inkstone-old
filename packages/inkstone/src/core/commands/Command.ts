import Editor from "../../editor";
import { createOverride } from './Override';


const NativeCommands = (editor: Editor) => {

    let cssStylingFlag = false;

    let executionStackDepth = 0;

    const commands = new Map()

    const { selection, utils } = editor;
    console.log(selection.getActiveRange())

    const internalOverride = createOverride(selection.getActiveRange)

    function registryCommand(command: string, options = {}) {
        commands.set(command, options)
    }

    function editCommandMethod(command: string, range: Range, callback: Function) {
        if (executionStackDepth == 0 && typeof range != "undefined") {
            selection.setActiveRange(range)
        } else if (executionStackDepth == 0) {
            selection.setActiveRange(null)
            selection.setActiveRange(selection.getActiveRange())
        }

        executionStackDepth++;
        let ret;

        try {
            ret = callback();
        } catch (e) {
            executionStackDepth--;
            throw e;
        }
        executionStackDepth--;
        return ret;
    }

    // command, showUi, value, range
    function execCommand (...args) {
        let [command, showUi, value, range] = args
        // 全部初始化命令为小写
        command = command.toLowerCase();
        // 如果只有一个参数，让 showUi 变为 false, 大于 4 个参数将不在处理
        if (args.length == 1
        || (args.length >= 4 && typeof showUi == "undefined")) {
            showUi = false;
        }
        // 如果仅提供一个或两个参数，则让 value 为空字符串，设置默认值
        if (args.length <= 2
        || (args.length >= 4 && typeof value == "undefined")) {
            value = "";
        }

        const execCallback = (command, showUi, value) => {
            return () => {
                if (!commands.has(command) || !queryCommandEnabled(command)) {
                    return false;
                }

                // 执行命令操作，将值作为参数传递给指令，测试结果
                let ret = commands.get(command).action(value);

                // 如果出现既不是 true 也不是 false 的问题，直接抛出异常
                if (ret !== true && ret !== false) {
                    throw "execCommand() didn't return true or false: " + ret;
                }
                // 如果上一步错误，直接返回
                if (ret === false) {
                    return false;
                }
                // 可以执行，命令启用……
                return true;
            }
        }

        return editCommandMethod(command, range, execCallback(command, showUi, value));

    }

    function queryCommandEnabled(command: string, range?: Range) {
        command = command.toLowerCase();
        const callback = function (command) {
            return function () {

                // 如果同时支持和启用命令，则返回true，否则返回false。
                if (!(commands.has(command))) {
                    return false;
                }

                // 在本规范中定义的命令中，除 cut 命令和 paste 命令外，总是启用杂项命令中列出的命令。
                // 如果活动范围不为null，其开始节点可编辑或是编辑根节点，其结束节点是可编辑的，
                // 也可以是子编辑根节点，并且有一些编辑根节点是其开始节点和结束节点的共同祖先
                return ["copy", "defaultparagraphseparator", "selectall", "stylewithcss", "usecss"].indexOf(command) != -1
                    || (
                        selection.getActiveRange() !== null
                        && (utils.isEditable(selection.getActiveRange().startContainer) || utils.isEditingHost(selection.getActiveRange().startContainer))
                        && (utils.isEditable(selection.getActiveRange().endContainer) || utils.isEditingHost(selection.getActiveRange().endContainer))
                        && (utils.getInclusiveAncestors(selection.getActiveRange().commonAncestorContainer).some(utils.isEditingHost))
                    );
            }
        }

        return editCommandMethod(command, range, callback(command))
    }

    function queryCommandIndeterm(command: string, range?: Range) {
        command = command.toLowerCase();
        const callback = (command) => {
            return () => {
                // 如果命令不支持或者不确定，返回 false
                const currentCommand = commands.get(command)
                if (!currentCommand || !('indeterm' in currentCommand)) {
                    return false;
                }
                // 如果命令不确定，则返回true，否则返回false
                return currentCommand.indeterm();
            }
        }
        return editCommandMethod(command, range, callback(command))
    }

    function queryCommandState(command: string, range?: Range) {
        command = command.toLowerCase();
        const callback = (command: string) => {
            return () => {

                // 如果命令不受支持或没有状态，则返回false。
                console.log('commands.has(command)', commands.has(command))
                if (!commands.has(command) || !("state" in commands.get(command))) {
                    return false;
                }

                // 如果设置了命令的状态替代，则将其返回
                if (typeof internalOverride.getStateOverride(command) != "undefined") {
                    return internalOverride.getStateOverride(command);
                }

                // 如果命令的状态为true，则返回true；否则为false
                return commands.get(command).state();
            }
        }
        return editCommandMethod(command, range, callback(command))
    }
    // 当编辑器使用 queryCommandSupported（command）方法时调用接口，如果命令为受支持，否则为false。
    function queryCommandSupported (command: string) {
        return commands.get(command.toLowerCase())
    }
    function queryCommandValue (command: string, range?: Range) {
        command = command.toLowerCase();
        const callback = function () {
            // 如果不支持命令或命令没有值，则返回空字符串
            const currentCommand = commands.get(command)
            if (!currentCommand || !("value" in currentCommand)) {
                return "";
            }
            // 如果命令是 fontSize 并且设置了其值替代，则将值替代转换为整数个像素，并返回结果的旧字体大小
            if (command == "fontsize"
                && internalOverride.getValueOverride("fontsize") !== undefined) {
                return utils.getLegacyFontSize(internalOverride.getValueOverride("fontsize"));
            }

            // 如果已经设置了覆盖命令的结果，直接返回
            if (typeof internalOverride.getValueOverride(command) != "undefined") {
                return internalOverride.getValueOverride(command);
            }

            // 返回命令的结果
            return currentCommand.value();
        }
        return editCommandMethod(command, range, callback)
    }

    // 获得指定的命令的值
    function getSpecifiedCommandValue(element, command) {
        // 如果 command 是 ['backColor', 'hiliteColor'] 并且这个元素不是'inline', 返回 null
        if ((command == "backcolor" || command == "hilitecolor")
        && getComputedStyle(element).display != "inline") {
            return null;
        }

        // command 是 'createLink' or 'unlink'
        if (command == "createlink" || command == "unlink") {
            // 如果是一个 Element 元素，并且拥有 href 属性，就 return 这个值
            if (utils.isHtmlElement(element)
            && element.tagName == "A"
            && element.hasAttribute("href")) {
                return element.getAttribute("href");
            }

            return null;
        }

        // 如果 command 是 subscript or superscript
        if (command == "subscript" || command == "superscript") {
            // 如果 element 是 "sup", return "superscript"
            if (utils.isHtmlElement(element, "sup")) {
                return "superscript";
            }

            // 如果 elelment 是 sub，return "subscript"
            if (utils.isHtmlElement(element, "sub")) {
                return "subscript";
            }

            return null;
        }

        // 如果 command 是 "strikethrough", 并且 element 设置了 style 属性，并且属性中设置了 text-decoration
        if (command == "strikethrough"
        && element.style.textDecoration != "") {
            // 如果 element 元素 style 中设置了 text-decoration 并且包含 line-through 属性，返回该属性
            if (element.style.textDecoration.indexOf("line-through") != -1) {
                return "line-through";
            }

            return null;
        }

        // 如果 command 是 "strikethrough" 并且 element 是 s or strike，直接返回 line-through
        if (command == "strikethrough"
        && utils.isHtmlElement(element, ["S", "STRIKE"])) {
            return "line-through";
        }

        // 如果 command 是 "underline", 并且 element 设置了 style 并且还设置了 text-decoration
        if (command == "underline"
        && element.style.textDecoration != "") {
            // 如果 element 元素 style 中设置了 text-decoration 并且包含 underline 属性，返回该属性
            if (element.style.textDecoration.indexOf("underline") != -1) {
                return "underline";
            }

            return null;
        }

        // 如果 command is "underline" 并且 element 是 [u] 直接返回 underline
        if (command == "underline"
        && utils.isHtmlElement(element, "U")) {
            return "underline";
        }

        // 获得 command 相关的属性 property
        let property = commands.get(command).relevantCssProperty;

        if (property === null) {
            return null;
        }

        // 如果 element 有相关属性设置，返回相关属性
        if (element.style[property] != "") {
            return element.style[property];
        }

        // 如果 element 是一个 font element，返回当前默认的有效属性
        if (utils.isHtmlNamespace(element.namespaceURI)
        && element.tagName == "FONT") {
            if (property == "color" && element.hasAttribute("color")) {
                return element.color;
            }
            if (property == "fontFamily" && element.hasAttribute("face")) {
                return element.face;
            }
            if (property == "fontSize" && element.hasAttribute("size")) {
                // This is not even close to correct in general.
                let size = parseInt(element.size);
                if (size < 1) {
                    size = 1;
                }
                if (size > 7) {
                    size = 7;
                }
                return {
                    1: "x-small",
                    2: "small",
                    3: "medium",
                    4: "large",
                    5: "x-large",
                    6: "xx-large",
                    7: "xxx-large"
                }[size];
            }
        }

        // 如果是 fontWeight / fontStyle 则有两种情况， ['b', 'strong'] / ['i', 'em'],都返回正确的结果
        if (property == "fontWeight"
        && (element.tagName == "B" || element.tagName == "STRONG")) {
            return "bold";
        }
        if (property == "fontStyle"
        && (element.tagName == "I" || element.tagName == "EM")) {
            return "italic";
        }


        return null;
    }

    // 获得有效的命令值
    function getEffectiveCommandValue(node, command) {
        // 如果 node 不是 element 并且父节点也不是
        if (node.nodeType != Node.ELEMENT_NODE
        && (!node.parentNode || node.parentNode.nodeType != Node.ELEMENT_NODE)) {
            return null;
        }

        // 获得生效的父节点的命令值
        if (node.nodeType != Node.ELEMENT_NODE) {
            return getEffectiveCommandValue(node.parentNode, command);
        }

        // 如果命令是 command 是 "createlink" or "unlink"
        if (command == "createlink" || command == "unlink") {
            // 获得有效的 href 属性的 node
            while (node
            && (!utils.isHtmlElement(node)
            || node.tagName != "A"
            || !node.hasAttribute("href"))) {
                node = node.parentNode;
            }

            if (!node) {
                return null;
            }

            return node.getAttribute("href");
        }

        // 如果 command 是 "backColor" or "hiliteColor"
        if (command == "backcolor"
        || command == "hilitecolor") {
            // 获得有效的 backgroundColor 元素
            while ((getComputedStyle(node).backgroundColor == "rgba(0, 0, 0, 0)"
            || getComputedStyle(node).backgroundColor === ""
            || getComputedStyle(node).backgroundColor == "transparent")
            && node.parentNode
            && node.parentNode.nodeType == Node.ELEMENT_NODE) {
                node = node.parentNode;
            }

            return getComputedStyle(node).backgroundColor;
        }

        // 如果命令是 is "subscript" or "superscript"
        if (command == "subscript" || command == "superscript") {
            // 初始化 "subscript" or "superscript" 都为 false
            let affectedBySubscript = false;
            let affectedBySuperscript = false;

            // 如果 node 是 inline 类型
            while (utils.isInlineNode(node)) {
                let verticalAlign = getComputedStyle(node).verticalAlign;

                // 如果 node 是 sub， 设置 affectedBySubscript = true 如果是sub，设置 affectedBySuperscript = true;
                if (utils.isHtmlElement(node, "sub")) {
                    affectedBySubscript = true;
                } else if (utils.isHtmlElement(node, "sup")) {
                    affectedBySuperscript = true;
                }

                node = node.parentNode;
            }

            // 如果 affectedBySubscript affectedBySuperscript 都为 true 返回 mixed
            if (affectedBySubscript && affectedBySuperscript) {
                return "mixed";
            }

            // 如果 affectedBySubscript 为 true 返回 subscript
            if (affectedBySubscript) {
                return "subscript";
            }

            // 如果 affectedBySuperscript 为 true 返回 superscript
            if (affectedBySuperscript) {
                return "superscript";
            }

            return null;
        }

        // 如果 command 是 "strikethrough", 并且设置了 "text-decoration" 属性，并且包含 line-through 就立即返回，如果没有，返回 null
        if (command == "strikethrough") {
            do {
                if (getComputedStyle(node).textDecoration.indexOf("line-through") != -1) {
                    return "line-through";
                }
                node = node.parentNode;
            } while (node && node.nodeType == Node.ELEMENT_NODE);
            return null;
        }

        // 如果 command 是 "strikethrough", 并且设置了 "text-decoration" 属性，并且包含 underline 就立即返回，如果没有，返回 null
        if (command == "underline") {
            do {
                if (getComputedStyle(node).textDecoration.indexOf("underline") != -1) {
                    return "underline";
                }
                node = node.parentNode;
            } while (node && node.nodeType == Node.ELEMENT_NODE);
            return null;
        }

        if (!("relevantCssProperty" in commands.get(command))) {
            throw "Bug: no relevantCssProperty for " + command + " in getEffectiveCommandValue";
        }

        // 返回相关的 CSS 属性的值
        return getComputedStyle(node)[commands.get(command).relevantCssProperty];
    }

    // 清除元素设定的样式
    function clearValue(element, command) {
        // 如果 element 不可编辑，返回 []
        if (!utils.isEditable(element)) {
            return [];
        }

        // 如果 element 是特殊的命令，并且验证结果为空，返回 []
        if (getSpecifiedCommandValue(element, command) === null) {
            return [];
        }

        // 是一个简单的可以被修改的 element
        if (utils.isSimpleModifiableElement(element)) {
            // 获得子节点
            let children = Array.prototype.slice.call(element.childNodes);

            // 对于 children 中的每个孩子，在 element 之前将 child 插入元素的父元素，立即保留范围。
            for (let i = 0; i < children.length; i++) {
                selection.movePreservingRanges(children[i], element.parentNode, utils.getNodeIndex(element));
            }

            element.parentNode.removeChild(element);

            return children;
        }

        // 如果命令是 "strikethrough" 删除其 style 属性中的样式
        if (command == "strikethrough"
            && element.style.textDecoration.indexOf("line-through") != -1) {
            if (element.style.textDecoration == "line-through") {
                element.style.textDecoration = "";
            } else {
                element.style.textDecoration = element.style.textDecoration.replace("line-through", "");
            }
            if (element.getAttribute("style") == "") {
                element.removeAttribute("style");
            }
        }

        // 如果是 undeline 删除其 style 等属性中的样式
        if (command == "underline"
            && element.style.textDecoration.indexOf("underline") != -1) {
            if (element.style.textDecoration == "underline") {
                element.style.textDecoration = "";
            } else {
                element.style.textDecoration = element.style.textDecoration.replace("underline", "");
            }
            if (element.getAttribute("style") == "") {
                element.removeAttribute("style");
            }
        }

        // 如果是其他的类似的 CSS 属性，直接移出 style 属性
        if (commands.get(command).relevantCssProperty !== null) {
            element.style[commands.get(command).relevantCssProperty] = '';
            if (element.getAttribute("style") == "") {
                element.removeAttribute("style");
            }
        }

        // 如果是 font 标签
        if (utils.isHtmlNamespace(element.namespaceURI) && element.tagName == "FONT") {
            // 如果设置了 foreColor 移出设定值
            if (command == "forecolor") {
                element.removeAttribute("color");
            }

            // 如果设置了 fontname 移出设定值
            if (command == "fontname") {
                element.removeAttribute("face");
            }

            // 如果设置了 fontSize 移出设定值
            if (command == "fontsize") {
                element.removeAttribute("size");
            }
        }

        // 如果是 a 标签，并且 command 是 "createLink" or "unlink", 取消 href 属性
        if (utils.isHtmlElement(element, "A")
            && (command == "createlink" || command == "unlink")) {
            element.removeAttribute("href");
        }


        // 再次校验特殊命令，并且验证结果为空，返回 []
        if (getSpecifiedCommandValue(element, command) === null) {
            return [];
        }

        // 返回由 span 包裹的节点
        return [selection.setTagName(element, "span")];
    }

    // 是否是两个相同的变量
    // 两个量都是命令的等效值，如果两个均为空
    // 或者都是字符串并且相等，并且命令没有定义任何 equivalentValues，
    // 或者两个都是字符串，并且命令定义了 equivalentValues 并且它们与定义匹配。
    function areEquivalentValues(command, val1, val2) {

        if (val1 === null && val2 === null) {
            return true;
        }

        if (typeof val1 == "string"
        && typeof val2 == "string"
        && val1 == val2
        && !("equivalentValues" in commands.get(command))) {
            return true;
        }

        if (typeof val1 == "string"
        && typeof val2 == "string"
        && "equivalentValues" in commands.get(command)
        && commands.get(command).equivalentValues(val1, val2)) {
            return true;
        }

        return false;
    }
    // 松散比较两个值
    function areLooselyEquivalentValues(command, val1, val2) {

        const sizeMap = new Map();
        if (areEquivalentValues(command, val1, val2)) {
            return true;
        }

        if (command != "fontsize"
        || typeof val1 != "string"
        || typeof val2 != "string") {
            return false;
        }

        let font = document.createElement("font");
        document.body.appendChild(font);

        ["x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"].forEach(function(keyword) {
            font.size = utils.cssSizeToLegacy(keyword);
            sizeMap.set(keyword, getComputedStyle(font).fontSize)
        });
        document.body.removeChild(font);

        return val1 === sizeMap.get(val2)
            || val2 === sizeMap.get(val1);
    }

    // 强制设置值
    function forceValue(node, command, newValue) {
        // "If node's parent is null, abort this algorithm."
        // 如果节点的父级不是元素，则中止该算法。
        if (!node.parentNode) {
            return;
        }

        // "If new value is null, abort this algorithm."
        if (newValue === null) {
            return;
        }

        // "If node is an allowed child of "span":"
        if (utils.isAllowedChild(node, "span")) {
            // "Reorder modifiable descendants of node's previousSibling."
            reorderModifiableDescendants(node.previousSibling, command, newValue);

            // "Reorder modifiable descendants of node's nextSibling."
            reorderModifiableDescendants(node.nextSibling, command, newValue);

            // "Wrap the one-node list consisting of node, with sibling criteria
            // returning true for a simple modifiable element whose specified
            // command value is equivalent to new value and whose effective command
            // value is loosely equivalent to new value and false otherwise, and
            // with new parent instructions returning null."
            wrap([node],
                function(node) {
                    return utils.isSimpleModifiableElement(node)
                        && areEquivalentValues(command, getSpecifiedCommandValue(node, command), newValue)
                        && areLooselyEquivalentValues(command, getEffectiveCommandValue(node, command), newValue);
                },
                function() { return null }
            );
        }

        // "If node is invisible, abort this algorithm."
        if (utils.isInvisible(node)) {
            return;
        }

        // "If the effective command value of command is loosely equivalent to new
        // value on node, abort this algorithm."
        if (areLooselyEquivalentValues(command, getEffectiveCommandValue(node, command), newValue)) {
            return;
        }

        // "If node is not an allowed child of "span":"
        if (!utils.isAllowedChild(node, "span")) {
            // "Let children be all children of node, omitting any that are
            // Elements whose specified command value for command is neither null
            // nor equivalent to new value."
            let children = [];
            for (let i = 0; i < node.childNodes.length; i++) {
                if (node.childNodes[i].nodeType == Node.ELEMENT_NODE) {
                    let specifiedValue = getSpecifiedCommandValue(node.childNodes[i], command);

                    if (specifiedValue !== null
                    && !areEquivalentValues(command, newValue, specifiedValue)) {
                        continue;
                    }
                }
                children.push(node.childNodes[i]);
            }

            // "Force the value of each Node in children, with command and new
            // value as in this invocation of the algorithm."
            for (let i = 0; i < children.length; i++) {
                forceValue(children[i], command, newValue);
            }

            // "Abort this algorithm."
            return;
        }

        // "If the effective command value of command is loosely equivalent to new
        // value on node, abort this algorithm."
        if (areLooselyEquivalentValues(command, getEffectiveCommandValue(node, command), newValue)) {
            return;
        }

        // "Let new parent be null."
        let newParent = null;

        // "If the CSS styling flag is false:"
        if (!cssStylingFlag) {
            // "If command is "bold" and new value is "bold", let new parent be the
            // result of calling createElement("b") on the ownerDocument of node."
            if (command == "bold" && (newValue == "bold" || newValue == "700")) {
                newParent = node.ownerDocument.createElement("b");
            }

            // "If command is "italic" and new value is "italic", let new parent be
            // the result of calling createElement("i") on the ownerDocument of
            // node."
            if (command == "italic" && newValue == "italic") {
                newParent = node.ownerDocument.createElement("i");
            }

            // "If command is "strikethrough" and new value is "line-through", let
            // new parent be the result of calling createElement("s") on the
            // ownerDocument of node."
            if (command == "strikethrough" && newValue == "line-through") {
                newParent = node.ownerDocument.createElement("s");
            }

            // "If command is "underline" and new value is "underline", let new
            // parent be the result of calling createElement("u") on the
            // ownerDocument of node."
            if (command == "underline" && newValue == "underline") {
                newParent = node.ownerDocument.createElement("u");
            }

            // "If command is "foreColor", and new value is fully opaque with red,
            // green, and blue components in the range 0 to 255:"
            if (command == "forecolor" && utils.parseSimpleColor(newValue)) {
                // "Let new parent be the result of calling createElement("font")
                // on the ownerDocument of node."
                newParent = node.ownerDocument.createElement("font");

                // "Set the color attribute of new parent to the result of applying
                // the rules for serializing simple color values to new value
                // (interpreted as a simple color)."
                newParent.setAttribute("color", utils.parseSimpleColor(newValue));
            }

            // "If command is "fontName", let new parent be the result of calling
            // createElement("font") on the ownerDocument of node, then set the
            // face attribute of new parent to new value."
            if (command == "fontname") {
                newParent = node.ownerDocument.createElement("font");
                newParent.face = newValue;
            }
        }

        // "If command is "createLink" or "unlink":"
        if (command == "createlink" || command == "unlink") {
            // "Let new parent be the result of calling createElement("a") on the
            // ownerDocument of node."
            newParent = node.ownerDocument.createElement("a");

            // "Set the href attribute of new parent to new value."
            newParent.setAttribute("href", newValue);

            // "Let ancestor be node's parent."
            let ancestor = node.parentNode;

            // "While ancestor is not null:"
            while (ancestor) {
                // "If ancestor is an a, set the tag name of ancestor to "span",
                // and let ancestor be the result."
                if (utils.isHtmlElement(ancestor, "A")) {
                    ancestor = selection.setTagName(ancestor, "span");
                }

                // "Set ancestor to its parent."
                ancestor = ancestor.parentNode;
            }
        }

        // "If command is "fontSize"; and new value is one of "x-small", "small",
        // "medium", "large", "x-large", "xx-large", or "xxx-large"; and either the
        // CSS styling flag is false, or new value is "xxx-large": let new parent
        // be the result of calling createElement("font") on the ownerDocument of
        // node, then set the size attribute of new parent to the number from the
        // following table based on new value: [table omitted]"
        if (command == "fontsize"
        && ["x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"].indexOf(newValue) != -1
        && (!cssStylingFlag || newValue == "xxx-large")) {
            newParent = node.ownerDocument.createElement("font");
            newParent.size = utils.cssSizeToLegacy(newValue);
        }

        // "If command is "subscript" or "superscript" and new value is
        // "subscript", let new parent be the result of calling
        // createElement("sub") on the ownerDocument of node."
        if ((command == "subscript" || command == "superscript")
        && newValue == "subscript") {
            newParent = node.ownerDocument.createElement("sub");
        }

        // "If command is "subscript" or "superscript" and new value is
        // "superscript", let new parent be the result of calling
        // createElement("sup") on the ownerDocument of node."
        if ((command == "subscript" || command == "superscript")
        && newValue == "superscript") {
            newParent = node.ownerDocument.createElement("sup");
        }

        // "If new parent is null, let new parent be the result of calling
        // createElement("span") on the ownerDocument of node."
        if (!newParent) {
            newParent = node.ownerDocument.createElement("span");
        }

        // "Insert new parent in node's parent before node."
        node.parentNode.insertBefore(newParent, node);

        // "If the effective command value of command for new parent is not loosely
        // equivalent to new value, and the relevant CSS property for command is
        // not null, set that CSS property of new parent to new value (if the new
        // value would be valid)."
        let property = commands.get(command).relevantCssProperty;
        if (property !== null
        && !areLooselyEquivalentValues(command, getEffectiveCommandValue(newParent, command), newValue)) {
            newParent.style[property] = newValue;
        }

        // "If command is "strikethrough", and new value is "line-through", and the
        // effective command value of "strikethrough" for new parent is not
        // "line-through", set the "text-decoration" property of new parent to
        // "line-through"."
        if (command == "strikethrough"
        && newValue == "line-through"
        && getEffectiveCommandValue(newParent, "strikethrough") != "line-through") {
            newParent.style.textDecoration = "line-through";
        }

        // "If command is "underline", and new value is "underline", and the
        // effective command value of "underline" for new parent is not
        // "underline", set the "text-decoration" property of new parent to
        // "underline"."
        if (command == "underline"
        && newValue == "underline"
        && getEffectiveCommandValue(newParent, "underline") != "underline") {
            newParent.style.textDecoration = "underline";
        }

        // "Append node to new parent as its last child, preserving ranges."
        selection.movePreservingRanges(node, newParent, newParent.childNodes.length);

        // "If node is an Element and the effective command value of command for
        // node is not loosely equivalent to new value:"
        if (node.nodeType == Node.ELEMENT_NODE
        && !areEquivalentValues(command, getEffectiveCommandValue(node, command), newValue)) {
            // "Insert node into the parent of new parent before new parent,
            // preserving ranges."
            selection.movePreservingRanges(node, newParent.parentNode, utils.getNodeIndex(newParent));

            // "Remove new parent from its parent."
            newParent.parentNode.removeChild(newParent);

            // "Let children be all children of node, omitting any that are
            // Elements whose specified command value for command is neither null
            // nor equivalent to new value."
            let children = [];
            for (let i = 0; i < node.childNodes.length; i++) {
                if (node.childNodes[i].nodeType == Node.ELEMENT_NODE) {
                    let specifiedValue = getSpecifiedCommandValue(node.childNodes[i], command);

                    if (specifiedValue !== null
                    && !areEquivalentValues(command, newValue, specifiedValue)) {
                        continue;
                    }
                }
                children.push(node.childNodes[i]);
            }

            // "Force the value of each Node in children, with command and new
            // value as in this invocation of the algorithm."
            for (let i = 0; i < children.length; i++) {
                forceValue(children[i], command, newValue);
            }
        }
    }

    // 重新排列可修改的后代
    function reorderModifiableDescendants(node, command, newValue) {
        // "Let candidate equal node."
        let candidate = node;

        // "While candidate is a modifiable element, and candidate has exactly one
        // child, and that child is also a modifiable element, and candidate is not
        // a simple modifiable element or candidate's specified command value for
        // command is not equivalent to new value, set candidate to its child."
        while (utils.isModifiableElement(candidate)
        && candidate.childNodes.length == 1
        && utils.isModifiableElement(candidate.firstChild)
        && (!utils.isSimpleModifiableElement(candidate)
        || !areEquivalentValues(command, getSpecifiedCommandValue(candidate, command), newValue))) {
            candidate = candidate.firstChild;
        }

        // "If candidate is node, or is not a simple modifiable element, or its
        // specified command value is not equivalent to new value, or its effective
        // command value is not loosely equivalent to new value, abort these
        // steps."
        if (candidate == node
        || !utils.isSimpleModifiableElement(candidate)
        || !areEquivalentValues(command, getSpecifiedCommandValue(candidate, command), newValue)
        || !areLooselyEquivalentValues(command, getEffectiveCommandValue(candidate, command), newValue)) {
            return;
        }

        // "While candidate has children, insert the first child of candidate into
        // candidate's parent immediately before candidate, preserving ranges."
        while (candidate.hasChildNodes()) {
            selection.movePreservingRanges(candidate.firstChild, candidate.parentNode, utils.getNodeIndex(candidate));
        }

        // "Insert candidate into node's parent immediately after node."
        node.parentNode.insertBefore(candidate, node.nextSibling);

        // "Append the node as the last child of candidate, preserving ranges."
        selection.movePreservingRanges(node, candidate, -1);
    }

    function wrap(nodeList, siblingCriteria, newParentInstructions) {
        // "If not provided, sibling criteria returns false and new parent
        // instructions returns null."
        //“如果未提供，则同级条件返回false和新的父级
        //指令传回null。”
        if (typeof siblingCriteria == "undefined") {
            siblingCriteria = function() { return false };
        }
        if (typeof newParentInstructions == "undefined") {
            newParentInstructions = function() { return null };
        }

        // "If every member of node list is invisible, and none is a br, return
        // null and abort these steps."
        if (nodeList.every(utils.isInvisible)
        && !nodeList.some(function(node) { return utils.isHtmlElement(node, "br") })) {
            return null;
        }

        // "If node list's first member's parent is null, return null and abort
        // these steps."
        if (!nodeList[0].parentNode) {
            return null;
        }

        // "If node list's last member is an inline node that's not a br, and node
        // list's last member's nextSibling is a br, append that br to node list."
        if (utils.isInlineNode(nodeList[nodeList.length - 1])
        && !utils.isHtmlElement(nodeList[nodeList.length - 1], "br")
        && utils.isHtmlElement(nodeList[nodeList.length - 1].nextSibling, "br")) {
            nodeList.push(nodeList[nodeList.length - 1].nextSibling);
        }

        // "While node list's first member's previousSibling is invisible, prepend
        // it to node list."
        while (utils.isInvisible(nodeList[0].previousSibling)) {
            nodeList.unshift(nodeList[0].previousSibling);
        }

        // "While node list's last member's nextSibling is invisible, append it to
        // node list."
        while (utils.isInvisible(nodeList[nodeList.length - 1].nextSibling)) {
            nodeList.push(nodeList[nodeList.length - 1].nextSibling);
        }

        // "If the previousSibling of the first member of node list is editable and
        // running sibling criteria on it returns true, let new parent be the
        // previousSibling of the first member of node list."
        let newParent;
        if (utils.isEditable(nodeList[0].previousSibling)
        && siblingCriteria(nodeList[0].previousSibling)) {
            newParent = nodeList[0].previousSibling;

        // "Otherwise, if the nextSibling of the last member of node list is
        // editable and running sibling criteria on it returns true, let new parent
        // be the nextSibling of the last member of node list."
        } else if (utils.isEditable(nodeList[nodeList.length - 1].nextSibling)
        && siblingCriteria(nodeList[nodeList.length - 1].nextSibling)) {
            newParent = nodeList[nodeList.length - 1].nextSibling;

        // "Otherwise, run new parent instructions, and let new parent be the
        // result."
        } else {
            newParent = newParentInstructions();
        }

        // "If new parent is null, abort these steps and return null."
        if (!newParent) {
            return null;
        }

        // "If new parent's parent is null:"
        if (!newParent.parentNode) {
            // "Insert new parent into the parent of the first member of node list
            // immediately before the first member of node list."
            nodeList[0].parentNode.insertBefore(newParent, nodeList[0]);

            // "If any range has a boundary point with node equal to the parent of
            // new parent and offset equal to the index of new parent, add one to
            // that boundary point's offset."
            //
            // Only try to fix the global range.
            if (selection.range.startContainer == newParent.parentNode
            && selection.range.startOffset == utils.getNodeIndex(newParent)) {
                selection.range.setStart(selection.range.startContainer, selection.range.startOffset + 1);
            }
            if (selection.range.endContainer == newParent.parentNode
            && selection.range.endOffset == utils.getNodeIndex(newParent)) {
                selection.range.setEnd(selection.range.endContainer, selection.range.endOffset + 1);
            }
        }

        // "Let original parent be the parent of the first member of node list."
        let originalParent = nodeList[0].parentNode;

        // "If new parent is before the first member of node list in tree order:"
        if (utils.isBefore(newParent, nodeList[0])) {
            // "If new parent is not an inline node, but the last visible child of
            // new parent and the first visible member of node list are both inline
            // nodes, and the last child of new parent is not a br, call
            // createElement("br") on the ownerDocument of new parent and append
            // the result as the last child of new parent."
            if (!utils.isInlineNode(newParent)
            && utils.isInlineNode([].filter.call(newParent.childNodes, utils.isVisible).slice(-1)[0])
            && utils.isInlineNode(nodeList.filter(utils.isVisible)[0])
            && !utils.isHtmlElement(newParent.lastChild, "BR")) {
                newParent.appendChild(newParent.ownerDocument.createElement("br"));
            }

            // "For each node in node list, append node as the last child of new
            // parent, preserving ranges."
            for (let i = 0; i < nodeList.length; i++) {
                selection.movePreservingRanges(nodeList[i], newParent, -1);
            }

        // "Otherwise:"
        } else {
            // "If new parent is not an inline node, but the first visible child of
            // new parent and the last visible member of node list are both inline
            // nodes, and the last member of node list is not a br, call
            // createElement("br") on the ownerDocument of new parent and insert
            // the result as the first child of new parent."
            if (!utils.isInlineNode(newParent)
            && utils.isInlineNode([].filter.call(newParent.childNodes, utils.isVisible)[0])
            && utils.isInlineNode(nodeList.filter(utils.isVisible).slice(-1)[0])
            && !utils.isHtmlElement(nodeList[nodeList.length - 1], "BR")) {
                newParent.insertBefore(newParent.ownerDocument.createElement("br"), newParent.firstChild);
            }

            // "For each node in node list, in reverse order, insert node as the
            // first child of new parent, preserving ranges."
            for (let i = nodeList.length - 1; i >= 0; i--) {
                selection.movePreservingRanges(nodeList[i], newParent, 0);
            }
        }

        // "If original parent is editable and has no children, remove it from its
        // parent."
        if (utils.isEditable(originalParent) && !originalParent.hasChildNodes()) {
            originalParent.parentNode.removeChild(originalParent);
        }

        // "If new parent's nextSibling is editable and running sibling criteria on
        // it returns true:"
        if (utils.isEditable(newParent.nextSibling)
        && siblingCriteria(newParent.nextSibling)) {
            // "If new parent is not an inline node, but new parent's last child
            // and new parent's nextSibling's first child are both inline nodes,
            // and new parent's last child is not a br, call createElement("br") on
            // the ownerDocument of new parent and append the result as the last
            // child of new parent."
            if (!utils.isInlineNode(newParent)
            && utils.isInlineNode(newParent.lastChild)
            && utils.isInlineNode(newParent.nextSibling.firstChild)
            && !utils.isHtmlElement(newParent.lastChild, "BR")) {
                newParent.appendChild(newParent.ownerDocument.createElement("br"));
            }

            // "While new parent's nextSibling has children, append its first child
            // as the last child of new parent, preserving ranges."
            while (newParent.nextSibling.hasChildNodes()) {
                selection.movePreservingRanges(newParent.nextSibling.firstChild, newParent, -1);
            }

            // "Remove new parent's nextSibling from its parent."
            newParent.parentNode.removeChild(newParent.nextSibling);
        }

        // "Remove extraneous line breaks from new parent."
        utils.removeExtraneousLineBreaksFrom(newParent);

        // "Return new parent."
        return newParent;
    }

    // 应用当前结果
    function pushDownValues(node, command, newValue) {
        // 如果节点的父级不是元素，则中止该算法。
        if (!node.parentNode
        || node.parentNode.nodeType != Node.ELEMENT_NODE) {
            return;
        }

        // 如果当前命令有效，并且和旧的元素上的值通过松散匹配相等，就不设置
        if (areLooselyEquivalentValues(command, getEffectiveCommandValue(node, command), newValue)) {
            return;
        }

        // 获得公共祖先
        let currentAncestor = node.parentNode;

        // 初始化 ancestor list 为空
        let ancestorList = [];


        // 递归找到最远的父节点，如果当前新的 command 不等于旧值，则将父节点加入到 ancestorList
        while (utils.isEditable(currentAncestor)
        && currentAncestor.nodeType == Node.ELEMENT_NODE
        && !areLooselyEquivalentValues(command, getEffectiveCommandValue(currentAncestor, command), newValue)) {
            ancestorList.push(currentAncestor);
            currentAncestor = currentAncestor.parentNode;
        }

        // 如果没有待更新至，返回
        if (!ancestorList.length) {
            return;
        }

        // 因为 dom 节点样式都是继承的。所以返回 ancestorList 最后一个元素即最远的祖先节点
        let propagatedValue = getSpecifiedCommandValue(ancestorList[ancestorList.length - 1], command);

        // 如果 propagatedValue 是 null 并且不等于新的值，就终止
        if (propagatedValue === null && propagatedValue != newValue) {
            return;
        }

        // 如果命令的值有效，并且公共的祖先节点松散匹配不等于新的结果，这时新的结果也不是空值，就终止
        if (newValue !== null
        && !areLooselyEquivalentValues(command, getEffectiveCommandValue(ancestorList[ancestorList.length - 1].parentNode, command), newValue)) {
            return;
        }

        // 清空 ancestorList 栈
        while (ancestorList.length) {
            let currentAncestor = ancestorList.pop();

            // 出栈过程中，如果某个节点含有指定的样式，就设置指定的传播值
            if (getSpecifiedCommandValue(currentAncestor, command) !== null) {
                propagatedValue = getSpecifiedCommandValue(currentAncestor, command);
            }

            let children = Array.prototype.slice.call(currentAncestor.childNodes);

            // 如果command的当前祖先的指定命令值不为空，则清除当前祖先的值。
            if (getSpecifiedCommandValue(currentAncestor, command) !== null) {
                clearValue(currentAncestor, command);
            }

            // 处理每个 children
            for (let i = 0; i < children.length; i++) {
                let child = children[i];

                // 如果 chide == node, 跳过当前处理
                if (child == node) {
                    continue;
                }

                // 如果 child 是一个 Element，其 command 的指定命令值既不为空也不等同于 propagatedVale，则继续下一个 child。
                if (child.nodeType == Node.ELEMENT_NODE
                && getSpecifiedCommandValue(child, command) !== null
                && !areEquivalentValues(command, propagatedValue, getSpecifiedCommandValue(child, command))) {
                    continue;
                }

                // 如果 child == ancestorList[ancestorList.length - 1]，跳过
                if (child == ancestorList[ancestorList.length - 1]) {
                    continue;
                }

                // 强制使用 child 的值，并且更新 新值等于传播的值。
                forceValue(child, command, propagatedValue);
            }
        }
    }


    function recordCurrentOverrides() {
        // 初始化overrides
        let overrides = [];

        // 优先处理超链接
        if (internalOverride.getValueOverride("createlink") !== undefined) {
            overrides.push(["createlink", internalOverride.getValueOverride("createlink")]);
        }


        // 这些值只有 true 和 false
        const verifyState = ["bold", "italic", "strikethrough", "subscript", "superscript", "underline"]
        verifyState.forEach(function(command) {
            if (internalOverride.getStateOverride(command) !== undefined) {
                overrides.push([command, internalOverride.getStateOverride(command)]);
            }
        });

        // 这些是有值的
        const verifyValue = ["fontname", "fontsize", "forecolor", "hilitecolor"]
        verifyValue.forEach(function(command) {
            if (internalOverride.getValueOverride(command) !== undefined) {
                overrides.push([command, internalOverride.getValueOverride(command)]);
            }
        });

        return overrides;
    }

    function restoreStatesAndValues(overrides) {
        // "Let node be the first formattable node effectively contained in the
        // active range, or null if there is none."
        let node = utils.getAllEffectivelyContainedNodes(selection.getActiveRange())
            .filter(utils.isFormattableNode)[0];

        // "If node is not null, then for each (command, override) pair in
        // overrides, in order:"
        if (node) {
            for (let i = 0; i < overrides.length; i++) {
                let command = overrides[i][0];
                let override = overrides[i][1];

                // "If override is a boolean, and queryCommandState(command)
                // returns something different from override, take the action for
                // command, with value equal to the empty string."
                if (typeof override == "boolean"
                && queryCommandState(command) != override) {
                    commands.get(command).action("");

                // "Otherwise, if override is a string, and command is neither
                // "createLink" nor "fontSize", and queryCommandValue(command)
                // returns something not equivalent to override, take the action
                // for command, with value equal to override."
                } else if (typeof override == "string"
                && command != "createlink"
                && command != "fontsize"
                && !areEquivalentValues(command, queryCommandValue(command), override)) {
                    commands.get(command).action(override);

                // "Otherwise, if override is a string; and command is
                // "createLink"; and either there is a value override for
                // "createLink" that is not equal to override, or there is no value
                // override for "createLink" and node's effective command value for
                // "createLink" is not equal to override: take the action for
                // "createLink", with value equal to override."
                } else if (typeof override == "string"
                && command == "createlink"
                && (
                    (
                        internalOverride.getValueOverride("createlink") !== undefined
                        && internalOverride.getValueOverride("createlink") !== override
                    ) || (
                        internalOverride.getValueOverride("createlink") === undefined
                        && getEffectiveCommandValue(node, "createlink") !== override
                    )
                )) {
                    commands.get('createlink').action(override);

                // "Otherwise, if override is a string; and command is "fontSize";
                // and either there is a value override for "fontSize" that is not
                // equal to override, or there is no value override for "fontSize"
                // and node's effective command value for "fontSize" is not loosely
                // equivalent to override:"
                } else if (typeof override == "string"
                && command == "fontsize"
                && (
                    (
                        internalOverride.getValueOverride("fontsize") !== undefined
                        && internalOverride.getValueOverride("fontsize") !== override
                    ) || (
                        internalOverride.getValueOverride("fontsize") === undefined
                        && !areLooselyEquivalentValues(command, getEffectiveCommandValue(node, "fontsize"), override)
                    )
                )) {
                    // "Convert override to an integer number of pixels, and set
                    // override to the legacy font size for the result."
                    override = utils.getLegacyFontSize(override);

                    // "Take the action for "fontSize", with value equal to
                    // override."
                    commands.get('fontsize').action(override);

                // "Otherwise, continue this loop from the beginning."
                } else {
                    continue;
                }

                // "Set node to the first formattable node effectively contained in
                // the active range, if there is one."
                node = utils.getAllEffectivelyContainedNodes(selection.getActiveRange())
                    .filter(utils.isFormattableNode)[0]
                    || node;
            }

        // "Otherwise, for each (command, override) pair in overrides, in order:"
        } else {
            for (let i = 0; i < overrides.length; i++) {
                let command = overrides[i][0];
                let override = overrides[i][1];

                // "If override is a boolean, set the state override for command to
                // override."
                if (typeof override == "boolean") {
                    internalOverride.setStateOverride(command, override);
                }

                // "If override is a string, set the value override for command to
                // override."
                if (typeof override == "string") {
                    internalOverride.setValueOverride(command, override);
                }
            }
        }
    }

    function recordCurrentStatesAndValues() {
        // "Let overrides be a list of (string, string or boolean) ordered pairs,
        // initially empty."
        let overrides = [];

        // "Let node be the first formattable node effectively contained in the
        // active range, or null if there is none."
        let node = utils.getAllEffectivelyContainedNodes(selection.getActiveRange())
            .filter(utils.isFormattableNode)[0];

        // "If node is null, return overrides."
        if (!node) {
            return overrides;
        }

        // "Add ("createLink", node's effective command value for "createLink") to
        // overrides."
        overrides.push(["createlink", getEffectiveCommandValue(node, "createlink")]);

        // "For each command in the list "bold", "italic", "strikethrough",
        // "subscript", "superscript", "underline", in order: if node's effective
        // command value for command is one of its inline command activated values,
        // add (command, true) to overrides, and otherwise add (command, false) to
        // overrides."
        ["bold", "italic", "strikethrough", "subscript", "superscript",
        "underline"].forEach(function(command) {
            if (commands.get(command).inlineCommandActivatedValues
            .indexOf(getEffectiveCommandValue(node, command)) != -1) {
                overrides.push([command, true]);
            } else {
                overrides.push([command, false]);
            }
        });

        // "For each command in the list "fontName", "foreColor", "hiliteColor", in
        // order: add (command, command's value) to overrides."
        ["fontname", "fontsize", "forecolor", "hilitecolor"].forEach(function(command) {
            overrides.push([command, commands.get(command).value()]);
        });

        // "Add ("fontSize", node's effective command value for "fontSize") to
        // overrides."
        overrides.push(["fontsize", getEffectiveCommandValue(node, "fontsize")]);

        // "Return overrides."
        return overrides;
    }

    function setSelectionValue (command, newValue) {
        // console.log('%ccommand', 'color:red', editor.commands, command, newValue)
        // 如果选中范围中没有有效包含的格式表节点
        if (!utils.getAllEffectivelyContainedNodes(selection.getActiveRange())
            .some(utils.isFormattableNode)) {
            // 如果 command 具有内联命令激活值，则如果其中包含新值，则将状态替代设置为true，否则将其设置为false。
            if ("inlineCommandActivatedValues" in commands.get(command)) {
                internalOverride.setStateOverride(command, commands.get(command).inlineCommandActivatedValues
                    .indexOf(newValue) != -1);
            }

            // 如果 command 是 "subscript", 则覆盖 "superscript"
            if (command == "subscript") {
                internalOverride.unsetStateOverride("superscript");
            }

            // 如果 command 是 "superscript" 则覆盖 "subscript"
            if (command == "superscript") {
                internalOverride.unsetStateOverride("subscript");
            }

            // 如果新值是 null， 不覆盖
            if (newValue === null) {
                internalOverride.unsetValueOverride(command);

                // 其他情况，如果 command 是 'createLink' 或者特定的值，都替换为新的
            } else if (command == "createlink" || "value" in commands.get(command)) {
                internalOverride.setValueOverride(command, newValue);
            }

            // 终止此次操作
            return;
        }

        // 如果激活的选区中的起始节点是一个可编辑的文本节点，并且其起始偏移量既不是零也不是其起始节点的长度，
        // 则在活动范围的起始节点上调用 splitText()，参数等于活动范围的起始偏移量。
        // 然后设置当前激活的选区的起始节点并且应用设置的值，并且更新其起始偏移为零。
        const activedRange = selection.getActiveRange()
        if (utils.isEditable(activedRange.startContainer)
            && activedRange.startContainer.nodeType == Node.TEXT_NODE
            && activedRange.startOffset != 0
            && activedRange.startOffset != utils.getNodeLength(activedRange.startContainer)) {
            // 一些特定浏览器怪异规则
            let newActiveRange = document.createRange();
            let newNode;
            if (activedRange.startContainer == activedRange.endContainer) {
                let newEndOffset = activedRange.endOffset - activedRange.startOffset;
                newNode = (<Text>activedRange.startContainer).splitText(activedRange.startOffset);
                newActiveRange.setEnd(newNode, newEndOffset);
                activedRange.setEnd(newNode, newEndOffset);
            } else {
                newNode = (<Text>activedRange.startContainer).splitText(activedRange.startOffset);
            }
            newActiveRange.setStart(newNode, 0);
            getSelection().removeAllRanges();
            getSelection().addRange(newActiveRange);

            activedRange.setStart(newNode, 0);
        }

        // 如果激活选区中结束节点是一个可以编辑的文本节点，并且他的 endoffset 偏移量不是 0也不是其结束位置
        // 则调用 splitText()，参数等于结束的偏移量
        if (utils.isEditable(activedRange.endContainer)
            && activedRange.endContainer.nodeType == Node.TEXT_NODE
            && activedRange.endOffset != 0
            && activedRange.endOffset != utils.getNodeLength(activedRange.endContainer)) {
            // 处理 IE 问题
            // IE 选区范围异常，所以要重新修正选区范围
            // 在调用 getActiveRange 之前先 splitText 然后更正选区
            let activeRange = activedRange;
            let newStart: [Node, number] = [activeRange.startContainer, activeRange.startOffset];
            let newEnd: [Node, number] = [activeRange.endContainer, activeRange.endOffset];
            (<Text>activeRange.endContainer).splitText(activeRange.endOffset);
            activeRange.setStart(newStart[0], newStart[1]);
            activeRange.setEnd(newEnd[0], newEnd[1]);

            getSelection().removeAllRanges();
            getSelection().addRange(activeRange);
        }

        // 获取所有有效包含的 nodeList
        // 优先清除所有的值
        utils.getAllEffectivelyContainedNodes(activedRange, function (node) {
            return utils.isEditable(node) && node.nodeType == Node.ELEMENT_NODE;
        }).forEach(function (element) {
            clearValue(element, command);
        });

        // "Let node list be all editable nodes effectively contained in the active
        // range.
        //
        // "For each node in node list:"
        utils.getAllEffectivelyContainedNodes(activedRange, utils.isEditable).forEach(function (node) {
            // "Push down values on node."
            pushDownValues(node, command, newValue);

            // "If node is an allowed child of span, force the value of node."
            if (utils.isAllowedChild(node, "span")) {
                forceValue(node, command, newValue);
            }
        });
    }



    function preset() {
        for (const [command, module] of commands) {
            // 如果没有设置对应的 css 属性，就给默认值 null
            if (!("relevantCssProperty" in module)) {
                module.relevantCssProperty = null;
            }

            // 如果一个命令定义了内联命令激活值但没有其他定义何时它是不确定的，
            // 则不确定在有效包含在活动范围内的可格式化节点中，是否至少有一个其有效命令值是给定值之一
            // 并且至少其有效命令值不是给定值之一
            if ("inlineCommandActivatedValues" in module
            && !("indeterm" in module)) {
                module.indeterm = function() {
                    if (!selection.getActiveRange()) {
                        return false;
                    }

                    let values = utils.getAllEffectivelyContainedNodes(selection.getActiveRange(), utils.isFormattableNode)
                        .map(function(node) { return getEffectiveCommandValue(node, command) });

                    let matchingValues = values.filter(function(value) {
                        return module.inlineCommandActivatedValues.indexOf(value) != -1;
                    });

                    return matchingValues.length >= 1
                        && values.length - matchingValues.length >= 1;
                };
            }

            // 如果一个命令定义了内联命令激活值，如果活动范围中没有有效地包含可格式化节点，
            // 并且活动范围的起始节点的有效命令值是给定值之一，则其状态为真；
            // 或者如果在活动范围内有效包含至少一个可格式化的节点，并且所有这些节点的有效命令值等于给定值之一。
            if ("inlineCommandActivatedValues" in module) {
                module.state = function() {
                    if (!selection.getActiveRange()) {
                        return false;
                    }

                    let nodes = utils.getAllEffectivelyContainedNodes(selection.getActiveRange(), utils.isFormattableNode);

                    if (nodes.length == 0) {
                        return module.inlineCommandActivatedValues
                            .indexOf(getEffectiveCommandValue(selection.getActiveRange().startContainer, command)) != -1;
                    } else {
                        return nodes.every(function(node) {
                            return module.inlineCommandActivatedValues
                                .indexOf(getEffectiveCommandValue(node, command)) != -1;
                        });
                    }
                };
            }


            // 如果命令是标准内联值命令，则不确定在有效包含在活动范围内的可格式化节点中，是否有两个具有不同的有效命令值。
            // 它的值是有效包含在活动范围内的第一个可格式化节点的有效命令值；
            // 或者如果没有这样的节点，活动范围的起始节点的有效命令值；
            // 或者如果它为空，则为空字符串。”
            if ("standardInlineValueCommand" in module) {
                module.indeterm = function() {
                    if (!selection.getActiveRange()) {
                        return false;
                    }

                    let values = utils.getAllEffectivelyContainedNodes(selection.getActiveRange())
                        .filter(utils.isFormattableNode)
                        .map(function(node) { return getEffectiveCommandValue(node, command) });
                    for (let i = 1; i < values.length; i++) {
                        if (values[i] != values[i - 1]) {
                            return true;
                        }
                    }
                    return false;
                };

                module.value = function() {
                    if (!selection.getActiveRange()) {
                        return "";
                    }

                    let refNode = utils.getAllEffectivelyContainedNodes(selection.getActiveRange(), utils.isFormattableNode)[0];

                    if (typeof refNode == "undefined") {
                        refNode = selection.getActiveRange().startContainer;
                    }

                    let ret = getEffectiveCommandValue(refNode, command);
                    if (ret === null) {
                        return "";
                    }
                    return ret;
                };
            }

            if ("preservesOverrides" in module) {
                let oldAction = module.action;

                module.action = function(value) {
                    let overrides = recordCurrentOverrides();
                    let ret = oldAction(value);
                    if (utils.getActiveRange().collapsed) {
                        restoreStatesAndValues(overrides);
                    }
                    return ret;
                };
            }
        }
    }

    const exports = {
        internalOverride,
        registryCommand,
        execCommand,
        queryCommandEnabled,
        queryCommandIndeterm,
        queryCommandState,
        queryCommandSupported,
        queryCommandValue,
        areEquivalentValues,
        areLooselyEquivalentValues,
        clearValue,
        pushDownValues,
        setSelectionValue,
        forceValue,
        preset,
    }
    return exports
}

export {
    NativeCommands
}
