const htmlNamespace = 'http://www.w3.org/1999/xhtml';

// 禁止子节点名称
const prohibitedParagraphChildNames = [
  "address", "article", "aside",
  "blockquote", "caption", "center", "col", "colgroup", "dd", "details",
  "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer",
  "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "li",
  "listing", "menu", "nav", "ol", "p", "plaintext", "pre", "section",
  "summary", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
  "xmp"];

/**
 * @description 是否是 html 命名空间
 * @param ns
 * @returns
 */
function isHtmlNamespace(ns: string | null): boolean {
  return (ns === null ||
    ns === htmlNamespace
  )
}

/**
 * @description 判断当前节点是否是 一个特定 html 元素 ['OL', 'UL']
 * @param node
 * @param tags
 * @returns
 */
function isHtmlElement(node, tags?: string | string[] | undefined): boolean {

  if (typeof tags === 'string') {
    tags = [tags]
  }
  if (typeof tags === 'object') {
    tags = tags.map(function (tag) {
      return tag.toUpperCase()
    });
  }
  // 如果 node 存在并且是一个 element，并且要满足命名空间是 xhtml,之后再对传入的 tags 做判断
  return node
    && node.nodeType === Node.ELEMENT_NODE
    && isHtmlNamespace(node.namespaceURI)
    && (typeof tags === 'undefined' || tags.includes(node.tagName))
}

/**
 * @description 不支持段落子代标签中存在子节点 tag
 * @param node
 * @returns
 */
function isProhibitedParagraphChild(node) {
  return isHtmlElement(node, prohibitedParagraphChildNames);
}

/**
 * @description 是块级元素吗
 * @param node
 * @returns boolean
 */
function isBlockNode(node) {

  const verify = ['inline', 'inline-block', 'inline-table', 'none']

  return node
    && ((node.nodeType === Node.ELEMENT_NODE && verify.includes(getComputedStyle(node).display) === false)
      || node.nodeType === Node.DOCUMENT_NODE
      || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE)
}

/**
 * @description 内联节点是不是块节点的节点
 * @param node
 * @returns
 */
function isInlineNode(node) {
  return node && !isBlockNode(node);
}

/**
 * @description 是否可编辑元素
 * 1.一个用户可编辑的元素（例如一个使用 contenteditable 的HTML元素，或是在启用了 designMode 的 Document 的子元素）
 * @param node
 * @returns boolean
 *
 */
function isEditingHost(node) {
  return node
    && isHtmlElement(node)
    && (node.contentEditable === 'true'
      || (node.parentNode
        && node.parentNode.nodeType === Node.DOCUMENT_NODE
        && node.parentNode.designMode === 'on'));
}

/**
 * @description 是否可以被编辑
 * @param node
 * @returns boolean
 * 1.如果它是一个可编辑的节点，但不是可编辑的主要根节点
 * 2.它确实没有将 contenteditable 属性设置为 false 状态
 * 3.其父级是编辑根节点或可编辑的
 * 4.并且它是一个 HTML 元素，或者是一个 svg 或 math 元素，或者它不是 Element 且其父元素是 HTML 元素。
 */
function isEditable(node): boolean {
  return node
    && !isEditingHost(node)
    && (node.nodeType !== Node.ELEMENT_NODE || node.contentEditable !== 'false')
    && (isEditingHost(node.parentNode) || isEditable(node.parentNode))
    && (isHtmlElement(node)
      || (node.nodeType === Node.ELEMENT_NODE && node.namespaceURI === 'http://www.w3.org/2000/svg' && node.localName === 'svg')
      || (node.nodeType === Node.ELEMENT_NODE && node.namespaceURI === 'http://www.w3.org/1998/Math/MathML' && node.localName === 'math')
      || (node.nodeType !== Node.ELEMENT_NODE && isHtmlElement(node.parentNode)));
}

/**
 * @description 是否有可编辑的后代节点
 * @param node
 * @returns
 */
