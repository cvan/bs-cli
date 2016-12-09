# bs-cli
bs is a simple CLI front-end for [browser-sync].

```
bs hello.html
```
starts [browser-sync] and displays the specified HTML.
This is equivalent to:
```
browser-sync start --server --startPath hello.html --files '*'
```

### Root directory

bs uses the current directory as the root directory.
```
bs dir/hello.html
```
starts [browser-sync] at the current directory,
and starts `dir/hello.html`.

Use `-r` to specify the root directory.
```
bs -r .. hello.html
```
starts [browser-sync] with the parent directory as the root.

### Preprocessors

#### Bikeshed

If the specified file has `.bs` extension,
it is automatically preprocessed by [bikeshed].

#### Graphviz/dot

If the specified file has `.dot` extension,
it is automatically preprocessed by [Graphviz].

## Install

```
npm -g install bs-cli
```
or from github:
```
npm -g install kojiishi/bs-cli
```

[bikeshed]: https://github.com/tabatkins/bikeshed
[browser-sync]: https://www.browsersync.io/
[Graphviz]: http://www.graphviz.org/
