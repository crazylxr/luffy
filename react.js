import { ELEMENT_TEXT } from "./constants";

const React = {
  createElement,
};

function createElement(type, config, ...children) {
  return {
    type,
    props: {
      ...config,
      children: children.map((child) => {
        if (typeof child === "object") {
          return child;
        } else {
          return {
            type: ELEMENT_TEXT,
            props: {
              text: child,
              children: [],
            },
          };
        }
      }),
    },
  };
}

export default React;
