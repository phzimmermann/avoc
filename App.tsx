import Avoc from "./Avoc2";

import { AvocElement } from "./AvocTypes";
import { AvocEffects, AvocStoreEffects } from "./Effects";
import { _do } from "./SystemIO";


declare global {
    namespace JSX {
        function createElement<P>(type: AvocElement<unknown, unknown>, props: P);
        // intrinsic elements
        // function createElement<K extends keyof JSX.IntrinsicElements>(tag: K, props: JSX.IntrinsicElements[K], children: JSX.Element[]): JSX.Element;
        // functional components
        //function createElement<P>(type: ((props: P) => JSX.Element), props: P, children: JSX.Element[]): JSX.Element;
    }
}

type Model = {
    count: number;
}

type Message = { type: 'increment' } | { type: 'decrement' };

const Fruit: AvocElement<Model, Message> = {
    init: () => ({
        model: {
            count: 0,
        }
    }),
    update: (model, msg) => {
        switch (msg.type) {
            case 'increment':
                return {
                    model: {
                        count: model.count + 1,
                    }
                }
            case 'decrement':
                return {
                    model: {
                        count: model.count - 1,
                    }
                }
            default:
                return { model };
        }
    },
    render: (model) => {
        return (
            <div>fruit {model.count}</div>
        )
    },
}

let counter = 1;


type BananaMsg = { type: 'addBanana' } | { type: 'removeBanana', value: number } | { type: 'propsReceived', value: number }
const addBanana = () => AvocEffects.updateModel<BananaMsg>({ type: "addBanana" })
const removeBanana = (value: number) => AvocEffects.updateModel<BananaMsg>({ type: "removeBanana", value });
type BananaProps = {
    count: number
}
const Banana: AvocElement<{ bananaCount: number, bananaBucket: { name: string }[] }, BananaMsg, BananaProps> = {
    init: () => ({ model: { bananaCount: 10, bananaBucket: [] } }),
    update: (model, message) => {
        if (message.type === 'propsReceived') {
            return {
                model: {
                    ...model,
                    bananaCount: message.value
                }
            }
        }

        if (message.type === 'addBanana') {
            return {
                model: {
                    ...model,
                    bananaBucket: [...model.bananaBucket, { name: 'Banana ' + counter++ }]
                }
            }
        }
        if (message.type === 'removeBanana') {
            return {
                model: {
                    ...model,
                    bananaBucket: model.bananaBucket.filter((b, i) => i !== message.value)
                }
            }
        }
        return { model }
    },
    events: {
        receiveProps: (props) => AvocEffects.updateModel<BananaMsg>({ type: "propsReceived", value: props.count }),
    },
    render: (model) => {
        return (<div>
            Banana {model.bananaCount}
            <div>
                <button onClick={addBanana}>add banana</button>
                <button onClick={() => removeBanana(0)}>remove banana</button>
            </div>
            {model.bananaBucket.map((banana, index) => (<div onClick={() => removeBanana(index)} key={banana.name}>{banana.name}</div>))}
        </div>)
    }
}

type Fruit2Msg = { type: 'increment' } | { type: 'decrement' } | { type: 'lalalala' }
type Fruit2Model = { count: number }

const increment = () => AvocEffects.updateModel<Fruit2Msg>({ type: "increment" })
const decrement = () => AvocEffects.updateModel<Fruit2Msg>({ type: "decrement" })
const lalalala = () => AvocEffects.updateModel<Fruit2Msg>({ type: "lalalala" })

const Fruit2: AvocElement<Fruit2Model, Fruit2Msg> = {
    init: () => ({
        model: {
            count: 1,
        }
    }),
    update: (model, msg) => {
        switch (msg.type) {
            case 'increment':
                return {
                    model: {
                        count: model.count + 1,
                    }
                }
            case 'decrement':
                return {
                    model: {
                        count: model.count - 1,
                    }
                }
            default:
                return { model };
        }
    },
    render: (model) => {
        return (
            <div title={'lalala' + model.count}>
                <div>fruit {model.count}</div>
                <button onClick={increment}>click on me ++</button>
                <button onClick={decrement}>click on me --</button>
                <button onClick={lalalala}>i do nothing</button>
                <Banana count={model.count} />
                {model.count < 3 ? 'hello' : null}
                {model.count === 1 ? null : 'not 1'}
                <Banana count={model.count} />
                some text at the end
                {model.count === 1 ? <FruitStore /> : null}
            </div>

        )
    },
}

const changeText = (value: string) => AvocEffects.updateModel({ type: 'text', value })
const TextInput: AvocElement<{ text: string }, { type: 'text', value: string }> = {
    init: () => ({ model: { text: '' } }),
    update: (model, msg) => {
        if (msg.type === 'text') {
            return {
                model: {
                    text: msg.value,
                },
            }
        }
        return { model }
    },
    render: (model) => <h1>This is awesome {model.text}<Textbox2 value={model.text} onChange={changeText} /></h1>
}

