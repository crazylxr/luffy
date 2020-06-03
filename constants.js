// constants.js
export const ELEMENT_TEXT = Symbol.for("ELEMENT_TEXT");

// WorkTag
export const HostRoot = 3; // 根节点
export const HostComponent = 5; // 一般的 host 节点
export const HostText = 6; // 文本节点

// SideEffectTag
export const Placement = 0b00000000010;