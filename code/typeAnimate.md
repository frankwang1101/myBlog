### css实现打字动画效果

最近公司h5需要实现一个打字效果，想起来在css secret中看到过相应内容，于是复习了一下，写了一个小demo来记录使用过程

动画如下
![type_loop](https://github.com/frankwang1101/myBlog/blob/master/code/typed_loop.gif)

### 原理

使用到了css3的动画函数steps，根据字数将动画分成对应帧数，然后给一个width 0 - 100%效果， 目的达成, 代码如下

```
// html
.contain
p
button#start 启动
```
```
// css
.contain {
  padding: 20px;
  width: 300px;
  //背景框
  background-image: 
    linear-gradient(to right, #58a 20%, #fff 20%, #fff 80%, #58a 80),
    linear-gradient(to right, #58a 20%, #fff 20%, #fff 80%, #58a 80%),
    linear-gradient(to top, #58a 20%, #fff 20%, #fff 80%, #58a 80%),
    linear-gradient(to bottom, #58a 20%, #fff 20%, #fff 80%, #58a 80%;
  background-position: top, bottom, left, right;
  background-size: 100% 2px, 100% 2px, 2px 100%, 2px 100%;
  background-repeat: no-repeat;
  text-align: center;
}

.line {
  text-align: center;
  position: relative;
  font-size: 14px;
  .placeholder {
    display: inline-block;
    color: transparent;
  }
  .lyr {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    position: absolute;
    visibility: hidden;
  }
  &.visible .lyr {
    visibility: visible;
  }
  &.next-visible + .line .lyr {
    visibility: visible;
  }
}

@keyframes typed {
  from {
    width: 0;
    visibility: hidden;
  }
}

```

```
const get = _ => document.querySelector(_)
const getAll = _ => document.querySelectorAll(_)
const bind = (_, type, cb) => _.addEventListener(type, cb)
const sub = arr => arr.reduce((pre, next) => pre + next)
const contain = get('.contain')

let wordList = [
  '为何你不懂，只要有爱就会有痛',
  '有一天你会知道',
  '人生没有我并不会不同'
]

const render = _ => {
  contain.innerHTML = wordList.map(w => `<div class="line"><div class="lyr">${w}</div><div class="placeholder">${w}</div></div>`).join('')
}
const start = get('#start')

bind(start, 'click', ev => {
  lenList = wordList.map(v => v.length)
  render()
  const lineList = getAll('.line')
  lineList.forEach((line, i) => {
    if(i === 0){
      line.classList.add('visible') 
    }
    const lyr = line.querySelector('.lyr');
    const len = lyr.innerHTML.length;
    //计算每一行动画时间和延时
    lyr.style.width = `${len * 14}px`;
    lyr.style.animation = `typed ${2 * len / 14}s ${i === 0?0:(2 * sub(lenList.slice(0, i)) / 14)}s steps(${len}) forwards`; 
    //监听完成动画完成事件
    bind(lyr, 'animationend', _ => {
      line.classList.add('next-visible')
    })
  })
})

```

### 实践心得
1. 首先使用到了两个字幕，原因是字幕宽度改变时，如果是居中对齐，字幕的移动不可避免，于是，将动画字幕设置成绝对定位，然后给一个对应宽度的透明字幕占位
2. 其次如果需要每一行按顺序出现，需要给一个对应的延时
3. 一开始所有行隐藏，监听每一行的动画完成事件，当动画完成后再显示下一行
4. 背景框是用四个渐变做的

