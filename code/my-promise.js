/**
 * 自己写的一个半成品的promise
 */

 /**
 * 以上是我设计的promise
 * 目前发现的问题有 1. 不知道如何判断是否是同步 的resolve 2. queue的触发问题 3.res 的传递问题
 */
//此处传入resolve, reject
function unWrap(resolver, promise) {
  const onSuccess = function (v) { //成功回调
    setTimeout(_ => {
      promise.status = 'fulfilled'
      promise.resolve(v)
    }, 0)
  }
  const onError = function (e) { // 失败回调
    promise.status = 'rejected'
    promise.resolve(e)
  }
  promise.res = tryCatch(resolver, promise, onSuccess, onError); //用于捕获错误
}
//通过此处触发catch
function tryCatch(resolver, promise, onSuccess, onError) {
  let res = null
  try {
    res = resolver(onSuccess, onError)
  } catch (e) {
    onError(e)
  }
  return res
}

function FakePromise(resolver) {
  this.status = 'pending' //状态分成 pending fulfilled rejected
  this.res = null
  this.queue = []
  if (resolver) {
    //接下来要运行resolver
    unWrap(resolver, this); //运行resolver, 传递回调
  }
}
//此处是将回调存到上下文的队列中，上下文resolve后调用
FakePromise.prototype.then = function (resolver) {
  var p = new this.constructor() //返回一个新的promise， 因为promise状态不可逆
  this.thenable = {
    promise: p,
    cb: resolver
  }
  if (this.status !== 'pending') {
    resolver(this.res)
  } else {
    //这里写的不好，没有 捕获错误， 而且也没有判断 返回promise的情况， 并且没有考虑多次调用then的情况
    this.queue.push(k => {
      setTimeout(_ => {
        let r = resolver(k)
        if (p.queue.length) {
          p.queue.forEach(v1 => v1(r))
        }
      }, 0)
    })
  }
  return p
}
//此resolve用于通知队列
FakePromise.prototype.resolve = function (v) {
  if (this.status === 'rejected' && this.errorCb) {
    this.errorCb(v)
  } else {
    if (this.queue.length) {
      this.queue.forEach(v1 => v1(v))
    }
  }
}
//捕获方法
FakePromise.prototype.catch = function (cb) {
  this.errorCb = cb
}
//静态resolve
FakePromise.resolve = function (v) {
  var p = new this()
  p.resolve(v)
  p.status = 'fulfilled'
  return p
}

var k = FakePromise.resolve().then(_ => console.log(3))

console.log(2)