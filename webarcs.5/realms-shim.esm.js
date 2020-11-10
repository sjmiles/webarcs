// we'd like to abandon, but we can't, so just scream and break a lot of
// stuff. However, since we aren't really aborting the process, be careful to
// not throw an Error object which could be captured by child-Realm code and
// used to access the (too-powerful) primal-realm Error object.

function throwTantrum(s, err = undefined) {
  const msg = `please report internal shim error: ${s}`;

  // we want to log these 'should never happen' things.
  // eslint-disable-next-line no-console
  console.error(msg);
  if (err) {
    // eslint-disable-next-line no-console
    console.error(`${err}`);
    // eslint-disable-next-line no-console
    console.error(`${err.stack}`);
  }

  // eslint-disable-next-line no-debugger
  debugger;
  throw msg;
}

function assert(condition, message) {
  if (!condition) {
    throwTantrum(message);
  }
}

/**
 * safeStringifyFunction()
 * Remove code modifications introduced by ems and nyx in
 * test mode which intefere with Function.toString().
 */
function safeStringifyFunction(fn) {
  let src = `'use strict'; (${fn})`;

  // esm module creates "runtime" as "_" + hex(3) + "\u200D"

  // Restore eval which is modified by esm module.
  // (0, eval) => (0, <runtime>.e)
  src = src.replace(/\(0,\s*_[0-9a-fA-F]{3}\u200D\.e\)/g, '(0, eval)');

  // Restore globals such as Reflect which are modified by esm module.
  // Reflect => <runtime>.e.Reflect
  src = src.replace(/_[0-9a-fA-F]{3}\u200D\.g\./g, '');

  // Remove code coverage which is injected by nyc module.
  src = src.replace(/cov_[^+]+\+\+[;,]/g, '');

  return src;
}

// buildChildRealm is immediately turned into a string, and this function is
// never referenced again, because it closes over the wrong intrinsics

function buildChildRealm(unsafeRec, BaseRealm) {
  const { callAndWrapError } = unsafeRec;
  const {
    initRootRealm,
    initCompartment,
    getRealmGlobal,
    realmEvaluate
  } = BaseRealm;

  const { create, defineProperties } = Object;

  class Realm {
    constructor() {
      // The Realm constructor is not intended to be used with the new operator
      // or to be subclassed. It may be used as the value of an extends clause
      // of a class definition but a super call to the Realm constructor will
      // cause an exception.

      // When Realm is called as a function, an exception is also raised because
      // a class constructor cannot be invoked without 'new'.
      throw new TypeError('Realm is not a constructor');
    }

    static makeRootRealm(options = {}) {
      // This is the exposed interface.

      // Bypass the constructor.
      const r = create(Realm.prototype);
      callAndWrapError(initRootRealm, [unsafeRec, r, options]);
      return r;
    }

    static makeCompartment(options = {}) {
      // Bypass the constructor.
      const r = create(Realm.prototype);
      callAndWrapError(initCompartment, [unsafeRec, r, options]);
      return r;
    }

    // we omit the constructor because it is empty. All the personalization
    // takes place in one of the two static methods,
    // makeRootRealm/makeCompartment

    get global() {
      // this is safe against being called with strange 'this' because
      // baseGetGlobal immediately does a trademark check (it fails unless
      // this 'this' is present in a weakmap that is only populated with
      // legitimate Realm instances)
      return callAndWrapError(getRealmGlobal, [this]);
    }

    evaluate(x, endowments, options = {}) {
      // safe against strange 'this', as above
      return callAndWrapError(realmEvaluate, [this, x, endowments, options]);
    }
  }

  defineProperties(Realm, {
    toString: {
      value: () => 'function Realm() { [shim code] }',
      writable: false,
      enumerable: false,
      configurable: true
    }
  });

  defineProperties(Realm.prototype, {
    toString: {
      value: () => '[object Realm]',
      writable: false,
      enumerable: false,
      configurable: true
    }
  });

  return Realm;
}

// The parentheses means we don't bind the 'buildChildRealm' name inside the
// child's namespace. this would accept an anonymous function declaration.
// function expression (not a declaration) so it has a completion value.
const buildChildRealmString = safeStringifyFunction(buildChildRealm);

function buildCallAndWrapError() {
  // This Object and Reflect are brand new, from a new unsafeRec, so no user
  // code has been run or had a chance to manipulate them. Don't ever run this
  // function *after* user code has had a chance to pollute its environment,
  // or it could be used to gain access to BaseRealm and primal-realm Error
  // objects.
  const { getPrototypeOf } = Object;
  const { apply } = Reflect;
  const uncurryThis = fn => (thisArg, ...args) => apply(fn, thisArg, args);
  const mapGet = uncurryThis(Map.prototype.get);
  const setHas = uncurryThis(Set.prototype.has);

  const errorNameToErrorConstructor = new Map([
    ['EvalError', EvalError],
    ['RangeError', RangeError],
    ['ReferenceError', ReferenceError],
    ['SyntaxError', SyntaxError],
    ['TypeError', TypeError],
    ['URIError', URIError]
  ]);
  const errorConstructors = new Set([
    EvalError.prototype,
    RangeError.prototype,
    ReferenceError.prototype,
    SyntaxError.prototype,
    TypeError.prototype,
    URIError.prototype,
    Error.prototype
  ]);

  function callAndWrapError(target, args) {
    try {
      return apply(target, undefined, args);
    } catch (err) {
      // 1. Thrown primitives
      if (Object(err) !== err) {
        // err is a primitive value, which is safe to rethrow
        throw err;
      }

      // 2. Current realm errors
      if (setHas(errorConstructors, getPrototypeOf(err))) {
        // err is a from the current realm, which is safe to rethrow.
        // Object instances (normally) only contain intrinsics from the
        // same realm. An error containing intrinsics from different
        // realms would have to be manually constucted, which imply that
        // such intrinsics were available, and confinement was already lost.
        throw err;
      }

      // 3. Other realm errors
      let eName, eMessage, eStack;
      try {
        // The other environment might seek to use 'err' to reach the
        // parent's intrinsics and corrupt them. In addition, exceptions
        // raised in the primal realm need to be converted to the current
        // realm.

        // `${err.name}` will cause string coercion of 'err.name'.
        // If err.name is an object (probably a String of another Realm),
        // the coercion uses err.name.toString(), which is under the control
        // of the other realm. If err.name were a primitive (e.g. a number),
        // it would use Number.toString(err.name), using the child's version
        // of Number (which the child could modify to capture its argument for
        // later use), however primitives don't have properties like .prototype
        // so they aren't useful for an attack.
        eName = `${err.name}`;
        eMessage = `${err.message}`;
        eStack = `${err.stack || eMessage}`;
        // eName/eMessage/eStack are now realm-independent primitive strings, and
        // safe to expose.
      } catch (ignored) {
        // if err.name.toString() throws, keep the (parent realm) Error away.
        throw new Error('unknown error');
      }
      const ErrorConstructor =
        mapGet(errorNameToErrorConstructor, eName) || Error;
      try {
        throw new ErrorConstructor(eMessage);
      } catch (err2) {
        err2.stack = eStack; // replace with the captured inner stack
        throw err2;
      }
    }
  }

  return callAndWrapError;
}

