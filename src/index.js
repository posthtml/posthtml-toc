'use strict'

/**
 * TOC Options
 *
 * @type {Object}
 * @prop {?String} options.insert - insertion information with position key
 *   ('after', 'before', 'afterChildren', 'beforeChildren') and selector value
 *   ('tag', '.class', '#id')
 * @prop {?String} options.title - toc title
 * @prop {?Array[String, String, Boolean]} options.toggle - toggle button text options
 * @prop {?boolean} options.ignoreMissingSelector - don't throw an error if the
 *   selector is not found
 * @prop {?boolean} options.ignoreMissingHeadings - don't throw an error if no
 *   headings (h2,h3,h4,h5,h6) are not found
 */
module.exports = function (options = {}) {
  const {
    insert = { after: 'h1' },
    title = 'Content',
    ignoreMissingSelector = false,
    ignoreMissingHeadings = false,
    toggle // ['show', 'hide', true],
  } = options

  if (typeof insert !== 'object') {
    throw new PostHtmlTocError(`unexpected 'options.insert': ${insert}`)
  }

  const insertKeys = Object.keys(insert)

  switch (insertKeys.length) {
    case 1:
      break
    case 0:
      throw new PostHtmlTocError(`empty 'options.insert'`)
    default:
      throw new PostHtmlTocError(`too many keys in 'options.insert': ${insertKeys}`)
  }

  const position = insertKeys[0]
  const selector = insert[position]

  // Define a function (dynamically) to insert the TOC.
  //
  // The function signature is:
  //
  //   function insertToc (nodes, i, toc) { ... }
  //
  // `nodes` is the array of nodes in the tree. `i` is a valid index into
  // `nodes`. `toc` is the array of nodes containing the table of contents.
  //
  // The function definition depends on the desired position for inserting the
  // TOC.
  //
  // Note that `insertToc` does not perform any error checking.
  const insertToc = (() => {
    switch (position) {
      case 'after':
        // Insert the TOC after node `i`. If this is the last node, `nodes` will
        // be extended with new nodes at the end.
        return (nodes, i, toc) => { nodes.splice(i + 1, 0, toc) }
      case 'before':
        // Insert the TOC before node `i`. If this is the first node, `nodes`
        // will be extended with new nodes at the beginning.
        return (nodes, i, toc) => { nodes.splice(Math.max(0, i - 1), 0, toc) }
      case 'afterChildren':
        // Insert the TOC as new children of node `i`. The TOC will come after
        // the last of the node's children.
        return (nodes, i, toc) => {
          if (Array.isArray(nodes[i].content)) {
            nodes[i].content.push(toc)
          } else {
            nodes[i].content = new Array(toc)
          }
        }
      case 'beforeChildren':
        // Insert the TOC as new children of node `i`. The TOC will come before
        // the first of the node's children.
        return (nodes, i, toc) => {
          if (Array.isArray(nodes[i].content)) {
            nodes[i].content.unshift(toc)
          } else {
            nodes[i].content = new Array(toc)
          }
        }
      default:
        // The `position` is unknown.
        throw new PostHtmlTocError(`unexpected 'options.insert' key: ${position}`)
    }
  })()

  if (typeof selector !== 'string') {
    throw new PostHtmlTocError(`unexpected 'options.insert' value: ${selector}`)
  }

  if (typeof title !== 'string') {
    throw new PostHtmlTocError(`unexpected 'options.title': ${title}`)
  }

  if (toggle) {
    const options01 = ['show', 'hide']
    const options2 = ['undefined', 'boolean']
    if (!options01.includes(toggle[0]) || !options01.includes(toggle[1]) ||
      !options2.includes(typeof toggle[2])) {
      throw new PostHtmlTocError(`unexpected 'options.toggle': ${toggle}`)
    }
  }

  if (typeof ignoreMissingSelector !== 'boolean') {
    throw new PostHtmlTocError(`unexpected 'options.ignoreMissingSelector': ${ignoreMissingSelector}`)
  }

  if (typeof ignoreMissingHeadings !== 'boolean') {
    throw new PostHtmlTocError(`unexpected 'options.ignoreMissingHeadings': ${ignoreMissingHeadings}`)
  }

  // Define a function (dynamically) to check if a given node matches the
  // selector.
  //
  // The function signature is:
  //
  //   function matchesSelector ({ tag, attrs }) { ... }
  //
  // `tag` is the tag name. `attrs` is the array of attributes.
  //
  // The function definition depends on the selector.
  const matchesSelector = (() => {
    switch (selector.charAt(0)) {
      case '.':
        // Class selector
        return ({ attrs }) => attrs && attrs.class && attrs.class.includes(selector.slice(1))
      case '#':
        // Identifier selector
        return ({ attrs }) => attrs && attrs.id && attrs.id === selector.slice(1)
      default:
        // Tag selector
        return ({ tag }) => tag === selector
    }
  })()

  return function toc (tree) {
    const list = [[]]
    const result = []

    let prev
    let curr

    function tocItem (level, href, text) {
      return [level, [], href, text]
    }

    function rollUp (list) {
      const content = list.pop()
      const len = list[list.length - 1].length
      const last = list[list.length - 1][len - 1]
      last[1] = content
      return last
    }

    let isAppend = false

    tree.walk(function (node) {
      if (typeof node === 'string') {
        return node
      }

      const {
        tag,
        content,
        attrs
      } = node

      if (/^h[2-6]$/.test(tag) && content && attrs && attrs.id) {
        curr = tocItem(parseInt(tag.slice(1)), attrs.id, content)

        if (!prev) {
          list[list.length - 1].push(curr)
          prev = curr
          return node
        }

        if (curr[0] > prev[0]) {
          if (Array.isArray(list[list.length])) {
            list[list.length].push(curr)
          } else {
            list[list.length] = [curr]
          }
          prev = curr
          return node
        }

        while (curr[0] < prev[0]) {
          prev = rollUp(list)
        }

        if (curr[0] === prev[0]) {
          list[list.length - 1].push(curr)
          prev = curr
          return node
        }

        list[list.length] = [curr]
        prev = curr
      }

      if (!isAppend && content && Array.isArray(content)) {
        for (let i = 0; i < content.length; i++) {
          if (matchesSelector(content[i])) {
            insertToc(content, i, result)
            isAppend = true
            return node
          }
        }
      }

      return node
    })

    if (isAppend === false) {
      // We have not found the selector. We can't continue, because we're not
      // going to insert the TOC, so we must choose whether to return an
      // unchanged `tree` or to throw an error.
      if (ignoreMissingSelector === true) {
        return tree
      } else {
        throw new PostHtmlTocError(`selector not found: ${selector}`)
      }
    }

    while (list.length > 1) {
      rollUp(list)
    }

    const tocItems = list[0]

    // If there are no headings in the HTML (or if the headings have only
    // whitespace), we throw an error. Otherwise, if `ignoreMissingHeadings ===
    // true`, we output an empty `<ul>`.
    if (tocItems.length < 1 && ignoreMissingHeadings === false) {
      throw new PostHtmlTocError('headings or heading content not found: h2,h3,h4,h5,h6')
    }

    function render (list) {
      const content = []
      list.forEach(function (item) {
        const children = item[1]
        const href = item[2]
        const text = item[3]
        const li = {
          tag: 'li',
          content: [
            { tag: 'a', attrs: { href: '#' + href }, content: text }
          ]
        }
        if (children.length) {
          li.content.push(render(children))
        }
        content.push(li)
      })

      return { tag: 'ul', content }
    }

    if (toggle) {
      result.push(
        toggle && {
          tag: 'style',
          content: [[
            `#toctoggle,#toctoggle:checked~ul{display:none}`,
            `#toctoggle~label:after{content:"${toggle[1]}"}`,
            `#toctoggle:checked~label:after{content:"${toggle[0]}"}`,
            `#toc label{cursor:pointer}`
          ].join('')]
        }
      )
    }

    result.push(
      {
        tag: 'div',
        attrs: { id: 'toc' },
        content: [
          toggle && { tag: 'input', attrs: { type: 'checkbox', role: 'button', id: 'toctoggle', checked: toggle[2] } },
          title && { tag: 'h2', content: [title] },
          toggle && { tag: 'label', attrs: { for: 'toctoggle' } },
          render(tocItems)
        ].filter(Boolean)
      }
    )

    return tree
  }
}

class PostHtmlTocError extends Error {
  constructor (...params) {
    super(...params)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PostHtmlTocError)
    }
    this.name = 'PostHtmlTocError'
  }
}
