export type Input = {
  name: string;
  type: string;
  internalType: string;
};

export type ABI = {
  inputs: Input[];
};

export type Static = {
  type: string;
  name: string;
};