const buildCallAndWrapErrorString = safeStringifyFunction(
  buildCallAndWrapError
);

// Declare shorthand functions. Sharing these declarations across modules
// improves both consistency and minification. Unused declarations are
// dropped by the tree shaking process.

// we capture these, not just for brevity, but for security. If any code
// modifies Object to change what 'assign' points to, the Realm shim would be
// corrupted.

const {
  assign,
  create,
  freeze,
  defineProperties, // Object.defineProperty is allowed to fail
  // silentlty, use Object.defineProperties instead.
  getOwnPropertyDescriptor,
  getOwnPropertyDescriptors,
  getOwnPropertyNames,
  getPrototypeOf,
  setPrototypeOf
} = Object;

const {
  apply,
  ownKeys // Reflect.ownKeys includes Symbols and unenumerables,
  // unlike Object.keys()
} = Reflect;

/**
 * uncurryThis() See
 * http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
 * which only lives at
 * http://web.archive.org/web/20160805225710/http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
 *
 * Performance:
 * 1. The native call is about 10x faster on FF than chrome
 * 2. The version using Function.bind() is about 100x slower on FF,
 *    equal on chrome, 2x slower on Safari
 * 3. The version using a spread and Reflect.apply() is about 10x
 *    slower on FF, equal on chrome, 2x slower on Safari
 *
 * const bind = Function.prototype.bind;
 * const uncurryThis = bind.bind(bind.call);
 */
const uncurryThis = fn => (thisArg, ...args) => apply(fn, thisArg, args);

// We also capture these for security: changes to Array.prototype after the
// Realm shim runs shouldn't affect subsequent Realm operations.
const objectHasOwnProperty = uncurryThis(
    Object.prototype.hasOwnProperty
  ),
  arrayFilter = uncurryThis(Array.prototype.filter),
  arrayPop = uncurryThis(Array.prototype.pop),
  arrayJoin = uncurryThis(Array.prototype.join),
  arrayConcat = uncurryThis(Array.prototype.concat),
  regexpTest = uncurryThis(RegExp.prototype.test),
  stringIncludes = uncurryThis(String.prototype.includes);

// These value properties of the global object are non-writable,
// non-configurable data properties.
const frozenGlobalPropertyNames = [
  // *** 18.1 Value Properties of the Global Object

  'Infinity',
  'NaN',
  'undefined'
];

// All the following stdlib items have the same name on both our intrinsics
// object and on the global object. Unlike Infinity/NaN/undefined, these
// should all be writable and configurable. This is divided into two
// sets. The stable ones are those the shim can freeze early because
// we don't expect anyone will want to mutate them. The unstable ones
// are the ones that we correctly initialize to writable and
// configurable so that they can still be replaced or removed.
const stableGlobalPropertyNames = [
  // *** 18.2 Function Properties of the Global Object

  // 'eval', // comes from safeEval instead
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',

  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',

  // *** 18.3 Constructor Properties of the Global Object

  'Array',
  'ArrayBuffer',
  'Boolean',
  'DataView',
  // 'Date',  // Unstable
  // 'Error',  // Unstable
  'EvalError',
  'Float32Array',
  'Float64Array',
  // 'Function',  // comes from safeFunction instead
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Map',
  'Number',
  'Object',
  // 'Promise',  // Unstable
  // 'Proxy',  // Unstable
  'RangeError',
  'ReferenceError',
  // 'RegExp',  // Unstable
  'Set',
  // 'SharedArrayBuffer'  // removed on Jan 5, 2018
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'URIError',
  'WeakMap',
  'WeakSet',

  // *** 18.4 Other Properties of the Global Object

  // 'Atomics', // removed on Jan 5, 2018
  'JSON',
  'Math',
  'Reflect',

  // *** Annex B

  'escape',
  'unescape'

  // *** ECMA-402

  // 'Intl'  // Unstable

  // *** ESNext

  // 'Realm' // Comes from createRealmGlobalObject()
];

const unstableGlobalPropertyNames = [
  'Date',
  'Error',
  'Promise',
  'Proxy',
  'RegExp',
  'Intl'
];

function getSharedGlobalDescs(
  unsafeGlobal,
  configurableGlobals = false
) {
  const descriptors = {};

  function describe(names, writable, enumerable, configurable) {
    for (const name of names) {
      const desc = getOwnPropertyDescriptor(unsafeGlobal, name);
      if (desc) {
        // Abort if an accessor is found on the unsafe global object
        // instead of a data property. We should never get into this
        // non standard situation.
        assert(
          'value' in desc,
          `unexpected accessor on global property: ${name}`
        );

        descriptors[name] = {
          value: desc.value,
          writable,
          enumerable,
          configurable
        };
      }
    }
  }

  if (configurableGlobals) {
    describe(frozenGlobalPropertyNames, true, false, true);
    // The following is correct but expensive.
    describe(stableGlobalPropertyNames, true, false, true);
  } else {
    // Instead, for now, we let these get optimized.
    describe(frozenGlobalPropertyNames, false, false, false);
    describe(stableGlobalPropertyNames, false, false, false);
  }
  // These we keep replaceable and removable, because we expect
  // others, e.g., SES, may want to do so.
  describe(unstableGlobalPropertyNames, true, false, true);

  return descriptors;
}

// Adapted from SES/Caja - Copyright (C) 2011 Google Inc.
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js

/**
 * Replace the legacy accessors of Object to comply with strict mode
 * and ES2016 semantics, we do this by redefining them while in 'use strict'.
 *
 * todo: list the issues resolved
 *
 * This function can be used in two ways: (1) invoked directly to fix the primal
 * realm's Object.prototype, and (2) converted to a string to be executed
 * inside each new RootRealm to fix their Object.prototypes. Evaluation requires
 * the function to have no dependencies, so don't import anything from
 * the outside.
 */

