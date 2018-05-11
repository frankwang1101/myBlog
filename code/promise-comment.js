/**
 * 这是一个promise库 lie， 给lie加注释以学习promise
 */

'use strict';
var immediate = _ =>setTimeout(_, 0)

/* istanbul ignore next */
function INTERNAL() {} //一个空函数，用于判断是否是then中的promise  

var handlers = {};

var REJECTED = ['REJECTED'];
var FULFILLED = ['FULFILLED'];
var PENDING = ['PENDING'];
/* istanbul ignore else */
if (!process.browser) {
  // in which we actually take advantage of JS scoping
  var UNHANDLED = ['UNHANDLED'];
}

module.exports = Promise;
//构造函数，参数为 (resolve, reject) => {} 的形式
function Promise(resolver) {
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = PENDING; //状态. 为何不用 string？
  this.queue = []; //then的回调队列
  this.outcome = void 0; //结果， 默认undefined
  /* istanbul ignore else */
  if (!process.browser) {
    this.handled = UNHANDLED;
  }
  if (resolver !== INTERNAL) { //判断一下，如果不是空函数，则执行resolver
    safelyResolveThenable(this, resolver);//处理resolver，主要是包括 错误捕获和状态判断，传递回调参数
  }
}

//finally, 跟done不同，会返回promise，因此扔需要使其同时捕获 resolve和 reject，
Promise.prototype.finally = function (callback) {
  if (typeof callback !== 'function') {
    return this;
  }
  var p = this.constructor;
  
  return this.then(resolve, reject);

  function resolve(value) {
    function yes () {
      return value;
    }
    return p.resolve(callback()).then(yes);//首先调用callback, 然后在then中传递结果函数, 与then(a, b)不同，这个继续then 可以获取 val 或者 reason
  }
  function reject(reason) {
    function no () {
      throw reason;
    }
    return p.resolve(callback()).then(no);
  }
};
//catch即then只传递reject参的形式
Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};
//then是同步的，因此我们需要先建立promise，然后再将回调放到队列中
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
    typeof onRejected !== 'function' && this.state === REJECTED) {
    return this;
  }
  var promise = new this.constructor(INTERNAL);
  /* istanbul ignore else */
  if (!process.browser) {
    if (this.handled === UNHANDLED) {
      this.handled = null;
    }
  }
  //判断一下当前上下文的状态，如果非pending态(如Promise.resolve, resolver内同步resolve等),此时直接异步调用(使用unwrap)resolver参数， 否则加入上下文的队列中
  if (this.state !== PENDING) {
    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
    unwrap(promise, resolver, this.outcome); //此处是 resolve Promise.resolve异步 的原因， then中的 resolver是以unwrap的形式异步调用的
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};
//这里这个unwrap，用于将队列放到异步中
function unwrap(promise, func, value) {
  console.log('unwrap', func)
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}
//重头戏，用于运行回调或刷新队列， 通过判断传入的value是否是promise来判断是否直接刷新队列
handlers.resolve = function (self, value) {
  var result = tryCatch(getThen, value); //使用getThen去解析value， 即 geThen(value)
  if (result.status === 'error') { //判断是否报错，报错则reject
    return handlers.reject(self, result.value);
  }
  var thenable = result.value; //getThen中返回的只有 promise 和 空两种可能，如果是空则把队列执行完 即顺序是 先链式 后 同步的调用 then

  if (thenable) { //有值，代表需要继续链式调用
    safelyResolveThenable(self, thenable);
  } else { //否则刷新剩余的队列
    self.state = FULFILLED;
    self.outcome = value; //将结果放到outcome中，使then的回调中可以获取到结果作为形参
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value); //调用queueItem对象的方法， 本质上就是调用 resolve方法
    }
  }
  return self;
};
//失败回调
handlers.reject = function (self, error) {
  self.state = REJECTED;
  self.outcome = error;
  /* istanbul ignore else */
  if (!process.browser) {
    if (self.handled === UNHANDLED) {
      immediate(function () {
        if (self.handled === UNHANDLED) {
          process.emit('unhandledRejection', error, self);
        }
      });
    }
  }
  var i = -1;
  var len = self.queue.length;
  while (++i < len) { //刷新catch队列
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then; //如果value是一个 promise 返回， 否则返回 void 0
  if (obj && (typeof obj === 'object' || typeof obj === 'function') && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}
//唤起回调， 包括传递 resolve reject 参数和 捕获错误
function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false; //确保只调用一次
  //reject参， 失败将会触发失败方法
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }
  //resolve参
  function onSuccess(value) {
    if (called) {
      return;
    }
    handlers.resolve(self, value);
    called = true;
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }

  var result = tryCatch(tryToUnwrap); //捕获错误，封装方法
  if (result.status === 'error') { //如果是错误，抛出错误
    onError(result.value);
  }
}

function tryCatch(func, value) {
  //此处将结果封装成了 value 和 status 的形式，用于区分 出错和正常情况
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}

Promise.resolve = resolve;
function resolve(value) { //resolve方法，相当使用一个空的promise触发handlers.resolve方法
  if (value instanceof this) {
    return value;
  }
  return handlers.resolve(new this(INTERNAL), value);
}

Promise.reject = reject;
function reject(reason) {
  var promise = new this(INTERNAL);
  return handlers.reject(promise, reason);
}

Promise.all = all;
function all(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    self.resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len && !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}

Promise.race = race;
function race(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    self.resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}
