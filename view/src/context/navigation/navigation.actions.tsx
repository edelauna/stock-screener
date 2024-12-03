export enum ActionType {
  Navigate = "navigation/navigate",
  Redirect = "navigation/redirect"
}

type NavigateActionType = {
  type: ActionType.Navigate;
  payload: string;
};

type RedirectType = {
  type: ActionType.Redirect;
  payload: boolean
}

export type Actions = NavigateActionType | RedirectType;

export const Navigate = (id: string): NavigateActionType => ({
  type: ActionType.Navigate,
  payload: id,
});

export const Redirect = (value: boolean): RedirectType => ({
  type: ActionType.Redirect,
  payload: value
})