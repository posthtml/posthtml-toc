'use strict'

/**
 * TOC Options
 *
 * @type {Object}
 * @prop {?String} options.after - tag, class, id
 * @prop {?String} options.title - toc title
 * @prop {?Array[String, String, Boolean]} options.toggle - toggle button text options
 */
module.exports = function (options = {}) {
  const {
    after = 'h1',
    title = 'Content',
    toggle // ['show', 'hide', true],
  } = options

  if (!after) {
    throw new Error('TOC: options.after required')
  }

  if (!title) {
    throw new Error('TOC: options.title required')
  }

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
          const { tag, attrs } = content[i]
          if ((after.charAt(0) === '.' && attrs && attrs.class && attrs.class.includes(after.slice(1))) ||
            (after.charAt(0) === '#' && attrs && attrs.id && after.slice(1) === attrs.id) ||
            after === tag) {
            content.splice(i + 1, 0, result)
            isAppend = true
            return node
          }
        }
      }

      return node
    })

    if (isAppend === false) {
      throw new Error(`TOC: not found selector "${after}"`)
    }

    while (list.length > 1) {
      rollUp(list)
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
          render(list[0])
        ].filter(Boolean)
      }
    )

    return tree
  }
}
