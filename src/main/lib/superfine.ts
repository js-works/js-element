// @ts-nocheck
/* eslint-disable */

// @ts-nocheck
/* eslint-disable */

var SSR_NODE = 1,
  TEXT_NODE = 3,
  EMPTY_OBJ = {},
  EMPTY_ARR = [],
  SVG_NS = 'http://www.w3.org/2000/svg'

var listener = function (event) {
  this.events[event.type](event)
}

var getKey = (vdom) => (vdom == null ? vdom : vdom.key)

var patchProperty = (node, key, oldValue, newValue, isSvg) => {
  if (key === 'key') {
  } else if (key[0] === 'o' && key[1] === 'n') {
    if (
      !((node.events || (node.events = {}))[(key = key.slice(2))] = newValue)
    ) {
      node.removeEventListener(key, listener)
    } else if (!oldValue) {
      node.addEventListener(key, listener)
    }
  } else if (key === 'ref') {
    if (newValue !== oldValue) {
      oldValue && handleRef(oldValue, null)
      newValue && handleRef(newValue, node)
    }
  } else if (!isSvg && key !== 'list' && key !== 'form' && key in node) {
    node[key] = newValue == null ? '' : newValue
  } else if (newValue == null || newValue === false) {
    node.removeAttribute(key)
  } else {
    node.setAttribute(key, newValue)
  }
}

var createNode = (vdom, isSvg) => {
  var props = vdom.props,
    node =
      vdom.type === TEXT_NODE
        ? document.createTextNode(vdom.tag)
        : (isSvg = isSvg || vdom.tag === 'svg')
        ? document.createElementNS(SVG_NS, vdom.tag, { is: props.is })
        : document.createElement(vdom.tag, { is: props.is })

  for (var k in props) {
    patchProperty(node, k, null, props[k], isSvg)
  }

  for (var i = 0; i < vdom.children.length; i++) {
    node.appendChild(
      createNode((vdom.children[i] = vdomify(vdom.children[i])), isSvg)
    )
  }

  return (vdom.node = node)
}

var patchNode = (parent, node, oldVNode, newVNode, isSvg) => {
  if (oldVNode === newVNode) {
  } else if (
    oldVNode != null &&
    oldVNode.type === TEXT_NODE &&
    newVNode.type === TEXT_NODE
  ) {
    if (oldVNode.tag !== newVNode.tag) node.nodeValue = newVNode.tag
  } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
    node = parent.insertBefore(
      createNode((newVNode = vdomify(newVNode)), isSvg),
      node
    )
    if (oldVNode != null) {
      removeChild(parent, oldVNode)
    }
  } else {
    var tmpVKid,
      oldVKid,
      oldKey,
      newKey,
      oldProps = oldVNode.props,
      newProps = newVNode.props,
      oldVKids = oldVNode.children,
      newVKids = newVNode.children,
      oldHead = 0,
      newHead = 0,
      oldTail = oldVKids.length - 1,
      newTail = newVKids.length - 1

    isSvg = isSvg || newVNode.tag === 'svg'

    for (var i in { ...oldProps, ...newProps }) {
      if (
        (i === 'value' || i === 'selected' || i === 'checked'
          ? node[i]
          : oldProps[i]) !== newProps[i]
      ) {
        patchProperty(node, i, oldProps[i], newProps[i], isSvg)
      }
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldHead])) == null ||
        oldKey !== getKey(newVKids[newHead])
      ) {
        break
      }

      patchNode(
        node,
        oldVKids[oldHead].node,
        oldVKids[oldHead++],
        (newVKids[newHead] = vdomify(newVKids[newHead++])),
        isSvg
      )
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldTail])) == null ||
        oldKey !== getKey(newVKids[newTail])
      ) {
        break
      }

      patchNode(
        node,
        oldVKids[oldTail].node,
        oldVKids[oldTail--],
        (newVKids[newTail] = vdomify(newVKids[newTail--])),
        isSvg
      )
    }

    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode((newVKids[newHead] = vdomify(newVKids[newHead++])), isSvg),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node
        )
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        removeChild(node, oldVKids[oldHead++])
      }
    } else {
      for (var keyed = {}, newKeyed = {}, i = oldHead; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i].key) != null) {
          keyed[oldKey] = oldVKids[i]
        }
      }

      while (newHead <= newTail) {
        oldKey = getKey((oldVKid = oldVKids[oldHead]))
        newKey = getKey((newVKids[newHead] = vdomify(newVKids[newHead])))

        if (
          newKeyed[oldKey] ||
          (newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
        ) {
          if (oldKey == null) {
            removeChild(node, oldVKid)
          }
          oldHead++
          continue
        }

        if (newKey == null || oldVNode.type === SSR_NODE) {
          if (oldKey == null) {
            patchNode(
              node,
              oldVKid && oldVKid.node,
              oldVKid,
              newVKids[newHead],
              isSvg
            )
            newHead++
          }
          oldHead++
        } else {
          if (oldKey === newKey) {
            patchNode(node, oldVKid.node, oldVKid, newVKids[newHead], isSvg)
            newKeyed[newKey] = true
            oldHead++
          } else {
            if ((tmpVKid = keyed[newKey]) != null) {
              patchNode(
                node,
                node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                tmpVKid,
                newVKids[newHead],
                isSvg
              )
              newKeyed[newKey] = true
            } else {
              patchNode(
                node,
                oldVKid && oldVKid.node,
                null,
                newVKids[newHead],
                isSvg
              )
            }
          }
          newHead++
        }
      }

      while (oldHead <= oldTail) {
        if (getKey((oldVKid = oldVKids[oldHead++])) == null) {
          removeChild(node, oldVKid)
        }
      }

      for (var i in keyed) {
        if (newKeyed[i] == null) {
          removeChild(node, keyed[i])
        }
      }
    }
  }

  return (newVNode.node = node)
}

var vdomify = (newVNode) =>
  newVNode !== true && newVNode !== false && newVNode ? newVNode : text('')

var removeChild = (parentNode, vnode) => {
  parentNode.removeChild(vnode.node)
  vnode.props && vnode.props.ref && handleRef(vnode.props.ref, null)
}

var handleRef = (ref, value) =>
  typeof ref === 'function' ? ref(value) : (ref.current = value)

var recycleNode = (node) =>
  node.nodeType === TEXT_NODE
    ? text(node.nodeValue, node)
    : createVNode(
        node.nodeName.toLowerCase(),
        EMPTY_OBJ,
        EMPTY_ARR.map.call(node.childNodes, recycleNode),
        SSR_NODE,
        node
      )

var createVNode = (tag, props, children, type, node) => ({
  tag,
  props,
  key: props.key,
  children,
  type,
  node
})

export var text = (value, node) =>
  createVNode(value, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, node)

export var h = (tag, props, children = EMPTY_ARR) =>
  createVNode(tag, props, Array.isArray(children) ? children : [children])

export var patch = (node, vdom) => (
  ((node = patchNode(
    node.parentNode,
    node,
    node.vdom || recycleNode(node),
    vdom
  )).vdom = vdom),
  node
)