function hasEditableDescendants(node) {
  for (let i = 0; i < node.childNodes.length; i++) {
      if (isEditable(node.childNodes[i])
      || hasEditableDescendants(node.childNodes[i])) {
          return true;
      }
  }
  return false;
}
/**
 * @description
 * 1. 如果节点不可编辑，那么编辑根节点为 null
 * 2. 如果节点是编辑根节点，则返回节点本身
 * 3. 如果节点是可编辑的，则可编辑的根节点为该节点的最近祖先。
 * @param node
 * @returns
 */
function getEditingHostOf(node) {
  if (isEditingHost(node)) {
      return node;
  } else if (isEditable(node)) {
      let ancestor = node.parentNode;
      while (!isEditingHost(ancestor)) {
          ancestor = ancestor.parentNode;
      }
      return ancestor;
  } else {
      return null;
  }
}

/**
 * @description 是否拥有共同的可编辑根节点祖先
 * @param node1
 * @param node2
 * @returns
 */
function inSameEditingHost(node1, node2) {
  return getEditingHostOf(node1)
      && getEditingHostOf(node1) == getEditingHostOf(node2);
}


/**
 * @description 是否是折叠的空格
 * @param br
 * @returns
 */

function isCollapsedLineBreak(br) {
  if (!isHtmlElement(br, "br")) {
      return false;
  }

  // 在它后面添加一个zwsp(零宽空格)，看看这是否会改变最近的非内联父级的高度。
  // 注意：这实际上是不可靠的，因为父级可能有固定的高度或其他东西。
  let ref = br.parentNode;
  while (getComputedStyle(ref).display == "inline") {
      ref = ref.parentNode;
  }

  let refStyle = ref.hasAttribute("style") ? ref.getAttribute("style") : null;
  ref.style.height = "auto";
  ref.style.maxHeight = "none";
  ref.style.minHeight = "0";

  let space = document.createTextNode("\u200b");
  let origHeight = ref.offsetHeight;
  if (origHeight == 0) {
      throw "isCollapsedLineBreak: original height is zero, bug?";
  }
  br.parentNode.insertBefore(space, br.nextSibling);

  let finalHeight = ref.offsetHeight;

  space.parentNode.removeChild(space);

  if (refStyle === null) {
      ref.setAttribute("style", "");
      ref.removeAttribute("style");
  } else {
      ref.setAttribute("style", refStyle);
  }

  // 如果zwsp(零宽空格)没有创建一条全新的竖线 caret，而只是使一条现有的caret稍微高一点，那么可以允许。
  // firefox6.0 在第一行是粗体时显示这种行为。
  return origHeight < finalHeight - 5;
}
/**
 * @description 是否是多余无效的 br
 * 多余的换行符是不具有视觉效果的br，因为从DOM中将其删除不会改变布局，除了是作为li的唯一子代的br
 * @param br
 * @returns
 */
function isExtraneousLineBreak(br) {
  if (!isHtmlElement(br, "br")) {
      return false;
  }

  if (isHtmlElement(br.parentNode, "li")
  && br.parentNode.childNodes.length == 1) {
      return false;
  }

  // 使换行符消失，看看这是否会改变块的高度。
  // 是的，这是一个 css hack。我们必须重置参考节点上的高度等，因为否则它的高度不会改变，如果它不是自动的。
  let ref = br.parentNode;
  while (getComputedStyle(ref).display == "inline") {
      ref = ref.parentNode;
  }

  let refStyle = ref.hasAttribute("style") ? ref.getAttribute("style") : null;
  ref.style.height = "auto";
  ref.style.maxHeight = "none";
  ref.style.minHeight = "0";

  let brStyle = br.hasAttribute("style") ? br.getAttribute("style") : null;
  let origHeight = ref.offsetHeight;
  if (origHeight == 0) {
      throw "isExtraneousLineBreak: original height is zero, bug?";
  }

  br.setAttribute("style", "display:none");

  let finalHeight = ref.offsetHeight;
  if (refStyle === null) {
      ref.setAttribute("style", "");
      ref.removeAttribute("style");
  } else {
      ref.setAttribute("style", refStyle);
  }
  if (brStyle === null) {
      br.removeAttribute("style");
  } else {
      br.setAttribute("style", brStyle);
  }

  return origHeight == finalHeight;
}

