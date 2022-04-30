import SystemIO from "./SystemIO";

export const AvocStoreEffects = {
  update: (bucket: string, action: string, payload: unknown) =>
    new SystemIO((effects) => effects.avocStoreUpdate(bucket, action, payload)),
  read: (bucket) => new SystemIO((effects) => effects.avocStoreRead(bucket)),
};

export const AvocEffects = {
  updateModel: <Msg>(msg: Msg) =>
    new SystemIO((effects) => effects.updateModel(msg)),
  getModel: <Mdl>(): Mdl => new SystemIO((effects) => effects.getModel()),
};
