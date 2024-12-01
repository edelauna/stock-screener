import { State } from "./market-status.provider";

export enum ActionType {
  Refresh = "market-status/refresh",
  UpdateInitializingStatus = "market-status/initialization",
}

type PartialState = {
  markets: State["markets"];
  currentRef: State["currentRef"]
}

type RefreshType = {
  type: ActionType.Refresh;
  payload: PartialState;
};

type UpdateInitializingStatusType = {
  type: ActionType.UpdateInitializingStatus;
  payload: boolean
}

export type Actions = RefreshType | UpdateInitializingStatusType;

export const Refresh = (data: PartialState): RefreshType => ({
  type: ActionType.Refresh,
  payload: data,
});

export const UpdateInitializingStatus = (status: boolean): UpdateInitializingStatusType => ({
  type: ActionType.UpdateInitializingStatus,
  payload: status
})