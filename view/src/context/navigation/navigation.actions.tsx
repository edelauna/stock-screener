export enum ActionType {
  Navigate = "navigation/navigate",
}

type NavigateActionType = {
  type: ActionType.Navigate;
  payload: string;
};

export type Actions = NavigateActionType;

export const Navigate = (id: string): NavigateActionType => ({
  type: ActionType.Navigate,
  payload: id,
});