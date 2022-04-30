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

## Function Components
For components without state, you can simply use a function:
```tsx
import Avoc from "avoc";

const StupidComponent = () => {
    return (<div>Hello, I have no state or events</div>);
}

export default StupidComponent;
```

## Props
Props can be used to pass attributes from a parent component to a child component:
```tsx
<GreetingComponent name="Pickle Rick" />
```
Function components can just receive the props via the first params as in react:
```tsx
const GreetingComponent = ({ name }) => {
    return (<div>Hello, it's me, {name}</div>);
}
```

In statefull components its the second param of the render function:
```tsx
const GreetingComponent: AvocComponent = {
    render: (_model, { name }) => (<div>Hello, it's me, {name}</div>),
}
```

## Global state
To handle global state in your application there is an inbuilt library `AvocStore`. 

### Buckets
The global store is separated in little buckets that only hold a small part of the data. You can change this data in the buckets via reducers. Reducers are listening to Actions that you can send with the AvocStore effect.

### Setup
You have to initialize it with the `create` function. Here we set up a bucket that is called fruits and one that is called legumes. The reducers will change the buckets as soon as they get called.
```tsx
import { AvocStore } from 'avoc';

const avocStore = AvocStore.create(
    // initial state
    {
        fruits: ['banana', 'apple', 'orange'],
        legumes: [],
    },
    // reducers
    {
        fruits: {
            'add': (state, payload) => [...state, payload],
            'noop': (state) => state,
            'remove': (state, payload) => state.filter(i => i !== payload),
        },
        legumes: {
            'add': (state, payload) => [...state, payload],
        }
    });
})
Avoc.render(<App />, container, { avocStore })
```
### Usage
The effects can be used to dispatch anything in your store.
```tsx
const addBanana = () => AvocStore.update('fruits', 'add', 'banana');
```
Such an effect can be directly run on any dom event:
```tsx
<button onClick={addBanana}>Add Banana</button>
```

## Effects
You have already learned about several effects like the `Avoc.updateModel` and the `AvocStore.update`. There are several more and you can combine them as well
### Component model
```tsx
Avoc.updateModel<Msg>({ type: 'increment', value: 3 });
```
insert documentation here
```tsx
Avoc.getModel<Mdl>(): Mdl;
```
insert documentation here

### Avoc Store 
```tsx
AvocStore.update(bucket: BucketKey, actionType: BucketActionType, payload: any): void;
```
insert documentation here
```tsx
AvocStore.read(bucket: BucketKey): BucketValue;
```
insert documentation here

### Composition
```tsx
import { _do } from "avoc/systemIO";

const readAndUpdate = _do(function* (value: number) {
    const model = yield Avoc.getModel();
    if (model.count < 1) {
        yield Avoc.updateModel({ type: 'increment', value, });
    }
});
```

## Avoc UI
comming soon...

## Avoc Router
comming soon... 