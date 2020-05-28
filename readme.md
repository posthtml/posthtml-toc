# PostHTML TOC <img align="right" width="220" height="200" title="PostHTML logo" src="http://posthtml.github.io/posthtml/logo.svg">

[![NPM][npm]][npm-url]
[![Standard Code Style][style]][style-url]

> A table of contents, usually headed simply Contents and abbreviated informally as TOC, is a list, usually found on a page before the start of a written work, of its chapter or section titles or brief descriptions with their commencing page numbers. [Wikipedia](https://en.wikipedia.org/wiki/Table_of_contents)

The plugin works particularly well with markdown documents.

By defaults 

Before:
``` html
<html>
  <body>
    <h1 id="title1">Title 1</h1>
    <p>p1</p>
    <h2 id="title2">Title 2</h2>
    <p>p2</p>
    <h3 id="title3">Title 3</h3>
    <p>p3</p>
  </body>
</html>
```

After:
``` html
<html>
  <body>
    <h1 id="title1">Title 1</h1>
    <div id="toc">
      <div id="toctitle">Contents</div>
      <ul>
        <li>
          <a href="#title2">Title 2</a>
          <ul>
            <li><a href="#title3">Title 3</a></li>
          </ul>
        </li>
      </ul>
    </div>
    <p>p1</p>
    <h2 id="title2">Title 2</h2>
    <p>p2</p>
    <h3 id="title3">Title 3</h3>
    <p>p3</p>
  </body>
</html>
```

## Install

Installation in your project

```npm i posthtml posthtml-toc```

## Usage

``` js
const fs = require('fs');
const posthtml = require('posthtml');
const toc = require('posthtml-toc');

posthtml()
    .use(toc({ /* options */ }))
    .process(html/*, options */)
    .then(result => fs.writeFileSync('./after.html', result.html));
```

## Options

Defaults options

* `title = "Content"` — Title TOC block
* `after = "h1"` — tag after which the TOC will be inserted


### `after` options

Set tag, class, or id after which the TOC will be inserted

```js
  after: 'tag'
  after: '.class'
  after: '#id'
```

### `toggle` options
Before:
``` html
<html>
  <body>
    <h1 id="title1">Title 1</h1>
    <p>p1</p>
    <h2 id="title2">Title 2</h2>
    <p>p2</p>
    <h3 id="title3">Title 3</h3>
    <p>p3</p>
  </body>
</html>
```
Add option:
``` js
const fs = require('fs');
const posthtml = require('posthtml');
const toc = require('posthtml-toc');

posthtml()
    .use(toc({
      toggle: ['show', 'hide', true]
    }))
    .process(html/*, options */)
    .then(result => fs.writeFileSync('./after.html', result.html));
```
After:
``` html
<html>
  <body>
    <h1 id="title1">Title 1</h1>
    <style>
      #toctoggle,#toctoggle:checked~ul{display:none}
      #toctoggle~label:after{content:"hide"}
      #toctoggle:checked~label:after{content:"show"}
      #toc label{cursor:pointer}
    </style>
    <div id="toc">
      <input type="checkbox" role="button" id="toctoggle" checked>
      <h2>Content</h2>
      <label for="toctoggle"></label>
      <ul>
        <li>
          <a href="#title2">Title 2</a>
          <ul>
            <li><a href="#title3">Title 3</a></li>
          </ul>  
        </li>
      </ul>
    </div>
    <p>p1</p>
    <h2 id="title2">Title 2</h2>
    <p>p2</p>
    <h3 id="title3">Title 3</h3>
    <p>p3</p>
  </body>
</html>
```

### Contributing

See [PostHTML Guidelines](https://github.com/posthtml/posthtml/tree/master/docs) and [contribution guide](contributing.md).

### License [MIT](license)

[npm]: https://img.shields.io/npm/v/posthtml-toc.svg
[npm-url]: https://npmjs.com/package/posthtml-toc

[cover]: https://coveralls.io/repos/posthtml/posthtml-toc/badge.svg?branch=master
[cover-badge]: https://coveralls.io/r/posthtml/posthtml-toc?branch=master