// todo: this file should be moved out to a separate repo and npm module.
function repairAccessors() {
  const {
    defineProperty,
    defineProperties,
    getOwnPropertyDescriptor,
    getPrototypeOf,
    prototype: objectPrototype
  } = Object;

  // On some platforms, the implementation of these functions act as
  // if they are in sloppy mode: if they're invoked badly, they will
  // expose the global object, so we need to repair these for
  // security. Thus it is our responsibility to fix this, and we need
  // to include repairAccessors. E.g. Chrome in 2016.

  try {
    // Verify that the method is not callable.
    // eslint-disable-next-line no-restricted-properties, no-underscore-dangle
    (0, objectPrototype.__lookupGetter__)('x');
  } catch (ignore) {
    // Throws, no need to patch.
    return;
  }

  function toObject(obj) {
    if (obj === undefined || obj === null) {
      throw new TypeError(`can't convert undefined or null to object`);
    }
    return Object(obj);
  }

  function asPropertyName(obj) {
    if (typeof obj === 'symbol') {
      return obj;
    }
    return `${obj}`;
  }

  function aFunction(obj, accessor) {
    if (typeof obj !== 'function') {
      throw TypeError(`invalid ${accessor} usage`);
    }
    return obj;
  }

  defineProperties(objectPrototype, {
    __defineGetter__: {
      value: function __defineGetter__(prop, func) {
        const O = toObject(this);
        defineProperty(O, prop, {
          get: aFunction(func, 'getter'),
          enumerable: true,
          configurable: true
        });
      }
    },
    __defineSetter__: {
      value: function __defineSetter__(prop, func) {
        const O = toObject(this);
        defineProperty(O, prop, {
          set: aFunction(func, 'setter'),
          enumerable: true,
          configurable: true
        });
      }
    },
    __lookupGetter__: {
      value: function __lookupGetter__(prop) {
        let O = toObject(this);
        prop = asPropertyName(prop);
        let desc;
        while (O && !(desc = getOwnPropertyDescriptor(O, prop))) {
          O = getPrototypeOf(O);
        }
        return desc && desc.get;
      }
    },
    __lookupSetter__: {
      value: function __lookupSetter__(prop) {
        let O = toObject(this);
        prop = asPropertyName(prop);
        let desc;
        while (O && !(desc = getOwnPropertyDescriptor(O, prop))) {
          O = getPrototypeOf(O);
        }
        return desc && desc.set;
      }
    }
  });
}

// Adapted from SES/Caja
// Copyright (C) 2011 Google Inc.
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
// https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js

/**
 * This block replaces the original Function constructor, and the original
 * %GeneratorFunction% %AsyncFunction% and %AsyncGeneratorFunction%, with
 * safe replacements that throw if invoked.
 *
 * These are all reachable via syntax, so it isn't sufficient to just
 * replace global properties with safe versions. Our main goal is to prevent
 * access to the Function constructor through these starting points.

 * After this block is done, the originals must no longer be reachable, unless
 * a copy has been made, and funtions can only be created by syntax (using eval)
 * or by invoking a previously saved reference to the originals.
 */

// todo: this file should be moved out to a separate repo and npm module.
function repairFunctions() {
  const { defineProperties, getPrototypeOf, setPrototypeOf } = Object;

  /**
   * The process to repair constructors:
   * 1. Create an instance of the function by evaluating syntax
   * 2. Obtain the prototype from the instance
   * 3. Create a substitute tamed constructor
   * 4. Replace the original constructor with the tamed constructor
   * 5. Replace tamed constructor prototype property with the original one
   * 6. Replace its [[Prototype]] slot with the tamed constructor of Function
   */
  function repairFunction(name, declaration) {
    let FunctionInstance;
    try {
      // eslint-disable-next-line no-new-func
      FunctionInstance = (0, eval)(declaration);
    } catch (e) {
      if (e instanceof SyntaxError) {
        // Prevent failure on platforms where async and/or generators
        // are not supported.
        return;
      }
      // Re-throw
      throw e;
    }
    const FunctionPrototype = getPrototypeOf(FunctionInstance);

    // Prevents the evaluation of source when calling constructor on the
    // prototype of functions.
    const TamedFunction = function() {
      throw new TypeError('Not available');
    };
    defineProperties(TamedFunction, { name: { value: name } });

    // (new Error()).constructors does not inherit from Function, because Error
    // was defined before ES6 classes. So we don't need to repair it too.

    // (Error()).constructor inherit from Function, which gets a tamed
    // constructor here.

    // todo: in an ES6 class that does not inherit from anything, what does its
    // constructor inherit from? We worry that it inherits from Function, in
    // which case instances could give access to unsafeFunction. markm says
    // we're fine: the constructor inherits from Object.prototype

    // This line replaces the original constructor in the prototype chain
    // with the tamed one. No copy of the original is peserved.
    defineProperties(FunctionPrototype, {
      constructor: { value: TamedFunction }
    });

    // This line sets the tamed constructor's prototype data property to
    // the original one.
    defineProperties(TamedFunction, {
      prototype: { value: FunctionPrototype }
    });

    if (TamedFunction !== Function.prototype.constructor) {
      // Ensures that all functions meet "instanceof Function" in a realm.
      setPrototypeOf(TamedFunction, Function.prototype.constructor);
    }
  }

  // Here, the order of operation is important: Function needs to be repaired
  // first since the other repaired constructors need to inherit from the tamed
  // Function function constructor.

  // note: this really wants to be part of the standard, because new
  // constructors may be added in the future, reachable from syntax, and this
  // list must be updated to match.

  // "plain arrow functions" inherit from Function.prototype

  repairFunction('Function', '(function(){})');
  repairFunction('GeneratorFunction', '(function*(){})');
  repairFunction('AsyncFunction', '(async function(){})');
  repairFunction('AsyncGeneratorFunction', '(async function*(){})');
}

// this module must never be importable outside the Realm shim itself

// A "context" is a fresh unsafe Realm as given to us by existing platforms.
// We need this to implement the shim. However, when Realms land for real,
// this feature will be provided by the underlying engine instead.

// note: in a node module, the top-level 'this' is not the global object
// (it's *something* but we aren't sure what), however an indirect eval of
// 'this' will be the correct global object.

const unsafeGlobalSrc = "'use strict'; this";
const unsafeGlobalEvalSrc = `(0, eval)("'use strict'; this")`;

