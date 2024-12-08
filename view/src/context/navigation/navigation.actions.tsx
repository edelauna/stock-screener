export enum ActionType {
  Navigate = "navigation/navigate",
  Redirect = "navigation/redirect",
  Identity = "navigation/identity",
  RawIdentity = "navigation/raw-identity"
}

type NavigateActionType = {
  type: ActionType.Navigate;
  payload: string;
};

type RedirectType = {
  type: ActionType.Redirect;
  payload: boolean
}

export type RawIdentityToken = string

export type IdentityToken = {
  header: {
    alg: string
    kid: string
    typ: string
  };
  payload: {
    exp: number
    nbf: number
    ver: string
    iss: string
    sub: string
    aud: string
    iat: number
    auth_time: number
    oid: string
    name: string
    tfp: string
    at_hash: string
  }
  signature: string
}

type IdentityType = {
  type: ActionType.Identity;
  payload: IdentityToken | null
}

type RawIdentityType = {
  type: ActionType.RawIdentity;
  payload: RawIdentityToken
}

export type Actions = NavigateActionType | RedirectType | IdentityType | RawIdentityType;

export const Navigate = (id: string): NavigateActionType => ({
  type: ActionType.Navigate,
  payload: id,
});

export const Redirect = (value: boolean): RedirectType => ({
  type: ActionType.Redirect,
  payload: value
})

export const Identity = (token: IdentityToken | null): IdentityType => ({
  type: ActionType.Identity,
  payload: token
})

export const RawIdentity = (token: RawIdentityToken): RawIdentityType => ({
  type: ActionType.RawIdentity,
  payload: token
})
