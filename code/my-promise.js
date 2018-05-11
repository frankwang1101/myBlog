/**
 * 自己写的一个半成品的promise
 */

/**
 * 以上是我设计的promise
 */

let INTERNAL = function () {}
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
function runThenable(p, r) {
  const onSuccess = (v) => {
    handles.resolve(p, v)
  }
  const onError = (e) => {
    handles.reject(p, e)
  }
  let res = tryCatch(_ => r(onSuccess, onError))
  if (res.status === 'error') {
    onError(res.val)
  }
}
/**
 * 1. 捕获错误
 * 2. 封装返回值
 */
function tryCatch(func, val) {
  let res = {
    status: 'success'
  }
  try {
    res.val = func(val)
  } catch (e) {
    res.val = e
    res.status = 'error'
  }
  return res
}

handles.resolve = function (promise, val) {
  var res = tryCatch(getThen, val) //如果传入的是promise结构，则需要运行
  if (res.status === 'error') {
    return handles.reject(promise, res.val)
  }
  //如果是一个promise，则也要把这个promise执行，由于使用的上下文是本实例的上下文，所以在走完构造函数内方法后会刷新队列
  if (res.val) {
    runThenable(promise, res.val)
  } else {
    promise.status = 'fulfilled'
    promise.res = val
    promise.queue.forEach(q => q.resolve(val))
  }
}

//错误的肯定参数是Error，则只需要刷新队列即可，在catch中再次判断成功或失败
handles.reject = function(promise, err){
  promise.queue.forEach(q => q.reject(err))
}

/**
 * 判断传入的值是否是一个promise，如then中返回一个promise这种情况
 * @param {从resolve传入的值} val 
 */
function getThen(val) {
  var then = val && val.then
  if (val && (typeof val === 'object' || typeof val === 'function') && typeof then === 'function') {
    return (...rest) => {
      then.apply(val, rest)
    }
  }
}

class QueueItem {
  constructor(pm, resolver, reject) {
    this.pm = pm
    this.resolver = resolver
    this.reject = reject
  }
  resolve(v) {
    unwrap(this.pm, this.resolver, v)
  }
  reject(v){
    unwrap(this.pm, this.reject, v)
  }
}

function unwrap(pm, r, v){
  setTimeout(_ => 
    {
      let rs;
      try{

        rs = r(v)
      }catch(e){
        return handles.reject(e)
      }
      handles.resolve(pm, rs)
    }
    ,0)
}

//此处是将回调存到上下文的队列中，上下文resolve后调用
FakePromise.prototype.then = function (resolver, reject) {
  var p = new this.constructor() //返回一个新的promise， 因为promise状态不可逆
  this.thenable = {
    promise: p,
    cb: resolver
  }
  if (this.status !== 'pending') {
    unwrap(this, this.status === 'fulfilled'?resolver:reject, this.res)
  } else {
    this.queue.push(new QueueItem(this, resolver, reject))
  }
  return p
}
//捕获方法
FakePromise.prototype.catch = function (cb) {
  return this.then(null, cb)
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


/**
 * 分析流程
 * 1. 构造函数情况下 -> 解析构造函数的resolver， 传入两个resolve, reject -> resolve执行
 * -> 如果是 r , 判断传入的是否是 promise， 是则 执行其构造函数的then函数(步骤童同第二步)， 否则 刷新 then的回调队列 -> 此时如果正常走完一个cb，则利用unwrap 处理 catch ，没有catch(即加入Q的时候只有成功的会掉)，则终结 -> 否则刷新then的队列，如果有获取到catch则使用catch，否则停止剩余操作
 * 原因是没有下一个unwrap
 * 链式衔接的关键点在于先存cb 后 异步调用， 每一个实例保存下一个then的cb，
 * finally的原理是利用then，同时捕获两种状态，然后利用实例的构造函数分发出去，同事因为手动操作回调，相当于了共享了传递的值
 * Promise.all 的原理是 返回的是一个 promise实例，然后在方法中遍历所有promise， 利用Promise.resolve(promise) === promise的特性 (考虑到数组不一定全是promise，所以不直接then) 
 * 获取回调，当所有的回调执行完毕后，调用handle.resolve将结果传递给最初新建的promise，让其then出去，因此生成了 all
 * race异曲同工，区别在于只要有一个cb了，立刻flag变为true， 调用handler.resolve
 */