interface Effects {
  avocStoreUpdate: (bucket: string, action: string, payload: unknown) => void;
  avocStoreRead: (bucket: string) => any;
  updateModel: <Msg>(msg: Msg) => void;
  getModel: <Mdl>() => Mdl;
}

export type Effect<T> = (effects: Effects) => Promise<T> | T;

class SystemIO<A> {
  private effect: Effect<A>;
  constructor(effect: Effect<A>) {
    this.effect = effect;
  }
  static of<T>(val: T) {
    return new SystemIO(() => Promise.resolve(val));
  }

  map<B>(f: (val: A) => B): SystemIO<B> {
    const mappedEffect: Effect<B> = async (effects: Effects) => {
      const unwrappedVal: A = await this.effect(effects);
      return f(unwrappedVal);
    };
    return new SystemIO(mappedEffect);
  }

  flatMap<B>(f: (val: A) => SystemIO<B>): SystemIO<B> {
    const boundEffect: Effect<B> = async (effects: Effects) => {
      const unwrappedVal: A = await this.effect(effects);
      const mappedIO: SystemIO<B> = f(unwrappedVal);
      return mappedIO.effect(effects);
    };

    return new SystemIO(boundEffect);
  }

  eval(effects: Effects): Promise<A> | A {
    return this.effect(effects);
  }
  isSystemIO = true;
}

export default SystemIO;

export const _do =
  <T>(fn: (...args: any[]) => Generator<SystemIO<any>, T | SystemIO<T>, any>) =>
  (...args): SystemIO<T> => {
    const gen = fn(...args);

    const next = (val?) => {
      const res = gen.next(val);
      if (!res.done) return (res.value as SystemIO<any>).flatMap(next);
      if (res.value && "isSystemIO" in res.value && res.value.isSystemIO)
        return res.value;
      return SystemIO.of(res.value);
    };

    return next();
  };
