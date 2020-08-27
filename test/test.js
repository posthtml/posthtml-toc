'use strict'

const test = require('ava')
const plugin = require('..')
const { readFileSync } = require('fs')
const path = require('path')
const posthtml = require('posthtml')
const fixtures = path.join(__dirname, 'fixtures')

test(`invalid 'options.insert' throws error`, (t) => {
  invalidOptions(t, { insert: 5 }, `unexpected 'options.insert': 5`)
})

test(`invalid 'options.insert' with no keys throws error`, (t) => {
  invalidOptions(t, { insert: {} }, `empty 'options.insert'`)
})

test(`invalid 'options.insert' with >1 key throws error`, (t) => {
  invalidOptions(t, { insert: { after: 'h1', before: 'h2' } },
    'too many keys in \'options.insert\': after,before')
})

test(`invalid 'options.insert' with invalid key throws error`, (t) => {
  invalidOptions(t, { insert: { life: 42 } }, `unexpected 'options.insert' key: life`)
})

test(`invalid 'options.insert' with invalid valid throws error`, (t) => {
  invalidOptions(t, { insert: { beforeChildren: undefined } }, `unexpected 'options.insert' value: undefined`)
})

test(`invalid 'options.title' throws error`, (t) => {
  invalidOptions(t, { title: null }, `unexpected 'options.title': null`)
})

test(`invalid 'options.toggle' throws error`, (t) => {
  invalidOptions(t, { toggle: ['hide', true] }, `unexpected 'options.toggle': hide,true`)
})

test(`invalid 'options.ignoreMissingSelector' throws error`, (t) => {
  invalidOptions(t, { ignoreMissingSelector: 42 }, `unexpected 'options.ignoreMissingSelector': 42`)
})

test(`invalid 'options.ignoreMissingHeadings' throws error`, (t) => {
  invalidOptions(t, { ignoreMissingHeadings: [] }, `unexpected 'options.ignoreMissingHeadings': `)
})

test('basic', (t) => {
  return compare(t, 'basic')
})

test('before', (t) => {
  return compare(t, 'before', { insert: { before: '#title2' } })
})

test('afterChildren', (t) => {
  return compare(t, 'afterChildren', { insert: { afterChildren: 'nav' } })
})

test('afterChildren with no children (1)', (t) => {
  return compare(t, 'afterChildren-no-children1', { insert: { afterChildren: 'nav' } })
})

test('afterChildren with no children (2)', (t) => {
  return compare(t, 'afterChildren-no-children2', { insert: { afterChildren: 'nav' } })
})

test('beforeChildren', (t) => {
  return compare(t, 'beforeChildren', { insert: { beforeChildren: 'nav' } })
})

test('beforeChildren with no children (1)', (t) => {
  return compare(t, 'beforeChildren-no-children1', { insert: { beforeChildren: '.no-children' } })
})

test('beforeChildren with no children (2)', (t) => {
  return compare(t, 'beforeChildren-no-children2', { insert: { beforeChildren: '.no-children' } })
})

test('toggle', (t) => {
  return compare(t, 'toggle', { insert: { after: 'p' }, title: 'Test', toggle: ['show', 'hide'] })
})

test('class', (t) => {
  return compare(t, 'class', { insert: { after: '.p' } })
})

test('id', (t) => {
  return compare(t, 'id', { insert: { after: '#p' } })
})

test('oncetitle', (t) => {
  return compare(t, 'oncetitle')
})

test('selector not found throws error', async (t) =>
  invalidHtml(t, {}, 'selector not found: h1', '')
)

test('ignoreMissingSelector does not throw error', (t) => {
  return compare(t, 'unchanged', { insert: { after: '#id-not-found' }, ignoreMissingSelector: true })
})

test('missing headings throws error', async (t) =>
  invalidHtml(t, {},
    'headings or heading content not found: h2,h3,h4,h5,h6',
    '<html><body><h1/></body></html>'
  )
)

test('missing heading content throws error', async (t) =>
  invalidHtml(t, {},
    'headings or heading content not found: h2,h3,h4,h5,h6',
    '<html><body><h1/><h2></h2></body></html>'
  )
)

test('whitespace heading content throws error', async (t) =>
  invalidHtml(t, {},
    'headings or heading content not found: h2,h3,h4,h5,h6',
    '<html><body><h1/><h2> </h2></body></html>'
  )
)

test('ignoreMissingHeadings does not throw error', (t) => {
  return compare(t, 'ignore-missing-headings', { ignoreMissingHeadings: true })
})

// const debug = function (html) {
//   const result = []
//   posthtml([function (tree) {
//     tree.match({ tag: 'a', attrs: { href: true } }, node => result.push(node.attrs.href))
//   }]).process(html, { sync: true })
//   return result.toString()
// }

function compare (t, name, options = {}) {
  const html = readFileSync(path.join(fixtures, `${name}.html`), 'utf8')
  const expected = readFileSync(path.join(fixtures, `${name}.expected.html`), 'utf8')

  return posthtml([plugin(options)])
    .process(html)
    .then((res) => {
      // console.log('res', debug(res.html))
      // console.log('exp', debug(expected))
      t.truthy(res.html === expected)
    })
}

function invalidOptions (t, options, message) {
  const e = t.throws(() => { plugin(options) })
  t.is(e.name, 'PostHtmlTocError')
  t.is(e.message, message)
}

async function invalidHtml (t, options, message, html = '') {
  const e = await t.throwsAsync(posthtml([plugin(options)]).process(html))
  t.is(e.name, 'PostHtmlTocError')
  t.is(e.message, message)
}
