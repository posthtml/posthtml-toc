'use strict'

/**
 * TOC Options
 *
 * @type {Object}
 * @prop {?String} options.after - html tag name
 * @prop {?String} options.title - title toc list
 * @prop {?Array[String, String, Boolean]} options.toggle - toggle button test
 */
module.exports = function (options = {}) {
  const {
    after = 'h1',
    title = 'Content',
    toggle // ['show', 'hide'],
  } = options

  if (!after) {
    throw new Error('TOC: options.after required')
  }

  if (!title) {
    throw new Error('TOC: options.title required')
  }

  return function toc (tree) {
    const list = []
    const toc = []

    function tocItem (level, href, text) {
      return [level, [], href, text]
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
        list.push(tocItem(parseInt(tag.slice(1)), attrs.id, content))
      }

      if (!isAppend && content && Array.isArray(content)) {
        for (let i = 0; i < content.length; i++) {
          let { tag, attrs } = content[i]
          if ((after.charAt(0) === '.' && attrs && attrs.class && attrs.class.includes(after.slice(1))) ||
            (after.charAt(0) === '#' && attrs && attrs.id && after.slice(1) === attrs.id) ||
            after === tag) {
            content.splice(i + 1, 0, toc)
            isAppend = true
            return node
          }
        }
      }

      return node
    })

    if (list.length < 2) {
      return tree
    }

    if (isAppend === false) {
      throw new Error(`TOC: not found selector "${after}"`)
    }

    for (let i = 1; i < list.length; i++) {
      let currentItem = list[i]
      let previousItem = list[i - 1]
      let previousList = list

      while (previousItem && currentItem && previousItem[0] < currentItem[0]) {
        previousList = previousItem[1]
        previousItem = list.splice(i, 1)[0]
        previousList.push(previousItem)
        currentItem = list[i]
      }

      if (!previousItem || !currentItem) {
        continue
      }

      if (previousItem[0] === currentItem[0]) {
        previousList.push(list.splice(i, 1)[0])
      }
    }

    function render (list) {
      let content = []

      list.forEach(function (item) {
        let children = item[1]
        let href = item[2]
        let text = item[3]
        let li = {
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
      toc.push(
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

    toc.push(
      {
        tag: 'div',
        attrs: { id: 'toc' },
        content: [
          toggle && { tag: 'input', attrs: { type: 'checkbox', role: 'button', id: 'toctoggle', checked: toggle[2] } },
          title && { tag: 'h2', content: [title] },
          toggle && { tag: 'label', attrs: { for: 'toctoggle' } },
          render(list)
        ].filter(Boolean)
      }
    )

    return tree
  }
}
