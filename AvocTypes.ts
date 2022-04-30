import SystemIO from "./SystemIO";

export type AvocElement<
  Mdl,
  Msg extends { type: string; value?: unknown },
  Props = undefined
> = {
  init: () => { model: Mdl };
  update: (model: Mdl, msg: Msg) => { model: Mdl; cmd?: SystemIO<unknown> };
  render: (model: Mdl, props: Props) => any;
  isAvoc?: true;
  selectors?: {
    bucket: string;
    selector: Function;
    msg: string;
  }[];
  events?: {
    receiveProps?: (newProps: Props, oldProps: Props) => SystemIO<unknown>;
    mount?: () => SystemIO<unknown>;
  };
};
