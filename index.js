'use strict';

var camelcase = require('camelcase'),
    assert    = require('assert'),
    get       = require('lodash.get'),
    set       = require('lodash.set');

/**
 * Merge where keys may be in camel-case or as environment variable.
 *
 * The destination object is mutated and returned.
 *
 * There is no direct reference to `process.env`, we simply support the syntax of `process.env` keys.
 *
 * <b>Behavior by key</b>
 *
 * <b>Environment variable</b>
 *
 * Keys which are **uppercase alpha-numeric**, with **possible underscore**, are legal environment variables per
 * IEEE Std 1003.1-2001 Shell and Utilities volume.
 *
 * These keys are assumed to describe camel case fields where single underscore implies camel-case, and double
 * underscore implies a dot (i.e. nested object). Their value must be some non-object.
 *
 * For example:
 * <pre>
 * merge({}, {
 *   FOO_BAR : 1,
 *   BAR__BAZ: true
 * });
 * </pre>
 *
 * gives:
 * <pre>
 * {
 *   fooBar: 1,
 *   bar: {
 *     baz: true
 *   }
 * }
 * </pre>
 *
 * <b>Conventional</b>
 *
 * Other keys describe immediate field names. Object paths in the key are not supported but object values are merged
 * recursively. The value may be any type.
 *
 * <b>Parsing</b>
 *
 * In both cases, where an existing value is in the destination object it implies a type. Any values from the source
 * object(s) are parsed to the destination type. Where no such field already exists, parsing is not performed. Only
 * `string`|`number`|`boolean` types may be parsed.
 *
 * @throws Error On illegal assignments
 * @param {object} destination A destination hash
 * @param {...object} sources Any number of source hashes
 * @returns {object} A complete assigned set
 */
function merge(destination, sources) {
  sources = Array.prototype.slice.call(arguments, 1);

  return sources
    .reduce(reduceOptions, destination);

  function reduceOptions(destination, source) {
    return Object.keys(source)
      .reduce(reduceKeys, destination);

    function reduceKeys(reduced, key) {
      var sourceValue    = source[key],
          isObjectSource = !!sourceValue && (typeof sourceValue === 'object');

      // uppercase key
      if (/^[A-Z_]+$/.test(key)) {

        // recursion is not supported
        assert(!isObjectSource, 'An upper-case key may not be used to assign an object value');

        // decode the given key to a camel-case object path
        var expectedKey = key
          .replace(/\W/g, '')     // only word characters are permitted
          .split('__')            // double-underscore replaces "." as the property delimiter
          .filter(Boolean)        // ignore zero length elements
          .map(camelcaseElement)  // convert "SOME_PROP" to "someProp"
          .join('.');             // convert back to "." property delimiter

        // parse and assign
        var existingValue = get(destination, expectedKey),
            newValue      = parse(sourceValue, typeof existingValue);
        set(reduced, expectedKey, newValue);
      }
      // otherwise recurse object sources
      else if (isObjectSource) {
        reduced[key] = recurse(destination[key], sourceValue);
      }
      // otherwise parse
      else {
        reduced[key] = parse(sourceValue, typeof destination[key]);
      }

      // next
      return reduced;
    }
  }

  function recurse(existingValue, sourceValue) {
    var isObject  = !!existingValue && (typeof existingValue === 'object'),
        destValue = isObject ? existingValue : {};
    return merge(destValue, sourceValue);
  }

}

module.exports = merge;

function parse(value, type) {
  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return parseInt(value);
    case 'boolean':
      return /^\s*true\s*$/.test(value);
    default:
      return value;
  }
}

function camelcaseElement(text) {
  return (text.length < 2) ? text.toLowerCase() : camelcase(text);
}