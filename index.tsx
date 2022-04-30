import App from "./App";
import Avoc from "./Avoc2";
import { create } from "./AvocStore";


const avocStore = create({
  fruits: ['banana', 'apple', 'orange'],
  cars: [],
}, {
  fruits: {
    'add': (state, payload) => [...state, payload],
    'noop': (state) => state,
  },
  cars: {
    'add': (state, payload) => [...state, payload],
  }
});

console.log(avocStore.getState('fruits'));

const listener = fruits => console.log('updated fruits', fruits)
avocStore.register('fruits', listener);

const carListener = cars => console.log('cars updated', cars);
avocStore.register('cars', carListener);

avocStore.update('fruits', 'add', 'pineapple');

// avocStore.unRegister('fruits', listener);

avocStore.update('fruits', 'add', 'strawberry')

console.log(avocStore.getState('fruits'));

const element = <App />
const container = document.getElementById("root")
const system = {
  avocStore,
  effects: {
    avocStoreUpdate: avocStore.update,
    avocStoreRead: avocStore.getState,
  }
}
Avoc.render(element, container, system)
