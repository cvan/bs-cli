# bs-cli

[`bs`][bs-cli] is a simple command-line tool for easy development of [Bikeshed][bikeshed] specs and [GraphViz][graphviz] graphs (powered by a local [Browsersync][browser-sync] server with live-reloading and [more options](https://www.browsersync.io/docs/options/)).


## Install

To install globally using [npm][npm] as `bs`:

```sh
npm -g install bs-cli
```

To install globally using [npm][npm] from the [Github repo][github-repo]:

```sh
npm -g install kojiishi/bs-cli
```


## Sample usage

To start [Browersync][browser-sync] and display the specified HTML:

```sh
bs hello.html
```

This is equivalent to:

```sh
browser-sync start --server --startPath hello.html --files '*'
```

## Root directory

`bs` uses the current directory as the root directory.

To start `bs` with the Browsersync server at the current directory and start a document (e.g., `dir/hello.html`):

```sh
bs dir/hello.html
```

To start the server with the parent directory as the root, use `-r` to specify the root directory:

```sh
cd dir
bs -r .. hello.html
```

## Preprocessors

### Bikeshed (`.bs`)

Files with `.bs` extensions are preprocessed by [bikeshed] or, if not
installed locally, its [online service][bikeshed-online].

Sample usage:

```sh
cd csswg-drafts/a-spec
bs -r .. Overview.bs
```

### GraphViz (`.dot`)

Files with `.dot` extensions are preprocessed by [GraphViz][graphviz].
[Graphviz] must be installed locally and its path specified by `PATH`.

Sample usage:

```sh
cd csswg-drafts/a-spec
bs -r .. Overview.dot
```


[graphviz]: http://www.graphviz.org/
[bikeshed-js]: https://www.npmjs.com/package/bikeshed-js
[bikeshed-online]: https://api.csswg.org/bikeshed/
[bikeshed]: https://github.com/tabatkins/bikeshed
[browser-sync]: https://www.browsersync.io/
[github-repo]: https://github.com/kojiishi/bs-cli
[npm]: https://www.npmjs.com/
