/**
 * 自己写的一个半成品的promise
 */

 /**
 * 以上是我设计的promise
 * 目前发现的问题有 1. 不知道如何判断是否是同步 的resolve 2. queue的触发问题 3.res 的传递问题
 */

 let INTERNAL = function(){}
 let handles = {}

function FakePromise(resolver) {
  this.status = 'pending' //状态分成 pending fulfilled rejected
  this.res = void 0
  this.queue = []
  if (resolver !== INTERNAL) {
    //接下来要运行resolver
    runThenable(this, resolver) //运行resolver, 传递回调
  }
}
/**
 * 1. 调用resolver
 * 2. 传递resolve, reject
 */
function runThenable(p, r){
  const onSuccess = (v) => {
    handles.resolve(p, v)
  }
  const onError = (e) => {
    handles.reject(p, e)
  }
  let res = tryCatch(r(onSuccess, onError))
  if(res.status === 'error'){
    onError(res.val)
  }
}
/**
 * 1. 捕获错误
 * 2. 封装返回值
 */
function tryCatch(func, val){
  let res = {
    status: 'success'
  }
  try{
    res.val = func(val) 
  }catch(e){
    res.val = e
    res.status = 'error'
  }
  return res
}

handles.resolve = function(promise, val){
  var res = tryCatch(getThen, val) //如果传入的是promise结构，则需要运行
  if(res.status === 'error'){
    return handles.reject(promise, res.val)
  }
  //如果是一个promise，则也要把这个promise执行，由于使用的上下文是本实例的上下文，所以在走完构造函数内方法后会刷新队列
  if(res.val){
    runThenable(promise, res.val)
  }else{
    promise.status = 'fulfilled'
    promise.res = val
    promise.queue.forEach(q => q.resolve(val))
  }
}

/**
 * 判断传入的值是否是一个promise，如then中返回一个promise这种情况
 * @param {从resolve传入的值} val 
 */
function getThen(val){
  var then = val && val.then
  if(val && (typeof val === 'object' || typeof val === 'function') && typeof then === 'function'){
    return (...rest) => {
      then.apply(val, rest)
    }
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