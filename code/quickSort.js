/**
 * js快排尝试
 * 原理是采用分治法，选一个基准点，根据基准点交换两边的数
 */

 function part(arr, left, right){
    let pivot = arr[Math.floor((left + right) / 2)]
    let i = left 
    let j = right
    while(i <= j){
        if(arr[i] < pivot){
            i++
        }
        if(arr[j] > pivot){
            j--
        }
        if(i<=j){
            [arr[i],arr[j]] = [arr[j], arr[i]]            
            i++
            j--
        }
    }
    return i
 }

function quickSort(arr, left, right){
    if(arr.length > 1){
        let i = part(arr,left, right)
        if(left < i -1){
            quickSort(arr,left, i - 1)
        }
        if(i < right){
            quickSort(arr, i, right)
        }
    }
    return arr
}
let arr = [3,4,5,1]
 console.log(quickSort(arr, 0, 3),arr)