// This method is only exported for testing purposes.
function createNewUnsafeGlobalForNode() {
  // Note that webpack and others will shim 'vm' including the method
  // 'runInNewContext', so the presence of vm is not a useful check

  // TODO: Find a better test that works with bundlers
  // eslint-disable-next-line no-new-func
  const isNode = new Function(
    'try {return this===global}catch(e){return false}'
  )();

  if (!isNode) {
    return undefined;
  }

  // eslint-disable-next-line global-require
  const vm = require('vm');

  // Use unsafeGlobalEvalSrc to ensure we get the right 'this'.
  const unsafeGlobal = vm.runInNewContext(unsafeGlobalEvalSrc);

  return unsafeGlobal;
}

// This method is only exported for testing purposes.
function createNewUnsafeGlobalForBrowser() {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';

  document.body.appendChild(iframe);
  const unsafeGlobal = iframe.contentWindow.eval(unsafeGlobalSrc);

  // We keep the iframe attached to the DOM because removing it
  // causes its global object to lose intrinsics, its eval()
  // function to evaluate code, etc.

  // TODO: can we remove and garbage-collect the iframes?

  return unsafeGlobal;
}

const getNewUnsafeGlobal = () => {
  const newUnsafeGlobalForBrowser = createNewUnsafeGlobalForBrowser();
  const newUnsafeGlobalForNode = createNewUnsafeGlobalForNode();
  if (
    (!newUnsafeGlobalForBrowser && !newUnsafeGlobalForNode) ||
    (newUnsafeGlobalForBrowser && newUnsafeGlobalForNode)
  ) {
    throw new Error('unexpected platform, unable to create Realm');
  }
  return newUnsafeGlobalForBrowser || newUnsafeGlobalForNode;
};

// The unsafeRec is shim-specific. It acts as the mechanism to obtain a fresh
// set of intrinsics together with their associated eval and Function
// evaluators. These must be used as a matched set, since the evaluators are
// tied to a set of intrinsics, aka the "undeniables". If it were possible to
// mix-and-match them from different contexts, that would enable some
// attacks.
function createUnsafeRec(
  unsafeGlobal,
  allShims = [],
  configurableGlobals = false
) {
  const sharedGlobalDescs = getSharedGlobalDescs(
    unsafeGlobal,
    configurableGlobals
  );

  const unsafeEval = unsafeGlobal.eval;
  const unsafeFunction = unsafeGlobal.Function;
  const callAndWrapError = unsafeEval(buildCallAndWrapErrorString)();

  return freeze({
    unsafeGlobal,
    sharedGlobalDescs,
    unsafeEval,
    unsafeFunction,
    callAndWrapError,
    allShims
  });
}

const repairAccessorsString = safeStringifyFunction(repairAccessors);
const repairFunctionsString = safeStringifyFunction(repairFunctions);

// Create a new unsafeRec from a brand new context, with new intrinsics and a
// new global object
function createNewUnsafeRec(allShims, configurableGlobals = false) {
  const unsafeGlobal = getNewUnsafeGlobal();
  const unsafeRec = createUnsafeRec(
    unsafeGlobal,
    allShims,
    configurableGlobals
  );
  const { unsafeEval } = unsafeRec;
  unsafeEval(repairAccessorsString)();
  unsafeEval(repairFunctionsString)();
  return unsafeRec;
}

// Create a new unsafeRec from the current context, where the Realm shim is
// being parsed and executed, aka the "Primal Realm"
function createCurrentUnsafeRec() {
  const unsafeEval = eval;
  const unsafeGlobal = unsafeEval(unsafeGlobalSrc);
  repairAccessors();
  repairFunctions();
  return createUnsafeRec(unsafeGlobal);
}

// todo: think about how this interacts with endowments, check for conflicts
// between the names being optimized and the ones added by endowments

/**
 * Simplified validation of indentifier names: may only contain alphanumeric
 * characters (or "$" or "_"), and may not start with a digit. This is safe
 * and does not reduces the compatibility of the shim. The motivation for
 * this limitation was to decrease the complexity of the implementation,
 * and to maintain a resonable level of performance.
 * Note: \w is equivalent [a-zA-Z_0-9]
 * See 11.6.1 Identifier Names
 */
const identifierPattern = /^[a-zA-Z_$][\w$]*$/;

/**
 * In JavaScript you cannot use these reserved words as variables.
 * See 11.6.1 Identifier Names
 */
const keywords = new Set([
  // 11.6.2.1 Keywords
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',

  // Also reserved when parsing strict mode code
  'let',
  'static',

  // 11.6.2.2 Future Reserved Words
  'enum',

  // Also reserved when parsing strict mode code
  'implements',
  'package',
  'protected',
  'interface',
  'private',
  'public',

  // Reserved but not mentioned in specs
  'await',

  'null',
  'true',
  'false',

  'this',
  'arguments'
]);

/**
 * getOptimizableGlobals()
 * What variable names might it bring into scope? These include all
 * property names which can be variable names, including the names
 * of inherited properties. It excludes symbols and names which are
 * keywords. We drop symbols safely. Currently, this shim refuses
 * service if any of the names are keywords or keyword-like. This is
 * safe and only prevent performance optimization.
 */
function getOptimizableGlobals(globalObject, localObject = {}) {
  const globalNames = getOwnPropertyNames(globalObject);
  // getOwnPropertyNames does ignore Symbols so we don't need this extra check:
  // typeof name === 'string' &&
  const constants = arrayFilter(globalNames, name => {
    // Exclude globals that will be hidden behind an object positioned
    // closer in the resolution scope chain, typically the endowments.
    if (name in localObject) {
      return false;
    }

    // Ensure we have a valid identifier. We use regexpTest rather than
    // /../.test() to guard against the case where RegExp has been poisoned.
    if (
      name === 'eval' ||
      keywords.has(name) ||
      !regexpTest(identifierPattern, name)
    ) {
      return false;
    }

    const desc = getOwnPropertyDescriptor(globalObject, name);
    return (
      //
      // The getters will not have .writable, don't let the falsyness of
      // 'undefined' trick us: test with === false, not ! . However descriptors
      // inherit from the (potentially poisoned) global object, so we might see
      // extra properties which weren't really there. Accessor properties have
      // 'get/set/enumerable/configurable', while data properties have
      // 'value/writable/enumerable/configurable'.
      desc.configurable === false &&
      desc.writable === false &&
      //
      // Checks for data properties because they're the only ones we can
      // optimize (accessors are most likely non-constant). Descriptors can't
      // can't have accessors and value properties at the same time, therefore
      // this check is sufficient. Using explicit own property deal with the
      // case where Object.prototype has been poisoned.
      objectHasOwnProperty(desc, 'value')
    );
  });

  return constants;
}

