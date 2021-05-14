
import Editor from '../../editor';

// 当前编辑器的全局 range
let internalRange = null

const NativeSelection = (editor: Editor) => {
  const { dom, utils, fragment_root } = editor
  const { root } = dom.fragment


  let extraRanges = [];

  // magic, I don't know if this is great 直接覆盖好吗？
  const getSelection = function (): Selection {
    return (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE
        && root.getSelection())
        || window.getSelection()
  }

  const getActiveDocument = (rangeNode: Node) => {
    return (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE
        && root)
        || rangeNode.ownerDocument
  }

  const getActiveRange = () => {
    let ret: Range;
    if(internalRange) {
      ret = internalRange;
    } else if(getSelection().rangeCount) {
      ret = getSelection().getRangeAt(0);
    } else {
      return null;
    }
    if ([Node.TEXT_NODE, Node.ELEMENT_NODE].indexOf(ret.startContainer.nodeType) == -1
    || [Node.TEXT_NODE, Node.ELEMENT_NODE].indexOf(ret.endContainer.nodeType) == -1
    || !getActiveDocument(ret.startContainer)
    || !getActiveDocument(ret.endContainer)
    || !utils.isDescendant(ret.startContainer, getActiveDocument(ret.startContainer))
    || !utils.isDescendant(ret.endContainer, getActiveDocument(ret.endContainer))) {
        throw "Invalid active range in getActiveRange; test bug? 魔法？";
    }
    return ret;
  }

  const setActiveRange  = (range) => {
    internalRange = range
  }

  const collapse = (toStart: boolean = false) =>{
    return toStart ? getSelection().collapseToStart() : getSelection().collapseToEnd()
  }

  const setCursorLocation = (parentNode: Node, offset?: number) => getSelection().collapse(parentNode, offset);

  const selectAllChildren = (parentNode: Node) => getSelection().selectAllChildren(parentNode)

  // 移动并且保存 range 范围
  const movePreservingRanges = (node, newParent, newIndex) => {
    // 为了方便起见，我将 newIndex 设为 -1 表示“在末尾插入”。
    if (newIndex == -1) {
        newIndex = newParent.childNodes.length;
    }

    // 当用户代理要将节点移动到新位置并保留范围时，它必须从原始父节点（如果有）中删除该节点，
    // 然后将其插入新位置。 但是，在这样做时，它必须忽略常规范围突变规则，而应遵循这些规则

    // 设节点为已移动节点，旧父级和旧索引为旧父级（可以为null）和索引，新父级和新索引为新父级和索引
    let oldParent = node.parentNode;
    let oldIndex = utils.getNodeIndex(node);

    // 我们保留全局范围对象，所选内容中的范围以及extraRanges数组中的任何范围。
    // 其他任何范围都不会更新，因为我们没有对它们的引用。
    let ranges = [internalRange].concat(extraRanges);
    for (let i = 0; i < getSelection().rangeCount; i++) {
        ranges.push(getSelection().getRangeAt(i));
    }
    let boundaryPoints = [];
    ranges.forEach(function(range) {
        boundaryPoints.push([range.startContainer, range.startOffset]);
        boundaryPoints.push([range.endContainer, range.endOffset]);
    });

    boundaryPoints.forEach(function(boundaryPoint) {
        // 如果边界点的节点与节点相同或为节点的后代，则使其保持不变，以便移至新位置。

        // 无需修改。

        // 如果边界点节点是新的父节点，并且其偏移量大于新的索引，则在其偏移量上增加一个
        if (boundaryPoint[0] == newParent
        && boundaryPoint[1] > newIndex) {
            boundaryPoint[1]++;
        }

        // 如果边界点的节点是旧父节点，并且其偏移量是旧索引或旧索引+ 1，则将其节点设置为新父节点，并向其偏移量添加 新索引 - 旧索引。
        if (boundaryPoint[0] == oldParent
        && (boundaryPoint[1] == oldIndex
        || boundaryPoint[1] == oldIndex + 1)) {
            boundaryPoint[0] = newParent;
            boundaryPoint[1] += newIndex - oldIndex;
        }

        // 如果边界点的节点是旧父节点，并且其偏移量大于旧索引+1，则从其偏移量中减去一个。
        if (boundaryPoint[0] == oldParent
        && boundaryPoint[1] > oldIndex + 1) {
            boundaryPoint[1]--;
        }
    });

    // 现在实际移动它并保留范围
    if (newParent.childNodes.length == newIndex) {
        newParent.appendChild(node);
    } else {
        newParent.insertBefore(node, newParent.childNodes[newIndex]);
    }

    internalRange.setStart(boundaryPoints[0][0], boundaryPoints[0][1]);
    internalRange.setEnd(boundaryPoints[1][0], boundaryPoints[1][1]);

    for (let i = 0; i < extraRanges.length; i++) {
        extraRanges[i].setStart(boundaryPoints[2*i + 2][0], boundaryPoints[2*i + 2][1]);
        extraRanges[i].setEnd(boundaryPoints[2*i + 3][0], boundaryPoints[2*i + 3][1]);
    }

    getSelection().removeAllRanges();
    for (let i = 1 + extraRanges.length; i < ranges.length; i++) {
        let newRange = document.createRange();
        newRange.setStart(boundaryPoints[2*i][0], boundaryPoints[2*i][1]);
        newRange.setEnd(boundaryPoints[2*i + 1][0], boundaryPoints[2*i + 1][1]);
        getSelection().addRange(newRange);
    }
  }

  const setTagName = (element, newName) => {
    // 如果元素是本地名称等于新名称的HTML元素，则返回元素
    if (utils.isHtmlElement(element, newName.toUpperCase())) {
        return element;
    }

    // 如果element的父元素为null，则返回element。
    if (!element.parentNode) {
        return element;
    }

    // 令替换元素成为在元素的 ownerDocument 上调用createElement（new name）的结果。
    let replacementElement = element.ownerDocument.createElement(newName);

    // 将替换元素立即插入元素的父元素中
    element.parentNode.insertBefore(replacementElement, element);

    // 按顺序将元素的所有属性复制到替换元素
    for (let i = 0; i < element.attributes.length; i++) {
        replacementElement.setAttributeNS(element.attributes[i].namespaceURI, element.attributes[i].name, element.attributes[i].value);
    }

    // 当元素具有子元素时，将元素的第一个子元素追加为替换元素的最后一个子元素，并保留范围。
    while (element.childNodes.length) {
        movePreservingRanges(element.firstChild, replacementElement, replacementElement.childNodes.length);
    }

    // 从其父元素中删除元素。
    element.parentNode.removeChild(element);

    // 返回替换元素
    return replacementElement;
  }

  // 在节点之前删除多余的换行符
  const removeExtraneousLineBreaksBefore = (node) =>{
    // 令ref为节点的previousSibling。
    let ref = node.previousSibling;

    // 如果ref为null，请中止这些步骤。
    if (!ref) {
        return;
    }

    // 当ref有孩子时，请将ref设置为其lastChild。
    while (ref.hasChildNodes()) {
        ref = ref.lastChild;
    }

    // 虽然ref是不可见的，但不是多余的换行符，并且ref不等于节点的父节点，但请按树顺序将ref设置为该节点之前的节点。
    while (utils.isInvisible(ref)
    && !utils.isExtraneousLineBreak(ref)
    && ref != node.parentNode) {
        ref = utils.previousNode(ref);
    }

    // 如果ref是可编辑的外部换行符，请将其从其父级中删除
    if (utils.isEditable(ref)
    && utils.isExtraneousLineBreak(ref)) {
        ref.parentNode.removeChild(ref);
    }
  }

  // 删除节点末端的多余换行符
  const removeExtraneousLineBreaksAtTheEndOf = (node) => {
    // 让 ref = node
    let ref = node;

    // 当 ref 有孩子时，请将 ref 设置为其 lastChild。
    while (ref.hasChildNodes()) {
        ref = ref.lastChild;
    }

    // 虽然 ref 是不可见的，但不是多余的换行符，而 ref 是不相等的节点，请以树顺序将ref设置为该节点之前的节点。
    while (utils.isInvisible(ref)
    && !utils.isExtraneousLineBreak(ref)
    && ref != node) {
        ref = utils.previousNode(ref);
    }

    // 如果 ref 是可编辑的外部换行符
    if (utils.isEditable(ref)
    && utils.isExtraneousLineBreak(ref)) {
        // 当ref的父级是可编辑且不可见的时，请将ref设置为其父级。
        while (utils.isEditable(ref.parentNode)
        && utils.isInvisible(ref.parentNode)) {
            ref = ref.parentNode;
        }

        // 从其父级移除ref。
        ref.parentNode.removeChild(ref);
    }
  }
  // 要从节点上删除多余的换行符，请先删除该节点之前的多余的换行符，然后再在其末尾删除多余的换行符。
  const removeExtraneousLineBreaksFrom = (node) => {
    removeExtraneousLineBreaksBefore(node);
    removeExtraneousLineBreaksAtTheEndOf(node);
  }
  // 包装节点列表
  // siblingCriteria： 兄弟姐妹
  // newParentInstructions： 新父节点
  const wrap = (nodeList, siblingCriteria, newParentInstructions) => {
    // 如果未提供，则同级条件返回 false，而新的父指令返回null
    if (typeof siblingCriteria == "undefined") {
        siblingCriteria = function() { return false };
    }
    if (typeof newParentInstructions == "undefined") {
        newParentInstructions = function() { return null };
    }

    // 如果节点列表的每个成员都不可见，并且都不是br，则返回null并中止这些步骤。
    if (nodeList.every(utils.isInvisible)
    && !nodeList.some(function(node) { return utils.isHtmlElement(node, "br") })) {
        return null;
    }

    // 如果节点列表的第一个成员的父级为null，则返回null并中止这些步骤。
    if (!nodeList[0].parentNode) {
        return null;
    }

    // “如果节点列表的最后一个成员是不是br的内联节点，并且节点列表的最后一个成员的nextSibling是br，则将该br附加到节点列表中。”
    if (utils.isInlineNode(nodeList[nodeList.length - 1])
    && !utils.isHtmlElement(nodeList[nodeList.length - 1], "br")
    && utils.isHtmlElement(nodeList[nodeList.length - 1].nextSibling, "br")) {
        nodeList.push(nodeList[nodeList.length - 1].nextSibling);
    }

    // 虽然节点列表的第一个成员的上一个同级兄弟是不可见的，但在前面它到节点列表
    while (utils.isInvisible(nodeList[0].previousSibling)) {
        nodeList.unshift(nodeList[0].previousSibling);
    }

    // 当节点列表的最后一个成员的nextSibling不可见时，请将其追加到节点列表中。
    while (utils.isInvisible(nodeList[nodeList.length - 1].nextSibling)) {
        nodeList.push(nodeList[nodeList.length - 1].nextSibling);
    }

    // 如果节点列表的第一个成员的previousSibling是可编辑的，并且在其上运行同级条件将返回true，
    // 让新的父级成为节点列表的第一个成员的previousSibling
    let newParent;
    if (utils.isEditable(nodeList[0].previousSibling)
    && siblingCriteria(nodeList[0].previousSibling)) {
        newParent = nodeList[0].previousSibling;

    // 否则，如果节点列表的最后一个成员的nextSibling是可编辑的，并且在其上运行的兄弟姐妹条件返回true，
    // 则让新的父节点成为节点列表的最后一个成员的nextSibling。
    } else if (utils.isEditable(nodeList[nodeList.length - 1].nextSibling)
    && siblingCriteria(nodeList[nodeList.length - 1].nextSibling)) {
        newParent = nodeList[nodeList.length - 1].nextSibling;

    // 否则，请运行新的父代指令，并让新的父代成为结果。
    } else {
        newParent = newParentInstructions();
    }

    // 如果new parent为null，请中止这些步骤并返回null。
    if (!newParent) {
        return null;
    }

    // 如果新父节点的父节点为空：
    if (!newParent.parentNode) {
        // 在节点列表的第一个成员之前，将新的父节点插入到节点列表的第一个成员的父节点中
        nodeList[0].parentNode.insertBefore(newParent, nodeList[0]);

        // 如果任何范围的边界点的节点等于新父级的父级，而偏移量等于新父级的索引，则在该边界点的偏移量上加一个。

        // 仅尝试修复全局Range
        if (internalRange.startContainer == newParent.parentNode
        && internalRange.startOffset == utils.getNodeIndex(newParent)) {
          internalRange.setStart(internalRange.startContainer, internalRange.startOffset + 1);
        }
        if (internalRange.endContainer == newParent.parentNode
        && internalRange.endOffset == utils.getNodeIndex(newParent)) {
          internalRange.setEnd(internalRange.endContainer, internalRange.endOffset + 1);
        }
    }

    // 令原始父节点为节点列表的第一个成员的父节点。
    let originalParent = nodeList[0].parentNode;

    // 如果新的父级按树顺序在节点列表的第一个成员之前
    if (utils.isBefore(newParent, nodeList[0])) {
      // 如果新父级不是内联节点，但是新父级的最后一个可见子级和节点列表的第一个可见成员都是内联节点，
      // 并且新父级的最后一个子级不是 br，请在以下位置调用createElement（“ br”）
      // 新父级的 ownerDocument 并将结果附加为新父级的最后一个子级。
      if (!utils.isInlineNode(newParent)
      && utils.isInlineNode([].filter.call(newParent.childNodes, utils.isVisible).slice(-1)[0])
      && utils.isInlineNode(nodeList.filter(utils.isVisible)[0])
      && !utils.isHtmlElement(newParent.lastChild, "BR")) {
          newParent.appendChild(newParent.ownerDocument.createElement("br"));
      }

      // 对于节点列表中的每个节点，将节点追加为新父节点的最后一个子节点，以保留范围。
      for (let i = 0; i < nodeList.length; i++) {
          movePreservingRanges(nodeList[i], newParent, -1);
      }

    // 其他情况
    } else {
        // “如果新的父级不是内联节点，但是新的父级的第一个可见子级和节点列表的最后一个可见成员都是内联节点，
        // 并且节点列表的最后一个成员不是br，请调用createElement（“ br”） 在新父项的ownerDocument上，并将结果作为新父项的第一个子项插入。”
        if (!utils.isInlineNode(newParent)
        && utils.isInlineNode([].filter.call(newParent.childNodes, utils.isVisible)[0])
        && utils.isInlineNode(nodeList.filter(utils.isVisible).slice(-1)[0])
        && !utils.isHtmlElement(nodeList[nodeList.length - 1], "BR")) {
            newParent.insertBefore(newParent.ownerDocument.createElement("br"), newParent.firstChild);
        }

        // 对于节点列表中的每个节点，以相反的顺序，将节点插入为新父节点的第一个子节点，并保留范围。
        for (let i = nodeList.length - 1; i >= 0; i--) {
            movePreservingRanges(nodeList[i], newParent, 0);
        }
    }

    // 如果原始父级是可编辑的并且没有子级，则将其从其父级中删除
    if (utils.isEditable(originalParent) && !originalParent.hasChildNodes()) {
        originalParent.parentNode.removeChild(originalParent);
    }

    // 如果新父级节点的 nextSibling 是可编辑的，并且在其上运行兄弟姐妹条件，则返回true
    if (utils.isEditable(newParent.nextSibling)
    && siblingCriteria(newParent.nextSibling)) {
        // 如果新父母不是内联节点，但是新父母的最后一个孩子和新父母的nextSibling的第一个孩子都是内联节点，而新父母的最后一个孩子也不是br，请在新父母的ownerDocument上调用createElement（“ br”） 将结果附加为新父母的最后一个孩子。
        if (!utils.isInlineNode(newParent)
        && utils.isInlineNode(newParent.lastChild)
        && utils.isInlineNode(newParent.nextSibling.firstChild)
        && !utils.isHtmlElement(newParent.lastChild, "BR")) {
            newParent.appendChild(newParent.ownerDocument.createElement("br"));
        }

        // “尽管新父母的 nextSibling 有孩子，但将其第一个孩子追加为新父母的最后一个孩子，以保留范围
        while (newParent.nextSibling.hasChildNodes()) {
            movePreservingRanges(newParent.nextSibling.firstChild, newParent, -1);
        }

        // 从其父级中删除新父级的 nextSibling
        newParent.parentNode.removeChild(newParent.nextSibling);
    }

    // 从新的父级中删除多余的换行符
    removeExtraneousLineBreaksFrom(newParent);

    // Return new parent
    return newParent;
  }



  const exports = {
    get range () {
      return internalRange
    },
    selection: getSelection(),
    root,
    collapse,
    getActiveRange,
    setActiveRange,
    setCursorLocation,
    selectAllChildren,
    getSelection,
    wrap
  }

  return exports
}


export {
  NativeSelection
}