/**
 * @description 是否是空白节点?
 * 空白节点是其数据为空字符串的Text节点; 或其数据仅由一个或多个制表符（0x0009），换行符（0x000A），回车符（0x000D）和/或 空格（0x0020），并且其父级是一个元素，其 'white-space' 的解析值为 'normal' 或“ nowrap”；或者其数据仅由一个或多个制表符（0x0009）组成的Text节点，回车符（0x000D ）和/或空格（0x0020），并且其父项是Element，其对 'white-space' 的解析值为 'pre-line'
 * @param node
 * @returns
 */
function isWhitespaceNode(node) {
  return node
      && node.nodeType == Node.TEXT_NODE
      && (node.data == ""
      || (
          /^[\t\n\r ]+$/.test(node.data)
          && node.parentNode
          && node.parentNode.nodeType == Node.ELEMENT_NODE
          && ["normal", "nowrap"].indexOf(getComputedStyle(node.parentNode).whiteSpace) != -1
      ) || (
          /^[\t\r ]+$/.test(node.data)
          && node.parentNode
          && node.parentNode.nodeType == Node.ELEMENT_NODE
          && getComputedStyle(node.parentNode).whiteSpace == "pre-line"
      ));
}

/**
 * @description 如果以下算法返回true，则节点是折叠的空白节点
 * @param node
 * @returns
 */
function isCollapsedWhitespaceNode(node) {
  // 如果不是空白节点返回
  if (!isWhitespaceNode(node)) {
      return false;
  }

  // 如果 node 的 data 为空，返回 true
  if (node.data == "") {
      return true;
  }

  // 查看祖先节点
  let ancestor = node.parentNode;

  // 如果祖先节点也是空的，返回 ture
  if (!ancestor) {
      return true;
  }

  // 如果祖先节点的属性 display 显示为 none, 返回 ture
  if (getAncestors(node).some(function(ancestor) {
      return ancestor.nodeType == Node.ELEMENT_NODE
          && getComputedStyle(ancestor).display == "none";
  })) {
      return true;
  }

  // 当祖先不是块节点且其父节点不为空时，将祖先设置为其父节点
  while (!isBlockNode(ancestor)
  && ancestor.parentNode) {
      ancestor = ancestor.parentNode;
  }

  // 创建引用节点
  let reference = node;

  // 而 reference 是祖先的后代: 向前查询
  while (reference != ancestor) {
      // 让 reference 按树顺序作为其前面的节点.
      reference = previousNode(reference);

      // 如果是块级节点或者 br 返回 true
      if (isBlockNode(reference)
      || isHtmlElement(reference, "br")) {
          return true;
      }

      // 如果 reference 是不是空格节点的 Text 节点 或 img，请退出此循环
      if ((reference.nodeType == Node.TEXT_NODE && !isWhitespaceNode(reference))
      || isHtmlElement(reference, "img")) {
          break;
      }
  }

  // reference = node
  reference = node;

  // reference 是祖先的后代 向前查询
  let stop = nextNodeDescendants(ancestor);
  while (reference != stop) {
      // 令 reference 为树后的节点，如果没有这样的节点，则为null。
      reference = nextNode(reference);

      // 如果 reference 是块节点或 br，则返回true
      if (isBlockNode(reference)
      || isHtmlElement(reference, "br")) {
          return true;
      }

      // 如果 reference 是不是空格节点的Text节点或img，请退出此循环。
      if ((reference && reference.nodeType == Node.TEXT_NODE && !isWhitespaceNode(reference))
      || isHtmlElement(reference, "img")) {
          break;
      }
  }

  // 都不满足返回 false
  return false;
}