/**
 * ScopeHandler manages a Proxy which serves as the global scope for the
 * safeEvaluator operation (the Proxy is the argument of a 'with' binding).
 * As described in createSafeEvaluator(), it has several functions:
 * - allow the very first (and only the very first) use of 'eval' to map to
 *   the real (unsafe) eval function, so it acts as a 'direct eval' and can
 *    access its lexical scope (which maps to the 'with' binding, which the
 *   ScopeHandler also controls).
 * - ensure that all subsequent uses of 'eval' map to the safeEvaluator,
 *   which lives as the 'eval' property of the safeGlobal.
 * - route all other property lookups at the safeGlobal.
 * - hide the unsafeGlobal which lives on the scope chain above the 'with'.
 * - ensure the Proxy invariants despite some global properties being frozen.
 *
 * @returns {ProxyHandler<any> & Record<string, any>}
 */
function buildScopeHandler(
  unsafeRec,
  safeGlobal,
  endowments = {},
  sloppyGlobals = false
) {
  const { unsafeGlobal, unsafeEval } = unsafeRec;

  const { freeze, getOwnPropertyDescriptor } = Object;
  const { get: reflectGet, set: reflectSet } = Reflect;

  /**
   * alwaysThrowHandler is a proxy handler which throws on any trap called.
   * It's made from a proxy with a get trap that throws. Its target is
   * an immutable (frozen) object and is safe to share, except accross realms
   */
  const alwaysThrowHandler = new Proxy(freeze({}), {
    get(target, prop) {
      // todo: replace with throwTantrum
      throw new TypeError(
        `unexpected scope handler trap called: ${String(prop)}`
      );
    }
  });

  return {
    // The scope handler throws if any trap other than get/set/has are run
    // (e.g. getOwnPropertyDescriptors, apply, getPrototypeOf).
    // eslint-disable-next-line no-proto
    __proto__: alwaysThrowHandler,

    // This flag allow us to determine if the eval() call is an done by the
    // realm's code or if it is user-land invocation, so we can react differently.
    // We use a property and not an accessor to avoid increasing the stack trace
    // and reduce the possibility of OOM.
    useUnsafeEvaluator: false,

    get(shadow, prop) {
      if (typeof prop === 'symbol') {
        // Safe to return a primal realm Object here because the only code that
        // can do a get() on a non-string is the internals of with() itself,
        // and the only thing it does is to look for properties on it. User
        // code cannot do a lookup on non-strings.
        return undefined;
      }

      // Special treatment for eval. The very first lookup of 'eval' gets the
      // unsafe (real direct) eval, so it will get the lexical scope that uses
      // the 'with' context.
      if (prop === 'eval') {
        // test that it is true rather than merely truthy
        if (this.useUnsafeEvaluator === true) {
          // revoke before use
          this.useUnsafeEvaluator = false;
          return unsafeEval;
        }
        // fall through
      }

      // Properties of the endowments.
      if (prop in endowments) {
        // Ensure that the 'this' value on getters resolves
        // to the safeGlobal, not to the endowments object.
        return reflectGet(endowments, prop, safeGlobal);
      }

      // Properties of the global.
      return reflectGet(safeGlobal, prop);
    },

    // eslint-disable-next-line class-methods-use-this
    set(shadow, prop, value) {
      // Properties of the endowments.
      if (prop in endowments) {
        const desc = getOwnPropertyDescriptor(endowments, prop);
        if ('value' in desc) {
          // Work around a peculiar behavior in the specs, where
          // value properties are defined on the receiver.
          return reflectSet(endowments, prop, value);
        }
        // Ensure that the 'this' value on setters resolves
        // to the safeGlobal, not to the endowments object.
        return reflectSet(endowments, prop, value, safeGlobal);
      }

      // Properties of the global.
      return reflectSet(safeGlobal, prop, value);
    },

    // we need has() to return false for some names to prevent the lookup  from
    // climbing the scope chain and eventually reaching the unsafeGlobal
    // object, which is bad.

    // note: unscopables! every string in Object[Symbol.unscopables]

    // todo: we'd like to just have has() return true for everything, and then
    // use get() to raise a ReferenceError for anything not on the safe global.
    // But we want to be compatible with ReferenceError in the normal case and
    // the lack of ReferenceError in the 'typeof' case. Must either reliably
    // distinguish these two cases (the trap behavior might be different), or
    // we rely on a mandatory source-to-source transform to change 'typeof abc'
    // to XXX. We already need a mandatory parse to prevent the 'import',
    // since it's a special form instead of merely being a global variable/

    // note: if we make has() return true always, then we must implement a
    // set() trap to avoid subverting the protection of strict mode (it would
    // accept assignments to undefined globals, when it ought to throw
    // ReferenceError for such assignments)

    has(shadow, prop) {
      // proxies stringify 'prop', so no TOCTTOU danger here

      if (sloppyGlobals) {
        // Everything is potentially available.
        return true;
      }

      // unsafeGlobal: hide all properties of unsafeGlobal at the
      // expense of 'typeof' being wrong for those properties. For
      // example, in the browser, evaluating 'document = 3', will add
      // a property to safeGlobal instead of throwing a
      // ReferenceError.
      if (
        prop === 'eval' ||
        prop in endowments ||
        prop in safeGlobal ||
        prop in unsafeGlobal
      ) {
        return true;
      }

      return false;
    },

    // note: this is likely a bug of safari
    // https://bugs.webkit.org/show_bug.cgi?id=195534

    getPrototypeOf() {
      return null;
    }
  };
}

const buildScopeHandlerString = safeStringifyFunction(buildScopeHandler);

function buildSafeEval(unsafeRec, safeEvalOperation) {
  const { callAndWrapError } = unsafeRec;

  const { defineProperties } = Object;

  // We use the the concise method syntax to create an eval without a
  // [[Construct]] behavior (such that the invocation "new eval()" throws
  // TypeError: eval is not a constructor"), but which still accepts a
  // 'this' binding.
  const safeEval = {
    eval() {
      return callAndWrapError(safeEvalOperation, arguments);
    }
  }.eval;

  // safeEval's prototype RootRealm's value and instanceof Function
  // is true inside the realm. It doesn't point at the primal realm
  // value, and there is no defense against leaking primal realm
  // intrinsics.

  defineProperties(safeEval, {
    toString: {
      // We break up the following literal string so that an
      // apparent direct eval syntax does not appear in this
      // file. Thus, we avoid rejection by the overly eager
      // rejectDangerousSources.
      value: () => `function ${'eval'}() { [shim code] }`,
      writable: false,
      enumerable: false,
      configurable: true
    }
  });

  return safeEval;
}
const buildSafeEvalString = safeStringifyFunction(buildSafeEval);

