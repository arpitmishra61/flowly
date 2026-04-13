import axios from "axios";
import { App, TriggerNode, ActionNode } from "./lib/types";
import { atom } from "jotai";

export const TriggerAtom = atom<Partial<TriggerNode | null>>(null);
export const ActionsAtom = atom<Partial<ActionNode[] | null>>(null);

const API = "http://localhost:5000";

export const fetchTriggerData = atom(null, async (get, set) => {
  if (get(TriggerAtom)?.app?.options) return;

  // may be in future we can fetch more data from netwrok
  const res = await axios.get<{ name: string }[]>(
    `${API}/api/v1/triggers/options/1`,
  );
  const options = res.data;
  set(
    TriggerAtom,
    (prev): Partial<TriggerNode> => ({
      ...prev,
      app: {
        ...(prev?.app ?? {}),
        options,
      },
    }),
  );
});
