const prohibitedParagraphChildNames = [
    'address', 'article', 'aside',
    'blockquote', 'caption', 'center', 'col', 'colgroup', 'dd', 'details',
    'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer',
    'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li',
    'listing', 'menu', 'nav', 'ol', 'p', 'plaintext', 'pre', 'section',
    'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
    'xmp'
];

export function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild;
    }
    return nextNodeDescendants(node);
}

export function nextNodeDescendants(node) {
    while (node && !node.nextSibling) {
        node = node.parentNode;
    }
    if (!node) {
        return null;
    }
    return node.nextSibling;
}

export function previousNode(node) {
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

export function isAncestor(ancestor, descendant) {
    return ancestor
        && descendant
        && Boolean(ancestor.compareDocumentPosition(descendant) & Node.DOCUMENT_POSITION_CONTAINED_BY);
}

export function isAncestorContainer(ancestor, descendant) {
    return (ancestor || descendant)
        && (ancestor == descendant || isAncestor(ancestor, descendant));
}

export function isDescendant(descendant, ancestor) {
    return ancestor
        && descendant
        && Boolean(ancestor.compareDocumentPosition(descendant) & Node.DOCUMENT_POSITION_CONTAINED_BY);
}

export function isBefore(node1, node2) {
    return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING);
}

export function isAfter(node1, node2) {
    return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_PRECEDING);
}

export function getAncestors(node) {
    let ancestors = [];

    while (node.parentNode) {
        ancestors.unshift(node.parentNode);
        node = node.parentNode;
    }
    return ancestors;
}

export function getInclusiveAncestors(node) {
    return getAncestors(node).concat(node);
}

export function getDescendants(node) {
    let descendants = [];
    const stop = nextNodeDescendants(node);

    while ((node = nextNode(node))
    && node != stop) {
        descendants.push(node);
    }
    return descendants;
}

export function getInclusiveDescendants(node) {
    return [node].concat(getDescendants(node));
}