/**
 * @description 判断节点是可见的，如果某个节点是块节点，或不是折叠空格节点的文本节点，或img，或不是无关换行符的br，或任何具有可见子代的节点，则该节点是可见的；排除具有祖先容器元素且其 'display' 属性解析值为 'none' 的任何节点
 * @param node
 * @returns boolean
 */
function isVisible(node) {
  if (!node) {
      return false;
  }

  if (getAncestors(node).concat(node)
  .filter(function(node) { return node.nodeType == Node.ELEMENT_NODE })
  .some(function(node) { return getComputedStyle(node).display == "none" })) {
      return false;
  }

  if (isBlockNode(node)
  || (node.nodeType == Node.TEXT_NODE && !isCollapsedWhitespaceNode(node))
  || isHtmlElement(node, "img")
  || (isHtmlElement(node, "br") && !isExtraneousLineBreak(node))) {
      return true;
  }

  for (let i = 0; i < node.childNodes.length; i++) {
      if (isVisible(node.childNodes[i])) {
          return true;
      }
  }

  return false;
}

/**
 * @description 节点是不可见的
 * @param node
 * @returns
 */
function isInvisible(node) {
  return node && !isVisible(node);
}
/**
 * @description 是折叠的块级属性
 * 折叠的块级属性可以是不是无关的换行符的折叠换行符，也可以是作为内联节点的元素，其子元素都是不可见的或折叠的块级属性，并且至少有一个子元素是折叠的块级属性。
 * @param node
 * @returns
 */
function isCollapsedBlockProp(node) {
  if (isCollapsedLineBreak(node)
  && !isExtraneousLineBreak(node)) {
      return true;
  }

  if (!isInlineNode(node)
  || node.nodeType != Node.ELEMENT_NODE) {
      return false;
  }

  let hasCollapsedBlockPropChild = false;
  for (let i = 0; i < node.childNodes.length; i++) {
      if (!isInvisible(node.childNodes[i])
      && !isCollapsedBlockProp(node.childNodes[i])) {
          return false;
      }
      if (isCollapsedBlockProp(node.childNodes[i])) {
          hasCollapsedBlockPropChild = true;
      }
  }

  return hasCollapsedBlockPropChild;
}


/**
 * @description 获得相邻的下个最近的 node 节点
 * @param node
 * @returns
 */
function nextNode(node: Node) {
  if (node.hasChildNodes()) {
    return node.firstChild;
  }
  return nextNodeDescendants(node);
}

/**
 * @description 下个节点的后代节点
 * @param node
 * @returns
 */
function nextNodeDescendants(node: Node) {
  while (node && !node.nextSibling) {
    node = node.parentNode;
  }
  if (!node) {
    return null;
  }
  return node.nextSibling;
}

/**
 * @description 前一个节点的后代节点
 * @param node
 * @returns
 */
function previousNode(node) {
  if (node.previousSibling) {
    node = node.previousSibling;
    while (node.hasChildNodes()) {
      node = node.lastChild;
    }
    return node;
  }
  if (node.parentNode
    && node.parentNode.nodeType == Node.ELEMENT_NODE) {
    return node.parentNode;
  }
  return null;
}

/**
 * @description 如果祖先是后代的祖先，则返回true，否则返回false。
 */
function isAncestor(ancestor, descendant) {
  return ancestor
    && descendant
    && Boolean(ancestor.compareDocumentPosition(descendant) & Node.DOCUMENT_POSITION_CONTAINED_BY);
}

/**
 * @description 是否是后代的祖先
 * @param ancestor
 * @param descendant
 * @returns
 */
function isAncestorContainer(ancestor, descendant) {
  return (ancestor || descendant)
    && (ancestor == descendant || isAncestor(ancestor, descendant));
}

/**
 * @description 是否是后代节点，其他情况返回 false
 * @param descendant
 * @param ancestor
 * @returns
 */
function isDescendant(descendant, ancestor) {
  return ancestor
    && descendant
    && Boolean(ancestor.compareDocumentPosition(descendant) & Node.DOCUMENT_POSITION_CONTAINED_BY);
}