function buildSafeFunction(unsafeRec, safeFunctionOperation) {
  const { callAndWrapError, unsafeFunction } = unsafeRec;

  const { defineProperties } = Object;

  const safeFunction = function Function() {
    return callAndWrapError(safeFunctionOperation, arguments);
  };

  // Ensure that Function from any compartment in a root realm can be used
  // with instance checks in any compartment of the same root realm.

  defineProperties(safeFunction, {
    // Ensure that any function created in any compartment in a root realm is an
    // instance of Function in any compartment of the same root ralm.
    prototype: { value: unsafeFunction.prototype },

    // Provide a custom output without overwriting the
    // Function.prototype.toString which is called by some third-party
    // libraries.
    toString: {
      value: () => 'function Function() { [shim code] }',
      writable: false,
      enumerable: false,
      configurable: true
    }
  });

  return safeFunction;
}
const buildSafeFunctionString = safeStringifyFunction(buildSafeFunction);

function applyTransforms(rewriterState, transforms) {
  const { create, getOwnPropertyDescriptors } = Object;
  const { apply } = Reflect;
  const uncurryThis = fn => (thisArg, ...args) => apply(fn, thisArg, args);
  const arrayReduce = uncurryThis(Array.prototype.reduce);

  // Clone before calling transforms.
  rewriterState = {
    src: `${rewriterState.src}`,
    endowments: create(
      null,
      getOwnPropertyDescriptors(rewriterState.endowments)
    )
  };

  // Rewrite the source, threading through rewriter state as necessary.
  rewriterState = arrayReduce(
    transforms,
    (rs, transform) => (transform.rewrite ? transform.rewrite(rs) : rs),
    rewriterState
  );

  // Clone after transforms
  rewriterState = {
    src: `${rewriterState.src}`,
    endowments: create(
      null,
      getOwnPropertyDescriptors(rewriterState.endowments)
    )
  };

  return rewriterState;
}

const applyTransformsString = safeStringifyFunction(applyTransforms);

// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-html-like-comments
// explains that JavaScript parsers may or may not recognize html
// comment tokens "<" immediately followed by "!--" and "--"
// immediately followed by ">" in non-module source text, and treat
// them as a kind of line comment. Since otherwise both of these can
// appear in normal JavaScript source code as a sequence of operators,
// we have the terrifying possibility of the same source code parsing
// one way on one correct JavaScript implementation, and another way
// on another.
//
// This shim takes the conservative strategy of just rejecting source
// text that contains these strings anywhere. Note that this very
// source file is written strangely to avoid mentioning these
// character strings explicitly.

// We do not write the regexp in a straightforward way, so that an
// apparennt html comment does not appear in this file. Thus, we avoid
// rejection by the overly eager rejectDangerousSources.
const htmlCommentPattern = new RegExp(`(?:${'<'}!--|--${'>'})`);

function rejectHtmlComments(s) {
  const index = s.search(htmlCommentPattern);
  if (index !== -1) {
    const linenum = s.slice(0, index).split('\n').length; // more or less
    throw new SyntaxError(
      `possible html comment syntax rejected around line ${linenum}`
    );
  }
}

// The proposed dynamic import expression is the only syntax currently
// proposed, that can appear in non-module JavaScript code, that
// enables direct access to the outside world that cannot be
// surpressed or intercepted without parsing and rewriting. Instead,
// this shim conservatively rejects any source text that seems to
// contain such an expression. To do this safely without parsing, we
// must also reject some valid programs, i.e., those containing
// apparent import expressions in literal strings or comments.

// The current conservative rule looks for the identifier "import"
// followed by either an open paren or something that looks like the
// beginning of a comment. We assume that we do not need to worry
// about html comment syntax because that was already rejected by
// rejectHtmlComments.

// this \s *must* match all kinds of syntax-defined whitespace. If e.g.
// U+2028 (LINE SEPARATOR) or U+2029 (PARAGRAPH SEPARATOR) is treated as
// whitespace by the parser, but not matched by /\s/, then this would admit
// an attack like: import\u2028('power.js') . We're trying to distinguish
// something like that from something like importnotreally('power.js') which
// is perfectly safe.

