# Merge ENV

An object merging function that has special support for environment variables

## Usage

```javascript
function merge(destination:object, ...sources:object):object
```

Merge where keys may be in camel-case or as environment variable.

The destination object is mutated and returned.

There is no direct reference to `process.env`, we simply support the syntax of `process.env` keys.

### Behavior by key

#### Environment variable

Keys which are **uppercase alpha-numeric**, with possible **underscore**, are legal environment variables per IEEE Std 1003.1-2001 Shell and Utilities volume. These keys are assumed to describe camel-case fields where single underscore implies camel-case, and double underscore implies a dot (i.e. nested object). Their value must be some non-object.

For example:
```javascript
merge({}, {
  FOO_BAR : 1,
  BAR__BAZ: true
});
```

gives:
```javascript
{
  fooBar: 1,
  bar: {
    baz: true
  }
}
```

Note that setting `bar.baz` was possible even though `bar` was not present. However if `bar` is present and a non-object then it will not be assigned. This is undocumented behavior of [lodash.set()](https://lodash.com/docs#set) which is used internally.

#### Conventional

Other keys describe immediate field names. Object paths in the key are **not** supported but object values are merged recursively. The value may be any type.

### Parsing

In both cases, where an existing value is in the destination object it implies a type. Any values from the source
object(s) are parsed to the destination type. Where no such field already exists, parsing is not performed. Only `string`|`number`|`boolean` types may be parsed.
