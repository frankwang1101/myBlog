// 原理是每次取最小权重的节点进行比较和更新

/**
 * {
 *    key: cost
 * }
 */
const costs = {}
/**
 * {
 *    key: key
 * }
 */
const parent = {}
/**
 * {
 *    key: {
 *       key: {
 *       }
 *    }
 * }
 */
const neighbor = {}
/**
 * [key, ...]
 */
const process = []

const getLowestCost = key => {
  let his = Infinity
  let res = null
  for (let k in Object.keys(costs)) {
    if (costs[k] < his && !~process.indexOf(k)) {
      res = k
    }
  }
  return res
}

const update = (costs) => {
  let low = getLowestCost(costs)
  while (low) {
    let neighborMap = neighbor[low]
    let cost_new = costs[low]
    for (let k in Object.keys(neighborMap)) { // 如果直接到该点的权重比经过上一节点的权重大，则更新权重
      if(costs[k] > cost_new + neighborMap[k]){
        costs[k] = cost_new + neighborMap[k]
        parent[k] = low // 同时把该点的父节点设为上一节点 ， 用于记录最佳路径
      }
    }
    low = getLowestCost(costs)
  }
}