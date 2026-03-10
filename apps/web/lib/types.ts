export interface TriggerNode {
  id: string;
  type: "trigger";
  app: App | null;
  configured: boolean;
  config?: Record<string, any>;
}

export interface ActionNode {
  id: string;
  type: "action";
  app: App | null;
  configured: boolean;
  config?: Record<string, any>;
}
export type Action = Record<"id" | "name" | "imageUrl", string> & {
  disabled: Boolean;
};
export type Trigger = Action;

export type ZapNode = TriggerNode | ActionNode;

export type App = Action | Trigger;