/**
 * @description 是否在 node1 在 node2 之前 返回 ture
 * @param node1
 * @param node2
 * @returns
 */
function isBefore(node1, node2) {
  return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING);
}

/**
 * @description 是否在 node1 在 node2 之后 返回 ture
 * @param node1
 * @param node2
 * @returns
 */
function isAfter(node1, node2) {
  return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_PRECEDING);
}

/**
 * @description 获得所有的祖先
 * @param node
 * @returns
 */
function getAncestors(node) {
  const ancestors = [];
  while (node.parentNode) {
    ancestors.unshift(node.parentNode);
    node = node.parentNode;
  }
  return ancestors;
}
/**
 * @description 获得包含自己的所有祖先
 * @param node
 * @returns
 */
function getInclusiveAncestors(node) {
  return getAncestors(node).concat(node);
}

/**
 * @description 获得所有后代节点
 * @param node
 * @returns
 */
function getDescendants(node) {
  const descendants = [];
  const stop = nextNodeDescendants(node);
  while ((node = nextNode(node)) && node != stop) {
    descendants.push(node);
  }
  return descendants;
}

/**
 * @description 获得包含自己的所有后代节点
 * @param node
 * @returns
 */
function getInclusiveDescendants(node) {
  return [node].concat(getDescendants(node));
}


// 转换特别的属性
function convertProperty(property) {
  // Special-case for now
  const map = {
    'fontFamily': 'font-family',
    'fontSize': 'font-size',
    'fontStyle': 'font-style',
    'fontWeight': 'font-weight',
    'textDecoration': 'text-decoration',
  };
  if (typeof map[property] != 'undefined') {
    return map[property];
  }

  return property;
}
// 返回给定CSS大小的<font size = X>值，如果存在，则返回undefined没有。
function cssSizeToLegacy(cssVal) {
  return {
    "x-small": 1,
    "small": 2,
    "medium": 3,
    "large": 4,
    "x-large": 5,
    "xx-large": 6,
    "xxx-large": 7
  }[cssVal];
}

// 根据给定的旧大小返回CSS大小。
function legacySizeToCss(legacyVal) {
  return {
    1: "x-small",
    2: "small",
    3: "medium",
    4: "large",
    5: "x-large",
    6: "xx-large",
    7: "xxx-large",
  }[legacyVal];
}


// HTML中的 “方向性”。 我不用担心非HTML元素。
// “元素的方向性是'ltr'或'rtl'，并且根据以下适当的步骤确定”
function getDirectionality(element) {
  // 如果元素的排版方向性是 ltr 那么结果也是 ltr
  if (element.dir == "ltr") {
    return "ltr";
  }
  // 如果元素的排版方向性是 rtl 那么结果也是 rtl
  if (element.dir == "rtl") {
    return "rtl";
  }
  // 如果元素的根节点是 html，那么直接跳过判断，返回默认值
  if (!isHtmlElement(element.parentNode)) {
    return "ltr";
  }

  // 如果没有定义文本的排列方向，寻找父节点，子节点默认集成父节点的方向性
  return getDirectionality(element.parentNode);
}

// 获得 node 在当前节点层级的 index
function getNodeIndex(node) {
  let ret = 0;
  while (node.previousSibling) {
    ret++;
    node = node.previousSibling;
  }
  return ret;
}

/**
 * @description 获得 node 的 length
 * [ProcessingInstruction, DocumentType] 通常返回 0
 * [Text, Comment] 返回自身的 length
 * [anthor] 返回 node's childNodes's length
 */
function getNodeLength(node) {
  switch (node.nodeType) {
    case Node.PROCESSING_INSTRUCTION_NODE:
    case Node.DOCUMENT_TYPE_NODE:
      return 0;
    case Node.TEXT_NODE:
    case Node.COMMENT_NODE:
      return node.length;
    default:
      return node.childNodes.length;
  }
}

/**
 * @description 判断由DOM Range定义的两个边界点彼此相对的位置。
 * @param nodeA
 * @param offsetA
 * @param nodeB
 * @param offsetB
 *
 */
