### 背景
最近在知乎上大家都在讨论阮一峰老师的快拍算法的缺陷，因此我决定去学习一下大家公认的3while快排， 学完后觉得用console.log的形式比较各种算法不够直白，决定写一段将排序过程可视化的js代码

### 效果

效果如下图
![sort](https://github.com/frankwang1101/myBlog/blob/master/code/sortAnimation.gif)
### 代码

原理是，在交换的同时将交换轨迹放置在一个队列中，在交换完成后触发队列
```
const start = _ => {
  if(queue.length){
    let t = queue.shift();
    let left = this.arr.find(v => v.index === t[0]);
    let right = this.arr.find(v => v.index === t[1]);
    //交换transform 和 index
    let tempT = left.dom.style.transform
    left.dom.style.transform = right.dom.style.transform
    right.dom.style.transform = tempT
    let tempI = left.index
    left.index = right.index
    right.index = tempI
    //600ms后继续触发
    setTimeout(_ => {
      start()
    }, 600)
  }
}
start()
```

具体代码路径在此: [sortAnimation.html](https://github.com/frankwang1101/myBlog/blob/master/code/sortAnimation.html)
