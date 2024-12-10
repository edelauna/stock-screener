import { ErrorDialog } from "./errors.provider";

export enum ActionType {
  Add = "errors/add",
  Remove = "errors/remove",
  RemoveAll = "errors/removeAll",
  ToggleShow = 'errors/show/toggle',
  CtaResolvable = 'errors/show/resolvable-by-cta'
}

export enum ErrorIds {
  CtaRequire = 'upgrade/login'
}

type AddType = {
  type: ActionType.Add;
  payload: ErrorDialog;
};

type RemoveType = {
  type: ActionType.Remove;
  payload: string
}

type RemoveAllType = {
  type: ActionType.RemoveAll;
}

type ToggleShowType = {
  type: ActionType.ToggleShow;
  payload: boolean
}

type ShowErrorSolvedWithCTAType = {
  type: ActionType.CtaResolvable,
  payload: boolean
}

export type Actions = AddType | RemoveType | RemoveAllType | ToggleShowType | ShowErrorSolvedWithCTAType;

type AddProps = {
  header: ErrorDialog["header"];
  body: ErrorDialog["body"]
  id? : string
}

export const Add = (input: AddProps): AddType => {
  const err = {
    ...input,
    id: input.id ? input.id : window.crypto.randomUUID()
  }
  return {
    type: ActionType.Add,
    payload: err,
  }
};

export const Remove = (id: string): RemoveType => ({
    type: ActionType.Remove,
    payload: id,
  })

export const RemoveAll = (): RemoveAllType => ({
    type: ActionType.RemoveAll
  })

export const ToggleShow = (payload: boolean): ToggleShowType => ({
  type: ActionType.ToggleShow,
  payload
})

export const ShowCtaToResolveError = (payload: boolean): ShowErrorSolvedWithCTAType => ({
  type: ActionType.CtaResolvable,
  payload
})
