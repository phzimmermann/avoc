import Avoc from "../Avoc";

type Theme<E> = {
  elements: E;
};

export const createElements = <E>(theme: Theme<E>) => {
  return Object.keys(theme.elements).reduce((curr, next) => {
    return { ...curr, [next]: createElement(theme.elements[next]) };
  }, {});
};

const createElement = (blueprint) => {
    
  return ({ children, ...props }) =>console.log(className: propToClasses(props).join(" ")) ||
    Avoc.co(blueprint.as, { ...removeUiProps(props) }, children);
};

const propMap = {
  p: ["padding-top", "padding-bottom", "padding-left", "padding-right"],
};

const propMap2 = {
  p: ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"],
};

const propToClasses = (props) => {
  return Object.keys(props).reduce((curr, next) => {
    if (next in propMap) {
      return [
        ...curr,
        ...propMap[next].map((className) => className + props[next]),
      ];
    }
    return curr;
  }, []);
};

const removeUiProps = (props) => {
  console.log(props);
  return Object.keys(props).reduce((curr, next) => {
    if (next in propMap) {
      return curr;
    }
    return { ...curr, [next]: props[next] };
  }, {});
};
