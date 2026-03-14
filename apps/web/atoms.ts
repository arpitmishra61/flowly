import { TriggerNode } from "./lib/types";
import { atom } from "recoil";

export const TriggerState = atom<TriggerNode | null>({
  key: "TriggerState",
  default: null,
});