const importPattern = /\bimport\s*(?:\(|\/[/*])/;

function rejectImportExpressions(s) {
  const index = s.search(importPattern);
  if (index !== -1) {
    const linenum = s.slice(0, index).split('\n').length; // more or less
    throw new SyntaxError(
      `possible import expression rejected around line ${linenum}`
    );
  }
}

// The shim cannot correctly emulate a direct eval as explained at
// https://github.com/Agoric/realms-shim/issues/12
// Without rejecting apparent direct eval syntax, we would
// accidentally evaluate these with an emulation of indirect eval. Tp
// prevent future compatibility problems, in shifting from use of the
// shim to genuine platform support for the proposal, we should
// instead statically reject code that seems to contain a direct eval
// expression.
//
// As with the dynamic import expression, to avoid a full parse, we do
// this approximately with a regexp, that will also reject strings
// that appear safely in comments or strings. Unlike dynamic import,
// if we miss some, this only creates future compat problems, not
// security problems. Thus, we are only trying to catch innocent
// occurrences, not malicious one. In particular, `(eval)(...)` is
// direct eval syntax that would not be caught by the following regexp.

const someDirectEvalPattern = /\beval\s*(?:\(|\/[/*])/;

function rejectSomeDirectEvalExpressions(s) {
  const index = s.search(someDirectEvalPattern);
  if (index !== -1) {
    const linenum = s.slice(0, index).split('\n').length; // more or less
    throw new SyntaxError(
      `possible direct eval expression rejected around line ${linenum}`
    );
  }
}

function rejectDangerousSources(s) {
  rejectHtmlComments(s);
  rejectImportExpressions(s);
  rejectSomeDirectEvalExpressions(s);
}

// Export a rewriter transform.
const rejectDangerousSourcesTransform = {
  rewrite(rs) {
    rejectDangerousSources(rs.src);
    return rs;
  }
};

// Portions adapted from V8 - Copyright 2016 the V8 project authors.

function buildOptimizer(constants) {
  // No need to build an oprimizer when there are no constants.
  if (constants.length === 0) return '';
  // Use 'this' to avoid going through the scope proxy, which is unecessary
  // since the optimizer only needs references to the safe global.
  return `const {${arrayJoin(constants, ',')}} = this;`;
}

function createScopedEvaluatorFactory(unsafeRec, constants) {
  const { unsafeFunction } = unsafeRec;

  const optimizer = buildOptimizer(constants);

  // Create a function in sloppy mode, so that we can use 'with'. It returns
  // a function in strict mode that evaluates the provided code using direct
  // eval, and thus in strict mode in the same scope. We must be very careful
  // to not create new names in this scope

  // 1: we use 'with' (around a Proxy) to catch all free variable names. The
  // first 'arguments[0]' holds the Proxy which safely wraps the safeGlobal
  // 2: 'optimizer' catches common variable names for speed
  // 3: The inner strict function is effectively passed two parameters:
  //    a) its arguments[0] is the source to be directly evaluated.
  //    b) its 'this' is the this binding seen by the code being
  //       directly evaluated.

  // everything in the 'optimizer' string is looked up in the proxy
  // (including an 'arguments[0]', which points at the Proxy). 'function' is
  // a keyword, not a variable, so it is not looked up. then 'eval' is looked
  // up in the proxy, that's the first time it is looked up after
  // useUnsafeEvaluator is turned on, so the proxy returns the real the
  // unsafeEval, which satisfies the IsDirectEvalTrap predicate, so it uses
  // the direct eval and gets the lexical scope. The second 'arguments[0]' is
  // looked up in the context of the inner function. The *contents* of
  // arguments[0], because we're using direct eval, are looked up in the
  // Proxy, by which point the useUnsafeEvaluator switch has been flipped
  // back to 'false', so any instances of 'eval' in that string will get the
  // safe evaluator.

  return unsafeFunction(`
    with (arguments[0]) {
      ${optimizer}
      return function() {
        'use strict';
        return eval(arguments[0]);
      };
    }
  `);
}

function createSafeEvaluatorFactory(
  unsafeRec,
  safeGlobal,
  transforms,
  sloppyGlobals
) {
  const { unsafeEval } = unsafeRec;
  const applyTransforms = unsafeEval(applyTransformsString);

  function factory(endowments = {}, options = {}) {
    // todo clone all arguments passed to returned function
    const localTransforms = options.transforms || [];
    const realmTransforms = transforms || [];

    const mandatoryTransforms = [rejectDangerousSourcesTransform];
    const allTransforms = arrayConcat(
      localTransforms,
      realmTransforms,
      mandatoryTransforms
    );

    function safeEvalOperation(src) {
      let rewriterState = { src, endowments };
      rewriterState = applyTransforms(rewriterState, allTransforms);

      // Combine all optimizable globals.
      const globalConstants = getOptimizableGlobals(
        safeGlobal,
        rewriterState.endowments
      );
      const localConstants = getOptimizableGlobals(rewriterState.endowments);
      const constants = arrayConcat(globalConstants, localConstants);

      const scopedEvaluatorFactory = createScopedEvaluatorFactory(
        unsafeRec,
        constants
      );

      const scopeHandler = unsafeEval(buildScopeHandlerString)(
        unsafeRec,
        safeGlobal,
        rewriterState.endowments,
        sloppyGlobals
      );
      const scopeProxyRevocable = Proxy.revocable({}, scopeHandler);
      const scopeProxy = scopeProxyRevocable.proxy;
      const scopedEvaluator = apply(scopedEvaluatorFactory, safeGlobal, [
        scopeProxy
      ]);

      scopeHandler.useUnsafeEvaluator = true;
      let err;
      try {
        // Ensure that "this" resolves to the safe global.
        return apply(scopedEvaluator, safeGlobal, [rewriterState.src]);
      } catch (e) {
        // stash the child-code error in hopes of debugging the internal failure
        err = e;
        throw e;
      } finally {
        if (scopeHandler.useUnsafeEvaluator) {
          // the proxy switches this off immediately after ths
          // first access, but if that's not the case we prevent
          // further variable resolution on the scope and abort.
          scopeProxyRevocable.revoke();
          throwTantrum('handler did not revoke useUnsafeEvaluator', err);
        }
      }
    }

    return safeEvalOperation;
  }

  return factory;
}

function createSafeEvaluator(unsafeRec, safeEvalOperation) {
  const { unsafeEval, unsafeFunction } = unsafeRec;

  const safeEval = unsafeEval(buildSafeEvalString)(
    unsafeRec,
    safeEvalOperation
  );

  assert(getPrototypeOf(safeEval).constructor !== Function, 'hide Function');
  assert(
    getPrototypeOf(safeEval).constructor !== unsafeFunction,
    'hide unsafeFunction'
  );

  return safeEval;
}

function createSafeEvaluatorWhichTakesEndowments(safeEvaluatorFactory) {
  return (x, endowments, options = {}) =>
    safeEvaluatorFactory(endowments, options)(x);
}

/**
 * A safe version of the native Function which relies on
 * the safety of evalEvaluator for confinement.
 */
function createFunctionEvaluator(unsafeRec, safeEvalOperation) {
  const { unsafeGlobal, unsafeEval, unsafeFunction } = unsafeRec;

  function safeFunctionOperation(...params) {
    const functionBody = `${arrayPop(params) || ''}`;
    let functionParams = `${arrayJoin(params, ',')}`;
    if (!regexpTest(/^[\w\s,]*$/, functionParams)) {
      throw new SyntaxError(
        'shim limitation: Function arg must be simple ASCII identifiers, possibly separated by commas: no default values, pattern matches, or non-ASCII parameter names'
      );
      // this protects against Matt Austin's clever attack:
      // Function("arg=`", "/*body`){});({x: this/**/")
      // which would turn into
      //     (function(arg=`
      //     /*``*/){
      //      /*body`){});({x: this/**/
      //     })
      // which parses as a default argument of `\n/*``*/){\n/*body` , which
      // is a pair of template literals back-to-back (so the first one
      // nominally evaluates to the parser to use on the second one), which
      // can't actually execute (because the first literal evals to a string,
      // which can't be a parser function), but that doesn't matter because
      // the function is bypassed entirely. When that gets evaluated, it
      // defines (but does not invoke) a function, then evaluates a simple
      // {x: this} expression, giving access to the safe global.
    }

    // Is this a real functionBody, or is someone attempting an injection
    // attack? This will throw a SyntaxError if the string is not actually a
    // function body. We coerce the body into a real string above to prevent
    // someone from passing an object with a toString() that returns a safe
    // string the first time, but an evil string the second time.
    // eslint-disable-next-line no-new, new-cap
    new unsafeFunction(functionBody);

    if (stringIncludes(functionParams, ')')) {
      // If the formal parameters string include ) - an illegal
      // character - it may make the combined function expression
      // compile. We avoid this problem by checking for this early on.

      // note: v8 throws just like this does, but chrome accepts
      // e.g. 'a = new Date()'
      throw new unsafeGlobal.SyntaxError(
        'shim limitation: Function arg string contains parenthesis'
      );
      // todo: shim integrity threat if they change SyntaxError
    }

    // todo: check to make sure this .length is safe. markm says safe.
    if (functionParams.length > 0) {
      // If the formal parameters include an unbalanced block comment, the
      // function must be rejected. Since JavaScript does not allow nested
      // comments we can include a trailing block comment to catch this.
      functionParams += '\n/*``*/';
    }

    const src = `(function(${functionParams}){\n${functionBody}\n})`;

    return safeEvalOperation(src);
  }

  const safeFunction = unsafeEval(buildSafeFunctionString)(
    unsafeRec,
    safeFunctionOperation
  );

  assert(
    getPrototypeOf(safeFunction).constructor !== Function,
    'hide Function'
  );
  assert(
    getPrototypeOf(safeFunction).constructor !== unsafeFunction,
    'hide unsafeFunction'
  );

  return safeFunction;
}

// Mimic private members on the realm instances.
// We define it in the same module and do not export it.
const RealmRecForRealmInstance = new WeakMap();

function getRealmRecForRealmInstance(realm) {
  // Detect non-objects.
  assert(Object(realm) === realm, 'bad object, not a Realm instance');
  // Realm instance has no realmRec. Should not proceed.
  assert(RealmRecForRealmInstance.has(realm), 'Realm instance has no record');

  return RealmRecForRealmInstance.get(realm);
}

function registerRealmRecForRealmInstance(realm, realmRec) {
  // Detect non-objects.
  assert(Object(realm) === realm, 'bad object, not a Realm instance');
  // Attempt to change an existing realmRec on a realm instance. Should not proceed.
  assert(
    !RealmRecForRealmInstance.has(realm),
    'Realm instance already has a record'
  );

  RealmRecForRealmInstance.set(realm, realmRec);
}

// Initialize the global variables for the new Realm.
function setDefaultBindings(safeGlobal, safeEval, safeFunction) {
  defineProperties(safeGlobal, {
    eval: {
      value: safeEval,
      writable: true,
      configurable: true
    },
    Function: {
      value: safeFunction,
      writable: true,
      configurable: true
    }
  });
}

function createRealmRec(unsafeRec, transforms, sloppyGlobals) {
  const { sharedGlobalDescs, unsafeGlobal } = unsafeRec;

  const safeGlobal = create(unsafeGlobal.Object.prototype, sharedGlobalDescs);

  const safeEvaluatorFactory = createSafeEvaluatorFactory(
    unsafeRec,
    safeGlobal,
    transforms,
    sloppyGlobals
  );
  const safeEvalOperation = safeEvaluatorFactory();
  const safeEval = createSafeEvaluator(unsafeRec, safeEvalOperation);
  const safeFunction = createFunctionEvaluator(unsafeRec, safeEvalOperation);
  const safeEvalWhichTakesEndowments = createSafeEvaluatorWhichTakesEndowments(
    safeEvaluatorFactory
  );

  setDefaultBindings(safeGlobal, safeEval, safeFunction);

  const realmRec = freeze({
    safeGlobal,
    safeEval,
    safeEvalWhichTakesEndowments,
    safeFunction
  });

  return realmRec;
}

/**
 * A root realm uses a fresh set of new intrinics. Here we first create
 * a new unsafe record, which inherits the shims. Then we proceed with
 * the creation of the realm record, and we apply the shims.
 */
function initRootRealm(parentUnsafeRec, self, options) {
  // note: 'self' is the instance of the Realm.

  // todo: investigate attacks via Array.species
  // todo: this accepts newShims='string', but it should reject that
  const {
    shims: newShims,
    transforms,
    sloppyGlobals,
    configurableGlobals
  } = options;
  const allShims = arrayConcat(parentUnsafeRec.allShims, newShims);

  // The unsafe record is created already repaired.
  const unsafeRec = createNewUnsafeRec(allShims, configurableGlobals);
  const { unsafeEval } = unsafeRec;

  const Realm = unsafeEval(buildChildRealmString)(
    unsafeRec,
    // eslint-disable-next-line no-use-before-define
    BaseRealm
  );

  // Add a Realm descriptor to sharedGlobalDescs, so it can be defined onto the
  // safeGlobal like the rest of the globals.
  unsafeRec.sharedGlobalDescs.Realm = {
    value: Realm,
    writable: true,
    configurable: true
  };

  // Creating the realmRec provides the global object, eval() and Function()
  // to the realm.
  const realmRec = createRealmRec(unsafeRec, transforms, sloppyGlobals);

  // Apply all shims in the new RootRealm. We don't do this for compartments.
  const { safeEvalWhichTakesEndowments } = realmRec;
  for (const shim of allShims) {
    safeEvalWhichTakesEndowments(shim);
  }

  // The realmRec acts as a private field on the realm instance.
  registerRealmRecForRealmInstance(self, realmRec);
}

/**
 * A compartment shares the intrinsics of its root realm. Here, only a
 * realmRec is necessary to hold the global object, eval() and Function().
 */
function initCompartment(unsafeRec, self, options = {}) {
  // note: 'self' is the instance of the Realm.

  const { transforms, sloppyGlobals } = options;
  const realmRec = createRealmRec(unsafeRec, transforms, sloppyGlobals);

  // The realmRec acts as a private field on the realm instance.
  registerRealmRecForRealmInstance(self, realmRec);
}

function getRealmGlobal(self) {
  const { safeGlobal } = getRealmRecForRealmInstance(self);
  return safeGlobal;
}

function realmEvaluate(self, x, endowments = {}, options = {}) {
  // todo: don't pass in primal-realm objects like {}, for safety. OTOH its
  // properties are copied onto the new global 'target'.
  // todo: figure out a way to membrane away the contents to safety.
  const { safeEvalWhichTakesEndowments } = getRealmRecForRealmInstance(self);
  return safeEvalWhichTakesEndowments(x, endowments, options);
}

const BaseRealm = {
  initRootRealm,
  initCompartment,
  getRealmGlobal,
  realmEvaluate
};

// Create the current unsafeRec from the current "primal" environment (the realm
// where the Realm shim is loaded and executed).
const currentUnsafeRec = createCurrentUnsafeRec();

/**
 * The "primal" realm class is defined in the current "primal" environment,
 * and is part of the shim. There is no need to facade this class via evaluation
 * because both share the same intrinsics.
 */
const Realm = buildChildRealm(currentUnsafeRec, BaseRealm);

export default Realm;
//# sourceMappingURL=realms-shim.esm.js.map