function getPosition(nodeA, offsetA, nodeB, offsetB) {
  // 如果节点A与节点B相同，
  // 则如果偏移量A等于偏移量B，则返回相等
  // 如果偏移量A小于偏移量B，则返回之前
  // 如果偏移量A大于偏移量B，则返回之后
  if (nodeA == nodeB) {
    if (offsetA == offsetB) {
      return "equal";
    }
    if (offsetA < offsetB) {
      return "before";
    }
    if (offsetA > offsetB) {
      return "after";
    }
  }
  // 如果节点A以树顺序在节点B之后，计算（节点B，偏移量B）相对于（节点A，偏移量A）的位置。
  // 如果它在之前，则在返回 after。如果在之后，则返回 before
  if (nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_FOLLOWING) {
    let pos = getPosition(nodeB, offsetB, nodeA, offsetA);
    if (pos == "before") {
      return "after";
    }
    if (pos == "after") {
      return "before";
    }
  }
  // 如果 nodeA 是 nodeB 的祖先
  if (nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_CONTAINS) {
    // 计算子节点，nodeB 是 nodeA 的子节点
    let child = nodeB;

    // 当 child 不是节点A的子代时，将 child 设置为其父代。
    while (child.parentNode != nodeA) {
      child = child.parentNode;
    }

    // 如果子项的索引小于偏移量A，则返回 after
    if (getNodeIndex(child) < offsetA) {
      return "after";
    }
  }

  return "before";
}

/**
 * @description 返回由DOM Range定义的 node的最远祖先。
 */

function getFurthestAncestor(node) {
  let root = node;
  while (root.parentNode != null) {
    root = root.parentNode;
  }
  return root;
}

/**
 * 由DOM范围定义为“包含”：“如果节点的最远祖先与范围的根相同，并且（node，0）在范围的开始之后，并且（node，节点的长度）为，
 * 则Node节点包含在范围内 在结束范围之前。”
 */
function isContained(node, range: Range) {
  let pos1 = getPosition(node, 0, range.startContainer, range.startOffset);
  let pos2 = getPosition(node, getNodeLength(node), range.endContainer, range.endOffset);

  return getFurthestAncestor(node) == getFurthestAncestor(range.startContainer)
    && pos1 == "after"
    && pos2 == "before";
}

// 获得选区范围内包含的所有节点, 忽略包裹的祖先节点
function getContainedNodes(range, condition) {
  if (typeof condition == "undefined") {
    condition = function () { return true };
  }
  let node = range.startContainer;
  if (node.hasChildNodes()
    && range.startOffset < node.childNodes.length) {
    // 一个子节点被包裹
    node = node.childNodes[range.startOffset];
  } else if (range.startOffset == getNodeLength(node)) {
    // 不能包含任何后代
    node = nextNodeDescendants(node);
  } else {
    // 如果没有子节点, 该节点也不可以被包含
    node = nextNode(node);
  }

  let stop = range.endContainer;
  if (stop.hasChildNodes()
    && range.endOffset < stop.childNodes.length) {
    // 最后一个包含的节点之后的节点是子节点
    stop = stop.childNodes[range.endOffset];
  } else {
    // 可能包含此节点和/或其某些子节点
    stop = nextNodeDescendants(stop);
  }

  let nodeList = [];
  while (isBefore(node, stop)) {
    if (isContained(node, range)
      && condition(node)) {
      nodeList.push(node);
      node = nextNodeDescendants(node);
      continue;
    }
    node = nextNode(node);
  }
  return nodeList;
}
// 获得选区范围内包含的所有节点, 不忽略包裹的祖先节点
function getAllContainedNodes(range, condition) {
  if (typeof condition == "undefined") {
    condition = function () { return true };
  }
  let node = range.startContainer;
  if (node.hasChildNodes()
    && range.startOffset < node.childNodes.length) {
    // 一个子节点被包裹
    node = node.childNodes[range.startOffset];
  } else if (range.startOffset == getNodeLength(node)) {
    // 不能包含任何后代
    node = nextNodeDescendants(node);
  } else {
    // 如果没有子节点, 该节点也不可以被包含
    node = nextNode(node);
  }

  let stop = range.endContainer;
  if (stop.hasChildNodes()
    && range.endOffset < stop.childNodes.length) {
    // 最后一个包含的节点之后的节点是子节点
    stop = stop.childNodes[range.endOffset];
  } else {
    // 可能包含此节点和/或其某些子节点
    stop = nextNodeDescendants(stop);
  }

  let nodeList = [];
  while (isBefore(node, stop)) {
    if (isContained(node, range)
      && condition(node)) {
      nodeList.push(node);
    }
    node = nextNode(node);
  }
  return nodeList;
}