export function convertProperty(property) {
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

export function cssSizeToLegacy(cssVal) {
    return {
        'x-small': 1,
        'small': 2,
        'medium': 3,
        'large': 4,
        'x-large': 5,
        'xx-large': 6,
        'xxx-large': 7
    }[cssVal];
}

export function legacySizeToCss(legacyVal) {
    return {
        1: 'x-small',
        2: 'small',
        3: 'medium',
        4: 'large',
        5: 'x-large',
        6: 'xx-large',
        7: 'xxx-large',
    }[legacyVal];
}

export function getDirectionality(element) {
    if (element.dir == 'ltr') {
        return 'ltr';
    }

    if (element.dir == 'rtl') {
        return 'rtl';
    }

    if (!isHtmlElement(element.parentNode)) {
        return 'ltr';
    }

    return getDirectionality(element.parentNode);
}

export function isHtmlNamespace(ns) {
    const htmlNamespace = 'http://www.w3.org/1999/xhtml';
    return ns === null
        || ns === htmlNamespace;
}

export function isHtmlElement(node, tags?) {
    if (typeof tags == 'string') {
        tags = [tags];
    }
    if (typeof tags == 'object') {
        tags = tags.map(function (tag) { return tag.toUpperCase() });
    }
    return node
        && node.nodeType == Node.ELEMENT_NODE
        && isHtmlNamespace(node.namespaceURI)
        && (typeof tags == 'undefined' || tags.indexOf(node.tagName) != -1);
}

export function isProhibitedParagraphChild(node) {
    return isHtmlElement(node, prohibitedParagraphChildNames);
}

export function isBlockNode(node) {
    return node
        && ((node.nodeType == Node.ELEMENT_NODE && ['inline', 'inline-block', 'inline-table', 'none'].indexOf(getComputedStyle(node).display) == -1)
        || node.nodeType == Node.DOCUMENT_NODE
        || node.nodeType == Node.DOCUMENT_FRAGMENT_NODE);
}

export function isInlineNode(node) {
    return node && !isBlockNode(node);
}

export function isEditingHost(node) {
    return node
        && isHtmlElement(node)
        && (node.contentEditable == 'true'
        || (node.parentNode
        && node.parentNode.nodeType == Node.DOCUMENT_NODE
        && node.parentNode.designMode == 'on'));
}

export function isEditable(node) {
    return node
        && !isEditingHost(node)
        && (node.nodeType != Node.ELEMENT_NODE || node.contentEditable != 'false')
        && (isEditingHost(node.parentNode) || isEditable(node.parentNode))
        && (isHtmlElement(node)
        || (node.nodeType == Node.ELEMENT_NODE && node.namespaceURI == 'http://www.w3.org/2000/svg' && node.localName == 'svg')
        || (node.nodeType == Node.ELEMENT_NODE && node.namespaceURI == 'http://www.w3.org/1998/Math/MathML' && node.localName == 'math')
        || (node.nodeType != Node.ELEMENT_NODE && isHtmlElement(node.parentNode)));
}

export function hasEditableDescendants(node) {
    for (let i = 0; i < node.childNodes.length; i++) {
        if (isEditable(node.childNodes[i])
        || hasEditableDescendants(node.childNodes[i])) {
            return true;
        }
    }
    return false;
}

export function getEditingHostOf(node) {
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

export function inSameEditingHost(node1, node2) {
    return getEditingHostOf(node1)
        && getEditingHostOf(node1) == getEditingHostOf(node2);
}

export function isCollapsedLineBreak(br) {
    if (!isHtmlElement(br, 'br')) {
        return false;
    }

    let ref = br.parentNode;
    while (getComputedStyle(ref).display == 'inline') {
        ref = ref.parentNode;
    }

    let refStyle = ref.hasAttribute('style') ? ref.getAttribute('style') : null;

    ref.style.height = 'auto';
    ref.style.maxHeight = 'none';
    ref.style.minHeight = '0';

    let space = document.createTextNode('\u200b');
    let origHeight = ref.offsetHeight;

    if (origHeight == 0) {
        throw 'isCollapsedLineBreak: original height is zero, bug?';
    }
    br.parentNode.insertBefore(space, br.nextSibling);

    let finalHeight = ref.offsetHeight;
    space.parentNode.removeChild(space);

    if (refStyle === null) {
        ref.setAttribute('style', '');
        ref.removeAttribute('style');
    } else {
        ref.setAttribute('style', refStyle);
    }

    return origHeight < finalHeight - 5;
}

export function isExtraneousLineBreak(br) {
    if (!isHtmlElement(br, 'br')) {
        return false;
    }

    if (isHtmlElement(br.parentNode, 'li')
    && br.parentNode.childNodes.length == 1) {
        return false;
    }

    let ref = br.parentNode;
    while (getComputedStyle(ref).display == 'inline') {
        ref = ref.parentNode;
    }

    let refStyle = ref.hasAttribute('style') ? ref.getAttribute('style') : null;
    ref.style.height = 'auto';
    ref.style.maxHeight = 'none';
    ref.style.minHeight = '0';

    let brStyle = br.hasAttribute('style') ? br.getAttribute('style') : null;
    let origHeight = ref.offsetHeight;
    if (origHeight == 0) {
        throw 'isExtraneousLineBreak: original height is zero, bug?';
    }

    br.setAttribute('style', 'display:none');
    let finalHeight = ref.offsetHeight;
    if (refStyle === null) {
        ref.setAttribute('style', '');
        ref.removeAttribute('style');
    } else {
        ref.setAttribute('style', refStyle);
    }
    if (brStyle === null) {
        br.removeAttribute('style');
    } else {
        br.setAttribute('style', brStyle);
    }

    return origHeight == finalHeight;
}

export function isWhitespaceNode(node) {
    return node
        && node.nodeType == Node.TEXT_NODE
        && (node.data == ''
        || (
            /^[\t\n\r ]+$/.test(node.data)
            && node.parentNode
            && node.parentNode.nodeType == Node.ELEMENT_NODE
            && ['normal', 'nowrap'].indexOf(getComputedStyle(node.parentNode).whiteSpace) != -1
        ) || (
            /^[\t\r ]+$/.test(node.data)
            && node.parentNode
            && node.parentNode.nodeType == Node.ELEMENT_NODE
            && getComputedStyle(node.parentNode).whiteSpace == 'pre-line'
        ));
}

export function isCollapsedWhitespaceNode(node) {
    if (!isWhitespaceNode(node)) {
        return false;
    }

    if (node.data == '') {
        return true;
    }

    let ancestor = node.parentNode;

    if (!ancestor) {
        return true;
    }

    if (getAncestors(node).some(function(ancestor) {
        return ancestor.nodeType == Node.ELEMENT_NODE
            && getComputedStyle(ancestor).display == 'none';
    })) {
        return true;
    }

    while (!isBlockNode(ancestor)
    && ancestor.parentNode) {
        ancestor = ancestor.parentNode;
    }

    let reference = node;

    while (reference != ancestor) {
        reference = previousNode(reference);

        if (isBlockNode(reference)
        || isHtmlElement(reference, 'br')) {
            return true;
        }

        if ((reference.nodeType == Node.TEXT_NODE && !isWhitespaceNode(reference))
        || isHtmlElement(reference, 'img')) {
            break;
        }
    }

    reference = node;

    let stop = nextNodeDescendants(ancestor);
    while (reference != stop) {
        reference = nextNode(reference);

        if (isBlockNode(reference)
        || isHtmlElement(reference, 'br')) {
            return true;
        }

        if ((reference && reference.nodeType == Node.TEXT_NODE && !isWhitespaceNode(reference))
        || isHtmlElement(reference, 'img')) {
            break;
        }
    }

    return false;
}

export function isVisible(node) {
    if (!node) {
        return false;
    }

    if (getAncestors(node).concat(node)
    .filter((node) => node.nodeType == Node.ELEMENT_NODE)
    .some((node) => getComputedStyle(node).display == 'none' )) {
        return false;
    }

    if (isBlockNode(node)
    || (node.nodeType == Node.TEXT_NODE && !isCollapsedWhitespaceNode(node))
    || isHtmlElement(node, 'img')
    || (isHtmlElement(node, 'br') && !isExtraneousLineBreak(node))) {
        return true;
    }

    for (let i = 0; i < node.childNodes.length; i++) {
        if (isVisible(node.childNodes[i])) {
            return true;
        }
    }

    return false;
}

export function isInvisible(node) {
    return node && !isVisible(node);
}

export function isCollapsedBlockProp(node) {
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

export function getNodeIndex(node) {
    let ret = 0;
    while (node.previousSibling) {
        ret++;
        node = node.previousSibling;
    }
    return ret;
}

export function getNodeLength(node) {
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

export function getPosition(nodeA, offsetA, nodeB, offsetB) {
    if (nodeA == nodeB) {
        if (offsetA == offsetB) {
            return 'equal';
        }
        if (offsetA < offsetB) {
            return 'before';
        }
        if (offsetA > offsetB) {
            return 'after';
        }
    }

    if (nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_FOLLOWING) {
        let pos = getPosition(nodeB, offsetB, nodeA, offsetA);
        if (pos == 'before') {
            return 'after';
        }
        if (pos == 'after') {
            return 'before';
        }
    }

    if (nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_CONTAINS) {
        let child = nodeB;

        while (child.parentNode != nodeA) {
            child = child.parentNode;
        }

        if (getNodeIndex(child) < offsetA) {
            return 'after';
        }
    }

    return 'before';
}


export function getFurthestAncestor(node) {
    let root = node;
    while (root.parentNode != null) {
        root = root.parentNode;
    }
    return root;
}

export function isContained(node, range) {
    const pos1 = getPosition(node, 0, range.startContainer, range.startOffset);
    const pos2 = getPosition(node, getNodeLength(node), range.endContainer, range.endOffset);

    return getFurthestAncestor(node) == getFurthestAncestor(range.startContainer)
        && pos1 == 'after'
        && pos2 == 'before';
}

export function getContainedNodes(range, condition) {
    if (typeof condition == 'undefined') {
        condition = function() { return true };
    }

    let node = range.startContainer;
    if (node.hasChildNodes()
    && range.startOffset < node.childNodes.length) {

        node = node.childNodes[range.startOffset];
    } else if (range.startOffset == getNodeLength(node)) {

        node = nextNodeDescendants(node);
    } else {

        node = nextNode(node);
    }

    let stop = range.endContainer;
    if (stop.hasChildNodes()
    && range.endOffset < stop.childNodes.length) {

        stop = stop.childNodes[range.endOffset];
    } else {

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

export function isEffectivelyContained(node, range) {
    if (range.collapsed) {
        return false;
    }

    if (isContained(node, range)) {
        return true;
    }

    if (node == range.startContainer
    && node.nodeType == Node.TEXT_NODE
    && getNodeLength(node) != range.startOffset) {
        return true;
    }

    if (node == range.endContainer
    && node.nodeType == Node.TEXT_NODE
    && range.endOffset != 0) {
        return true;
    }

    if (node.hasChildNodes()
    && [].every.call(node.childNodes, function(child) { return isEffectivelyContained(child, range) })
    && (!isDescendant(range.startContainer, node)
    || range.startContainer.nodeType != Node.TEXT_NODE
    || range.startOffset == 0)
    && (!isDescendant(range.endContainer, node)
    || range.endContainer.nodeType != Node.TEXT_NODE
    || range.endOffset == getNodeLength(range.endContainer))) {
        return true;
    }

    return false;
}

export function getAllContainedNodes(range, condition) {
    if (typeof condition == 'undefined') {
        condition = function() { return true };
    }

    let node = range.startContainer;
    if (node.hasChildNodes()
    && range.startOffset < node.childNodes.length) {
        node = node.childNodes[range.startOffset];
    } else if (range.startOffset == getNodeLength(node)) {
        node = nextNodeDescendants(node);
    } else {
        node = nextNode(node);
    }

    let stop = range.endContainer;
    if (stop.hasChildNodes()
    && range.endOffset < stop.childNodes.length) {
        stop = stop.childNodes[range.endOffset];
    } else {
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

export function getEffectivelyContainedNodes(range, condition) {
    if (typeof condition == 'undefined') {
        condition = function() { return true };
    }
    let node = range.startContainer;
    while (isEffectivelyContained(node.parentNode, range)) {
        node = node.parentNode;
    }

    let stop = nextNodeDescendants(range.endContainer);

    let nodeList = [];
    while (isBefore(node, stop)) {
        if (isEffectivelyContained(node, range)
        && condition(node)) {
            nodeList.push(node);
            node = nextNodeDescendants(node);
            continue;
        }
        node = nextNode(node);
    }
    return nodeList;
}

export function getAllEffectivelyContainedNodes(range, condition) {
    if (typeof condition == 'undefined') {
        condition = function() { return true };
    }
    let node = range.startContainer;
    while (isEffectivelyContained(node.parentNode, range)) {
        node = node.parentNode;
    }

    let stop = nextNodeDescendants(range.endContainer);

    let nodeList = [];
    while (isBefore(node, stop)) {
        if (isEffectivelyContained(node, range)
        && condition(node)) {
            nodeList.push(node);
        }
        node = nextNode(node);
    }
    return nodeList;
}

export function isModifiableElement(node) {
    if (!isHtmlElement(node)) {
        return false;
    }

    if (['B', 'EM', 'I', 'S', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP', 'U'].indexOf(node.tagName) != -1) {
        if (node.attributes.length == 0) {
            return true;
        }

        if (node.attributes.length == 1
        && node.hasAttribute('style')) {
            return true;
        }
    }

    if (node.tagName == 'FONT' || node.tagName == 'A') {
        let numAttrs = node.attributes.length;

        if (node.hasAttribute('style')) {
            numAttrs--;
        }

        if (node.tagName == 'FONT') {
            if (node.hasAttribute('color')) {
                numAttrs--;
            }

            if (node.hasAttribute('face')) {
                numAttrs--;
            }

            if (node.hasAttribute('size')) {
                numAttrs--;
            }
        }

        if (node.tagName == 'A'
        && node.hasAttribute('href')) {
            numAttrs--;
        }

        if (numAttrs == 0) {
            return true;
        }
    }

    return false;
}

export function isSimpleModifiableElement(node) {
    if (!isHtmlElement(node)) {
        return false;
    }

    if (['A', 'B', 'EM', 'FONT', 'I', 'S', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP', 'U'].indexOf(node.tagName) == -1) {
        return false;
    }

    if (node.attributes.length == 0) {
        return true;
    }

    if (node.attributes.length > 1) {
        return false;
    }

    if (node.hasAttribute('style')
    && node.style.length == 0) {
        return true;
    }

    if (node.tagName == 'A'
    && node.hasAttribute('href')) {
        return true;
    }

    if (node.tagName == 'FONT'
    && (node.hasAttribute('color')
    || node.hasAttribute('face')
    || node.hasAttribute('size')
    )) {
        return true;
    }

    if ((node.tagName == 'B' || node.tagName == 'STRONG')
    && node.hasAttribute('style')
    && node.style.length == 1
    && node.style.fontWeight != '') {
        return true;
    }

    if ((node.tagName == 'I' || node.tagName == 'EM')
    && node.hasAttribute('style')
    && node.style.length == 1
    && node.style.fontStyle != '') {
        return true;
    }

    if ((node.tagName == 'A' || node.tagName == 'FONT' || node.tagName == 'SPAN')
    && node.hasAttribute('style')
    && node.style.length == 1
    && node.style.textDecoration == '') {
        return true;
    }

    if (['A', 'FONT', 'S', 'SPAN', 'STRIKE', 'U'].indexOf(node.tagName) != -1
    && node.hasAttribute('style')
    && (node.style.length == 1
        || (node.style.length == 4
            && 'MozTextBlink' in node.style
            && 'MozTextDecorationColor' in node.style
            && 'MozTextDecorationLine' in node.style
            && 'MozTextDecorationStyle' in node.style)
        || (node.style.length == 4
            && 'MozTextBlink' in node.style
            && 'textDecorationColor' in node.style
            && 'textDecorationLine' in node.style
            && 'textDecorationStyle' in node.style)
    )
    && (node.style.textDecoration == 'line-through'
    || node.style.textDecoration == 'underline'
    || node.style.textDecoration == 'overline'
    || node.style.textDecoration == 'none')) {
        return true;
    }

    return false;
}

export function isFormattableNode(node) {
    return isEditable(node)
        && isVisible(node)
        && (node.nodeType == Node.TEXT_NODE
        || isHtmlElement(node, ['img', 'br']));
}


