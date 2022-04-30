import { AvocElement } from "./AvocTypes";
import SystemIO from "./SystemIO";

function createElement<P, Mdl, Msg>(
  type: AvocElement<P, Mdl, Msg>,
  props,
  ...children
) {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat()
        .map((child) =>
          typeof child === "object" ? child : createTextElement(child)
        ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

interface AvocNode {
  type: any;
  children: AvocNode[];
  add: (parentDom, next?) => void;
  delete: (domParent: any) => void;
  updateProps: (props) => void;
  getLastDom: () => any;
}

class AvocNodeNone implements AvocNode {
  type: null;
  dom;
  children: [];
  add(parentDom: any) {
    this.dom = parentDom;
  }
  delete() {}
  updateProps() {}
  getLastDom() {}
}

class AvocNodeText implements AvocNode {
  public type = "TEXT_ELEMENT";
  text;
  dom;
  constructor(text) {
    this.text = text;
  }
  add(parentDom, next) {
    this.dom = document.createTextNode("");
    if (next) {
      parentDom.insertBefore(this.dom, next);
    } else {
      parentDom.appendChild(this.dom);
    }
    this.updateDom();
  }
  updateDom() {
    this.dom.nodeValue = this.text;
  }
  delete(domParent) {
    domParent.removeChild(this.dom);
  }
  updateProps(props: any) {
    if (this.text !== props.nodeValue) {
      this.dom.nodeValue = props.nodeValue;
      this.text = props.nodeValue;
    }
  }
  getLastDom() {
    return this.dom;
  }
}

class AvocNodeHTML implements AvocNode {
  children: AvocNode[] = [];
  dom;
  props;
  oldProps = {};
  type;
  system;
  constructor(type, props, system) {
    this.type = type;
    this.props = props;
    this.system = system;
    this.children = createChildren(props.children, system);
  }
  add(parentDom, next) {
    this.dom = document.createElement(this.type);
    if (next) {
      parentDom.insertBefore(this.dom, next);
    } else {
      parentDom.appendChild(this.dom);
    }
    this.children.forEach((child) => child.add(this.dom));
    this.updateDom();
  }
  updateDom() {
    updateDom(this.dom, this.oldProps, this.props, this.system);
  }
  delete(domParent) {
    domParent.removeChild(this.dom);
  }
  updateProps(props: any) {
    updateDom(this.dom, this.props, props, this.system);
    this.children = updateChildren(this, props.children, this.system);
    this.props = props;
  }
  getLastDom() {
    return this.dom;
  }
}

class AvocNodeFunction implements AvocNode {
  children: AvocNode[] = [];
  dom;
  props;
  type;
  system;
  constructor(type, props, system) {
    this.type = type;
    this.props = props;
    this.system = system;
    const result = type(props);
    this.children = createChildren(result, system);
  }
  add(parentDom, next) {
    this.dom = parentDom;
    this.children.forEach((child) => child.add(parentDom, next));
  }
  delete(domParent) {
    this.children.forEach((child) => child.delete(domParent));
  }
  updateProps(props: any) {
    const result = this.type(props);
    this.children = updateChildren(this, result, this.system);
    console.log(result);
    this.props = props;
  }
  getLastDom() {
    return this.dom;
  }
}

class AvocNodeElement implements AvocNode {
  type: AvocElement<unknown, unknown>;
  props = {};
  public children: AvocNode[] = [];
  model;
  dom;
  selectors: null;
  system;
  rendered;
  constructor(type: AvocElement<unknown, unknown>, props, system) {
    this.type = type;
    this.props = props;
    this.system = {
      ...system,
      effects: {
        ...system.effects,
        updateModel: (msg) => this.updateWithMessage(msg),
        getModel: () => this.model,
      },
    };
    const { model, cmd } = this.type.init?.() || {};
    this.model = model;
    this.registerSelectors();
    const result = this.type.render(this.model, props);
    const appliedSys = this.applySystemIoToChildren([], result);
    this.children = createChildren(appliedSys, this.system);
    this.rendered = appliedSys;
    this.model = model;
  }
  add(parentDom, next) {
    this.dom = parentDom;
    this.children.forEach((child) => child.add(parentDom, next));
    this.runSystemIO(this.type.events?.mount?.());
  }
  updateWithMessage(msg) {
    // add possibility to run effects directly
    if (typeof msg === "object" && msg.isSystemIO) {
      this.runSystemIO(msg);
      return;
    }

    const update = this.type.update;
    if (!update) {
      return;
    }
    const { model, cmd } = this.type.update(this.model, msg);
    if (model !== this.model) {
      console.log("the model changed");
      const result = this.type.render(model, this.props);
      const appliedSys = this.applySystemIoToChildren(this.rendered, result);
      this.children = updateChildren(this, appliedSys, this.system);
      this.model = model;
      this.rendered = appliedSys;
    }
    // highly experimental
    this.runSystemIO(cmd);
  }
  applySystemIoToChildren(oldProps, newProps) {
    return (Array.isArray(newProps) ? newProps : [newProps]).map(
      (child, index) =>
        !!child
          ? {
              ...child,
              props: Object.keys(child.props).reduce((curr, key) => {
                if (isEvent(key)) {
                  if (
                    oldProps[index]?.props?.[key]?.base === child.props[key]
                  ) {
                    return { ...curr, [key]: oldProps[index]?.props?.[key] };
                  }
                  const wrapper = (...args) => {
                    const res = child.props[key](...args);
                    if (res?.isSystemIO) {
                      return this.runSystemIO(res);
                    }
                    return res;
                  };
                  wrapper.base = child.props[key];
                  return { ...curr, [key]: wrapper };
                }
                if (key === "children" && !!child.props.children) {
                  return {
                    ...curr,
                    [key]: this.applySystemIoToChildren(
                      oldProps[index]?.props?.children || [],
                      child.props.children
                    ),
                  };
                }
                return { ...curr, [key]: child.props[key] };
              }, {}),
            }
          : child
    );
  }
  runSystemIO(cmd?: SystemIO<unknown>) {
    if (!cmd) {
      return;
    }
    cmd.eval(this.system.effects);
  }
  updateProps(props: any) {
    const arePropsSame = shallowEqual(this.props, props);
    if (arePropsSame) {
      return;
    }
    // this.updateWithMessage({ type: "propsReceived", value: props });
    this.runSystemIO(this.type.events?.receiveProps(props, this.props));
    const result = this.type.render(this.model, props);
    const appliedSys = this.applySystemIoToChildren(this.rendered, result);
    this.children = updateChildren(this, appliedSys, this.system);
    this.props = props;
    this.rendered = appliedSys;
  }
  delete(domParent) {
    this.removeListeners();
    this.children.forEach((child) => child.delete(domParent));
  }
  getLastDom() {
    let dom = null;
    this.children.forEach((child) => {
      const childDom = child.getLastDom();
      if (childDom) {
        dom = childDom;
      }
    });
    return dom;
  }
  registerSelectors() {
    if (!this.type.selectors) {
      return;
    }
    this.selectors = this.type.selectors.map((selector) => {
      const createListener = () => {
        let data = selector.selector(
          this.system.avocStore.getState(selector.bucket)
        );
        if (typeof data !== "undefined") {
          const { model } = this.type.update(this.model, {
            type: selector.msg,
            value: data,
          });
          this.model = model;
        }
        const listener = (state) => {
          const newData = selector.selector(state);
          if (newData === data) {
            return;
          }
          data = newData;
          this.updateWithMessage({ type: selector.msg, value: newData });
        };
        this.system.avocStore.register(selector.bucket, listener);
        return { bucket: selector.bucket, listener };
      };

      return createListener();
    });
  }
  removeListeners() {
    if (!this.selectors) {
      return;
    }
    this.selectors.forEach((listener) => {
      this.system.avocStore.unRegister(listener.bucket, listener);
    });
  }
}

const shallowEqual = (oldProps = {}, newProps = {}) =>
  Object.keys(oldProps).every((key) => oldProps[key] === newProps[key]) &&
  Object.keys(newProps).every((key) => oldProps[key] === newProps[key]);

const updateChildren = (parent: AvocNode, children, system): AvocNode[] => {
  const arrayChildren = Array.isArray(children) ? children : [children];

  let lastDom = null;
  const updateLastDom = (dom) => {
    if (dom) {
      lastDom = dom;
    }
  };
  const children2 = arrayChildren.map((child, index) => {
    const oldElement: AvocNode | undefined = parent.children[index];
    const isSameType = oldElement?.type === child?.type;

    // update
    if (isSameType) {
      oldElement.updateProps(child?.props);
      updateLastDom(oldElement.getLastDom());
      return oldElement;
    }

    // replace
    if (!isSameType && !!oldElement) {
      const newChild = createChild(child, system);
      newChild.add(parent.dom, lastDom?.nextSibling || null);
      oldElement.delete(parent.dom);
      updateLastDom(newChild.getLastDom());
      return newChild;
    }

    // add
    if (!isSameType) {
      const newChild = createChild(child, system);
      newChild.add(parent.dom, lastDom?.nextSibling || null);
      updateLastDom(newChild.getLastDom());
      return newChild;
    }

    return parent.children[index];
  });

  parent.children.forEach((child, index) => {
    if (index >= arrayChildren.length) {
      child.delete(parent.dom);
    }
  });

  return children2;
};

const createChild = (child, system) => {
  if (typeof child === "undefined") {
    return undefined;
  }
  if (child === null || child === false) {
    return new AvocNodeNone();
  }
  if (typeof child.type === "function") {
    return new AvocNodeFunction(child.type, child.props, system);
  }
  if (child.type === "TEXT_ELEMENT") {
    return new AvocNodeText(child.props.nodeValue);
  }
  if (typeof child.type === "object") {
    return new AvocNodeElement(child.type, child.props, system);
  }
  return new AvocNodeHTML(child.type, child.props, system);
};

const createChildren = (children, system) =>
  (Array.isArray(children) ? children : [children]).map((child) =>
    createChild(child, system)
  );

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

function updateDom(dom, prevProps, nextProps, system) {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      if (name === "style") {
        // update style
        transformDomStyle(dom, nextProps.style);
      } else if (name === "className") {
        // update className
        prevProps.className &&
          dom.classList.remove(...prevProps.className.split(/\s+/));
        dom.classList.add(...nextProps.className.split(/\s+/));
      } else {
        dom[name] = nextProps[name];
      }
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      // TODO: there is a problem here, sub components will run the effects if its a Avoc Component
      // nextProps[name + "Wrapper"] = createWrapper(
      //   system.effects,
      //   nextProps[name]
      // );
      dom.addEventListener(eventType, nextProps[name]);
    });
}

const reg = /[A-Z]/g;
function transformDomStyle(dom, style) {
  dom.style = Object.keys(style).reduce((acc, styleName) => {
    const key = styleName.replace(reg, function (v) {
      return "-" + v.toLowerCase();
    });
    acc += `${key}: ${style[styleName]};`;
    return acc;
  }, "");
}

const createWrapper =
  (effects, fn) =>
  (...args) => {
    const result = fn(...args);
    if (!!result && result.isSystemIO) {
      console.log(result);
      return result.eval(effects);
    }
    return result;
  };

const render = (element, container, system) => {
  const node = new AvocNodeElement(element.type, element.props, system);
  node.add(container);
  console.log(node);
};

const Avoc = {
  createElement,
  render,
};

export default Avoc;