function normalizeColor(color) {
  let resultCache = {}

  if (color.toLowerCase() == "currentcolor") {
    return null;
  }

  function normalize(color) {
    if (resultCache[color] !== undefined) {
      return resultCache[color];
    }
    let originalColor = color;

    let outerSpan = document.createElement("span");
    document.body.appendChild(outerSpan);
    outerSpan.style.color = "black";


    let innerSpan = document.createElement("span");
    outerSpan.appendChild(innerSpan);
    innerSpan.style.color = color;
    color = getComputedStyle(innerSpan).color;

    if (color == "rgb(0, 0, 0)") {
      // Maybe it's really black, maybe it's invalid.
      outerSpan.style.color = "white";
      color = getComputedStyle(innerSpan).color;
      if (color != "rgb(0, 0, 0)") {
        return resultCache[originalColor] = null;
      }
    }

    document.body.removeChild(outerSpan);

    // getComputedStyle 的颜色值 color 会出现几个意外的问题，单独处理
    if (/^rgba\([0-9]+, [0-9]+, [0-9]+, 1\)$/.test(color)) {
      return resultCache[originalColor] =
        color.replace("rgba", "rgb").replace(", 1)", ")");
    }
    if (color == "transparent") {
      return resultCache[originalColor] =
        "rgba(0, 0, 0, 0)";
    }
    // fix, 异常数值
    color = color.replace(/, 0.496094\)$/, ", 0.5)");
    return resultCache[originalColor] = color;
  }

  return normalize(color)
}

// 返回 null 或格式为 #xxxxxx 形式。
function parseSimpleColor(color) {
  color = normalizeColor(color);
  const matches = /^rgb\(([0-9]+), ([0-9]+), ([0-9]+)\)$/.exec(color);
  if (matches) {
      return "#"
          + parseInt(matches[1]).toString(16).replace(/^.$/, "0$&")
          + parseInt(matches[2]).toString(16).replace(/^.$/, "0$&")
          + parseInt(matches[3]).toString(16).replace(/^.$/, "0$&");
  }
  return null;
}


// algorithms



const exports = {
  isAncestor,
  isAncestorContainer,
  isBefore,
  isAfter,
  isDescendant,
  isEditingHost,
  isEditable,
  isHtmlElement,
  isHtmlNamespace,
  isProhibitedParagraphChild,
  isBlockNode,
  isInlineNode,
  hasEditableDescendants,
  getEditingHostOf,
  inSameEditingHost,
  isCollapsedLineBreak,
  isExtraneousLineBreak,
  isWhitespaceNode,
  isCollapsedWhitespaceNode,
  isVisible,
  isInvisible,
  isCollapsedBlockProp,
  getAncestors,
  getInclusiveAncestors,
  getDescendants,
  getInclusiveDescendants,
  nextNode,
  nextNodeDescendants,
  previousNode,
  convertProperty,
  cssSizeToLegacy,
  legacySizeToCss,
  getDirectionality,
  // dom
  getNodeIndex,
  getNodeLength,
  getPosition,
  getFurthestAncestor,
  isContained,
  getContainedNodes,
  getAllContainedNodes,
  normalizeColor,
  parseSimpleColor,
  // algorithms

}

export default exports
