import { AAVE } from "./aave";
import { UNISWAP } from "./uniswap";
import { MORPHO } from "./morpho";
import { FLUID } from "./fluid";
import { ACALA, BIFROST, HYDRADX } from "./polkadot";

export * from "./aave";
export * from "./stCelo";
export * from "./ankr";
export * from "./kitty";
export * from "./morpho";
export * from "./dynaVest";
export * from "./camelot";
export * from "./uniswap";
export * from "./gmx";
export * from "./lido";
export * from "./fluid";
export * from "./polkadot";

export const PROTOCOLS = [AAVE, UNISWAP, MORPHO, FLUID, ACALA, BIFROST, HYDRADX];
