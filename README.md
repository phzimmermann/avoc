# Avoc 🥑
A fully function ui library that also handles state.

## Getting started
install the library via npm:

```bash
npm install avoc
```

and add the following lines to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "Avoc.createElement",
  }
}
```
This will tell the compiler to use avoc as your ui library.
Avoc works quite well with [parcel](https://parceljs.org/), parcel can already handle typescript and sets you up and running in 20 secs.

Next we need to set up the entry point (`index.tsx`):
```js
import App from "./App";
import Avoc from "avoc";

const container = document.getElementById("root");

Avoc.render(<App />, container, {});
```

And a first Avoc Component (`App.tsx`):
```js
import Avoc, { AvocComponent } from "avoc";

const App: AvocComponent = {
    render: () => (<div>Hello World</div>),
}

export default App;
```

The render function is a simple function, that has no dependency to the rest of the component.

## Component state

Every component has its own state, it can be mutated by Messages.
```tsx
import Avoc, { AvocComponent, AvocEffects } from "avoc";

type Msg = { type: "increment" } | { type: "decrement" }
type Model = { count: number }

const increment = () => AvocEffects.updateModel({ type: 'increment' });
const decrement = () => AvocEffects.updateModel({ type: 'decrement' });

const Counter: AvocComponent<Model, Msg> = {
    init: () => ({
        count: 0,
    }),
    update: (model, msg) {
        switch(msg.type) {
            case 'increment':
                return ({
                    ...model,
                    count: model.count + 1,
                });
            case 'decrement':
                return ({
                    ...model,
                    count: model.count - 1,
                });
        }
    },
    render: (model) => (
        <div>
            <button onClick={increment}>increment</button>
            <button onClick={decrement}>decrement</button>
            {model.count}
        </div>
    ),
}

export default Counter;
```

## Props
comming soon...

## Global state
comming soon...

## Avoc UI
comming soon...

## Avoc Router
comming soon... 