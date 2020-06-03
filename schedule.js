import { HostComponent, HostRoot, HostText, ELEMENT_TEXT, Placement} from './constants'
import { createDOM } from './dom'

let nextUnitOfWork; // 下一个执行单元
let workInProgressRoot;

export function scheduleRoot(rootFiber) {
    nextUnitOfWork = rootFiber
    workInProgressRoot = rootFiber
}

function commitRoot() {
    let currentFiber = workInProgressRoot.firstEffect
    while(currentFiber) {
        commitWork(currentFiber)
        currentFiber = currentFiber.nextEffect
    }

    workInProgressRoot = null
}

function commitWork(currentFiber) {
    if(!currentFiber) {
        return;
    }

    let returnFiber = currentFiber.return;
    const domReturn = returnFiber.stateNode;

    if(currentFiber.effectTag === Placement && currentFiber.stateNode != null) {
        domReturn.append(currentFiber.stateNode)
    }

    currentFiber.effectTag = null
}

// deadline 是还有多少的空闲时间
function workLoop(deadline) {
    let shouldYield = false;

    while(nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitWork(nextUnitOfWork)
        // 回调函数入参 deadline 可以告诉我们在这个渲染周期还剩多少时间可用
        // 剩余时间小于1毫秒就被打断，等待浏览器再次空闲
        shouldYield = deadline.timeRemaining() < 1;
    }

    if(!nextUnitOfWork) {
        commitRoot()
    }

    // requestIdleCallback(workLoop);
}

function performUnitWork(currentFiber) {
    // 把子元素变成子 fiber
    beginWork(currentFiber)

    // 如果有子节点就返回以第一个子节点
    if(currentFiber.child) {
        return currentFiber.child
    }

    while (currentFiber) {
      // 没有子节点就代表当前节点已经完成了调和工作，
      // 就可以结束 fiber 的调和，进入收集副作用的步骤(completeUnitOfWork)
      completeUnitOfWork(currentFiber);
      if (currentFiber.sibling) {
        return currentFiber.sibling;
      }

      currentFiber = currentFiber.return;
    }
}

function completeUnitOfWork(currentFiber) {
  const returnFiber = currentFiber.return;
  if (returnFiber) {
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect;
    }
    if (!!currentFiber.lastEffect) {
      if (!!returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
      }
      returnFiber.lastEffect = currentFiber.lastEffect;
    }

    const effectTag = currentFiber.effectTag;
    if (effectTag) {
      if (!!returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber;
      } else {
        returnFiber.firstEffect = currentFiber;
      }
      returnFiber.lastEffect = currentFiber;
    }
  }
}

function beginWork(currentFiber) {
    if (currentFiber.tag === HostRoot) {
      updateHostRoot(currentFiber);
    } else if (currentFiber.tag === HostText) {
        updateHostText(currentFiber)
    } else if(currentFiber.tag === HostComponent) {
        updateHostComponent(currentFiber);
    }
}

function updateHostRoot(currentFiber) {
    const children = currentFiber.props.children
    reconcileChildren(currentFiber, children)
    console.log('currentFiber:', currentFiber);
}

function updateHostText(currentFiber) {
    if (!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber);//先创建真实的DOM节点
    }
}

function updateHostComponent(currentFiber) {
    // 由于 fiber 里面是有 elementType 的，
    // 所以是可以根据elementType 来创建 dom 节点的，
    // 那么 stateNode 就可以先创建 
    if(!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber)
    }

    const children = currentFiber.pendingProps.children
    reconcileChildren(currentFiber, children)
}


function reconcileChildren(currentFiber, newChildren) {
    let newChildIndex = 0; // 新虚拟 DOM 数组索引
    let prevSibling; // 上一个兄弟节点

    // 循环虚拟DOM数组
    while(newChildIndex < newChildren.length) {
        let newChild = newChildren[newChildIndex]

        // 要根据不同的虚拟 DOM 类型，给到不同的 WorkTag
        let tag
        if(newChild.type === ELEMENT_TEXT) {
            tag = HostText
        } else if(typeof newChild.type === 'string') {
            tag = HostComponent
        }

        let newFiber = {
            tag,
            elementType: newChild.type,
            stateNode: null,
            return: currentFiber,
            pendingProps: newChild.props,
            effectTag: Placement, // 首次渲染，一定是增加，所以是 Placement
        }

        if (newFiber) {
          // 第一个会被当做父 fiber 的 child，其他的作为 child 的 sibling
          if (newChildIndex === 0) {
            currentFiber.child = newFiber;
          } else {
            prevSibling.sibling = newFiber;
          }
        }

        prevSibling = newFiber;
        newChildIndex++
    }
}


requestIdleCallback(workLoop)
