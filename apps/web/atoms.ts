import axios from "axios";
import { App, TriggerNode, ActionNode } from "./lib/types";
import { atom } from "jotai";

export const TriggerAtom = atom<Partial<TriggerNode | null>>(null);
export const ActionsAtom = atom<Partial<ActionNode[] | null>>(null);
export const MetaDataAtom = atom<Record<string, string> | null>(null);
export const SaveNodeAction = atom<any>(null);
export const PublishModalOpenAtom = atom<boolean>(false);

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

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
