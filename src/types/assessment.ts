export interface ActionNode {
  id: string;
  title: string;
  notes: string;
  done: boolean;
}

export interface TargetNode {
  id: string;
  title: string;
  notes: string;
  actions: ActionNode[];
}

export interface TopicNode {
  id: string;
  title: string;
  notes: string;
  targets: TargetNode[];
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  topics: TopicNode[];
}

export type Selection =
  | { kind: "topic"; topicId: string }
  | { kind: "target"; topicId: string; targetId: string }
  | { kind: "action"; topicId: string; targetId: string; actionId: string };