const Select = {
    render: (_model, props) => (
        <select title={props.value} value={props.value} onChange={e => props.onChange(e.target.value)}>
            {props.options.map(option => <option>{option}</option>)}
        </select>
    ),
}

const TextBox = {
    init: () => ({ model: { text: '' } }),
    update: (model, msg) => {
        if (msg.type === 'text') {
            return {
                model: {
                    text: msg.value,
                },
            }
        }
        return { model }
    },
    render: (model) => (
        <div>
            <div>{model.text}</div>
            <input type="text" value={model.text} onKeyUp={(e) => AvocEffects.updateModel({ type: 'text', value: e.target.value })} />
        </div>
    )
}

const Textbox2 = {
    render: (_model, { onChange, value }) => <input type="text" value={value} onKeyUp={(e) => onChange(e.target.value)} />
}

const FruitStore: AvocElement<{ fruits: string[] }, { type: 'updateFruits', value: string[] }> = {
    init: () => ({ model: { fruits: [] } }),
    update: (model, msg) => {
        if (msg.type = 'updateFruits') {
            return {
                model: {
                    ...model,
                    fruits: msg.value,
                }
            }
        }
        return { model };
    },
    selectors: [
        {
            bucket: 'fruits',
            msg: 'updateFruits',
            selector: fruits => fruits,
        }
    ],
    render: (model) => {
        return (
            <div>

                {model.fruits.map(fruit => <div>{fruit}</div>)}
            </div>
        );
    },
}

const carArray = ['BMW', 'Audi', 'Mercedes'];

type GarageMsg = { type: 'updateCars', value: string[] } | { type: 'setCar', value: string } | { type: 'addCar' }

const addCar = _do(function* (car: string) {
    yield AvocStoreEffects.update('cars', 'add', car);
    const currentResult = yield AvocStoreEffects.read('cars');
    const currentModel = yield AvocEffects.getModel();
    console.log('currentModel', currentModel);
    yield AvocEffects.updateModel<GarageMsg>({ type: 'setCar', value: 'Mercedes' })
})

const selectMercedes = () => AvocEffects.updateModel({ type: 'setCar', value: 'Mercedes' })
const setCar = (car: string) => AvocEffects.updateModel<GarageMsg>({ type: 'setCar', value: car });
const addSimpleCar = () => AvocEffects.updateModel({ type: 'addCar' });

const Garage: AvocElement<{ cars: string[], selected: string }, GarageMsg> = {
    init: () => ({ model: { cars: [], selected: carArray[0] } }),
    events: {
        mount: () => {
            console.log('i got mounted')
        },
    },
    update: (model, msg) => {
        if (msg.type === 'updateCars') {
            console.log('update cars', msg.value)
            return ({ model: { ...model, cars: msg.value } })
        }
        if (msg.type === 'setCar') {
            return ({ model: { ...model, selected: msg.value } })
        }
        if (msg.type === 'addCar') {
            return ({ model, cmd: addCar(model.selected) })
        }
        return { model }
    },
    selectors: [
        {
            bucket: 'cars',
            msg: 'updateCars',
            selector: state => state,
        }
    ],
    render: (model) => {
        return (
            <div title={model.selected}>
                <Select options={carArray} onChange={setCar} value={model.selected} /><button onClick={addSimpleCar}>add</button>
                <div>{model.cars.join(', ')}</div>
                <button onClick={selectMercedes}>select le mercedes (should work)</button>
                <FunctionBlubber blubber={model.selected} />
            </div>
        );
    },
}

const Switch: AvocElement<boolean, { type: 'on' } | { type: 'off' }> = {
    init: () => ({ model: false }),
    update: (model, msg) => {
        if (msg.type === 'off') {
            return { model: false };
        }
        if (msg.type === 'on') {
            return { model: true };
        }
        return { model }
    },
    render: (model) => (<button onClick={() => AvocEffects.updateModel(model ? 'off' : 'on')}>{model ? 'on' : 'off'}</button>)
}

const FunctionBlubber = ({ blubber }) => <div>Blubber: {blubber}</div>

const App = {
    render: () => (
        <div>
            <h1 style={{ marginTop: '100px', textAlign: 'center' }} className={'foo bar'}>Avoc</h1>
            <Fruit />
            <Fruit2 />
            This is a text node
            <TextInput />
            <button onClick={() => AvocStoreEffects.update('fruits', 'add', 'rasberry')}>add fruit</button>
            <button onClick={() => AvocStoreEffects.update('fruits', 'noop', 'rasberry')}>add nothing</button>
            <button onClick={() => AvocStoreEffects.update('cars', 'add', 'bmw')}>add car</button>
            <button onClick={() => AvocEffects.updateModel({ type: 'setCar', value: 'Mercedes' })}>select mercedes (should not work)</button>
            <TextBox />
            <Garage />
            <div>Further text</div>
            <Switch />
            <FunctionBlubber blubber="hello" />
            <div display="flex" style={{ display: "flex" }}>
            </div>
        </div>
    ),
}

export default App;