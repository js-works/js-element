/* 
  This is a fork of the base functionality of "superfine"
  See: https://github.com/jorgebucaran/superfine

  Many thanks to Jorge for that great and very helpful superfine project.
*/

var RECYCLED_NODE = 1
var TEXT_NODE = 3
var EMPTY_OBJ = {}
var EMPTY_ARR: any = [] // TODO
var map = EMPTY_ARR.map
var isArray = Array.isArray

var merge = function(a: any, b: any) { // TODO
  var out: any = {} // TODO

  for (var k in a) out[k] = a[k]
  for (var k in b) out[k] = b[k]

  return out
}

var listener = function(this: any, event: any) { // TODO
  this.handlers[event.type](event)
}

var patchProperty = function(node: any, key: any, oldValue: any, newValue: any, isSvg: any) { // TODO
  if (key === "key") {
  } else if (key[0] === "o" && key[1] === "n") {
    if (
      !((node.handlers || (node.handlers = {}))[
        (key = key.slice(2).toLowerCase())
      ] = newValue)
    ) {
      node.removeEventListener(key, listener)
    } else if (!oldValue) {
      node.addEventListener(key, listener)
    }
  } else if (!isSvg && key !== "list" && key in node) {
    node[key] = newValue == null ? "" : newValue
  } else if (newValue == null || newValue === false) {
    node.removeAttribute(key)
  } else {
    node.setAttribute(key, newValue)
  }
}

var createNode = function(vnode: any, isSvg: any) { // TODO
  var node =
    vnode.type === TEXT_NODE
      ? document.createTextNode(vnode.name)
      : (isSvg = isSvg || vnode.name === "svg")
      ? document.createElementNS("http://www.w3.org/2000/svg", vnode.name)
      : document.createElement(vnode.name)
  var props = vnode.props

  for (var k in props) {
    patchProperty(node, k, null, props[k], isSvg)
  }

  for (let i = 0, len = vnode.children.length; i < len; i++) {
    node.appendChild(createNode(vnode.children[i], isSvg))
  }

  return (vnode.node = node)
}

var getKey = function(vnode: any) { // TODO
  return vnode == null ? null : vnode.key
}

var patchNode = function(parent: any, node: any, oldVNode: any, newVNode: any, isSvg: any = false) { // TODO
  if (oldVNode === newVNode) {
  } else if (
    oldVNode != null &&
    oldVNode.type === TEXT_NODE &&
    newVNode.type === TEXT_NODE
  ) {
    if (oldVNode.name !== newVNode.name) node.nodeValue = newVNode.name
  } else if (oldVNode == null || oldVNode.name !== newVNode.name) {
    node = parent.insertBefore(createNode(newVNode, isSvg), node)
    if (oldVNode != null) {
      parent.removeChild(oldVNode.node)
    }
  } else {
    var tmpVKid
    var oldVKid

    var oldKey
    var newKey

    var oldVProps = oldVNode.props
    var newVProps = newVNode.props

    var oldVKids = oldVNode.children
    var newVKids = newVNode.children

    var oldHead = 0
    var newHead = 0
    var oldTail = oldVKids.length - 1
    var newTail = newVKids.length - 1

    isSvg = isSvg || newVNode.name === "svg"

    for (const i in merge(oldVProps, newVProps)) {
      if (
        (i === "value" || i === "selected" || i === "checked"
          ? node[i]
          : oldVProps[i]) !== newVProps[i]
      ) {
        patchProperty(node, i, oldVProps[i], newVProps[i], isSvg)
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
        newVKids[newHead++],
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
        newVKids[newTail--],
        isSvg
      )
    }

    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode(newVKids[newHead++], isSvg),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node
        )
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++].node)
      }
    } else {
      let i: any, keyed: any, newKeyed: any // TODO

      for (i = oldHead, keyed = {}, newKeyed = {}; i <= oldTail; i++) { // TODO
        if ((oldKey = oldVKids[i].key) != null) {
          keyed[oldKey] = oldVKids[i]
        }
      }

      while (newHead <= newTail) {
        oldKey = getKey((oldVKid = oldVKids[oldHead]))
        newKey = getKey(newVKids[newHead])

        if (
          newKeyed[oldKey] ||
          (newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
        ) {
          if (oldKey == null) {
            node.removeChild(oldVKid.node)
          }
          oldHead++
          continue
        }

        if (newKey == null || oldVNode.type === RECYCLED_NODE) {
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
          node.removeChild(oldVKid.node)
        }
      }

      for (const i in keyed) {
        if (newKeyed[i] == null) {
          node.removeChild(keyed[i].node)
        }
      }
    }
  }

  return (newVNode.node = node)
}

var createVNode = function(name: any, props: any, children: any, node: any, key: any, type?: any) { // TODO
  return {
    name: name,
    props: props,
    children: children,
    node: node,
    type: type,
    key: key,
    kind: 'virtual-element'
  }
}

var createTextVNode = function(value: any, node?: any) { // TODO
  return createVNode(value, EMPTY_OBJ, EMPTY_ARR, node, null, TEXT_NODE)
}

var recycleNode = function(node: any) { // TODO
  return node.nodeType === TEXT_NODE
    ? createTextVNode(node.nodeValue, node)
    : createVNode(
        node.nodeName.toLowerCase(),
        EMPTY_OBJ,
        map.call(node.childNodes, recycleNode),
        node,
        null,
        RECYCLED_NODE
      )
}

export var patch = function(node: any, vdom: any) { // TODO
  return (
    ((node = patchNode(
      node.parentNode,
      node,
      node.vdom || recycleNode(node),
      vdom
    )).vdom = vdom),
    node
  )
}

export var h = function(name: any, props: any) { // TODO
  for (var vnode, rest = [], children = [], i = arguments.length; i-- > 2; ) {
    rest.push(arguments[i])
  }

  while (rest.length > 0) {
    if (isArray((vnode = rest.pop()))) {
      let i: any // TODO
      for (i = vnode.length; i-- > 0; ) { // TODO
        rest.push(vnode[i])
      }
    } else if (vnode === false || vnode === true || vnode == null) {
    } else {
      children.push(typeof vnode === "object" ? vnode : createTextVNode(vnode))
    }
  }

  props = props || EMPTY_OBJ

  return typeof name === "function"
    ? name(props, children)
    : createVNode(name, props, children, null, props.key)
}