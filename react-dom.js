import { HostRoot } from './constants'
import { scheduleRoot } from "./schedule";

function render(element, container) {
    let rootFiber = {
        tag: HostRoot,
        stateNode: container,
        props: { children: [element] }
    }

    scheduleRoot(rootFiber)

    return rootFiber
}

export default { render }