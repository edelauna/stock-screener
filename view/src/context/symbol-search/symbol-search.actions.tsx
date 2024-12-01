import { SymbolSearchResult } from "../../hooks/use-symbol-search";

export enum ActionType {
  Refresh = "symbol-search/refresh",
  UpdateBusyStatus = "symbol-search/busy",
  UpdateActiveSymbol = "symbol-search/active-symbol",
  UpdateCurrentDataRef = 'symbol-search/current-data-ref',
  UpdateCurrentInputRef = 'symbol-search/current-input-ref'
}

type RefreshType = {
  type: ActionType.Refresh;
  payload: SymbolSearchResult[];
};

type UpdateBusyStatusType = {
  type: ActionType.UpdateBusyStatus;
  payload: boolean
}

type UpdateActiveSymbolType = {
  type: ActionType.UpdateActiveSymbol;
  payload: SymbolSearchResult
}

type UpdateCurrentDataRefType = {
  type: ActionType.UpdateCurrentDataRef;
  payload: string
}

type UpdateCurrentInputRefType = {
  type: ActionType.UpdateCurrentInputRef;
  payload: string
}

export type Actions = RefreshType | UpdateBusyStatusType | UpdateActiveSymbolType | UpdateCurrentDataRefType | UpdateCurrentInputRefType;

export const Refresh = (data: SymbolSearchResult[]): RefreshType => ({
  type: ActionType.Refresh,
  payload: data,
});

export const UpdateBusyStatus = (status: boolean): UpdateBusyStatusType => ({
  type: ActionType.UpdateBusyStatus,
  payload: status
})

export const UpdateActiveSymbol = (symbol: SymbolSearchResult): UpdateActiveSymbolType => ({
  type: ActionType.UpdateActiveSymbol,
  payload: symbol
})

export const UpdateCurrentDataRef = (currentRef: string): UpdateCurrentDataRefType => ({
  type: ActionType.UpdateCurrentDataRef,
  payload: currentRef
})

export const UpdateCurrentInputRef = (currentRef: string): UpdateCurrentInputRefType => ({
  type: ActionType.UpdateCurrentInputRef,
  payload: currentRef
})