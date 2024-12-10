import { useCallback, useContext } from "react"
import { useAuth } from "./use-auth"
import { navigationStore } from "../../context/navigation/navigation.provider"
import { Redirect } from "../../context/navigation/navigation.actions"

export const useLoginCb = () => {
  const {ready: authReady, authURL} = useAuth()
  const {state, dispatch} = useContext(navigationStore)
  const {identityToken} = state

  return useCallback(() => {
    if(authReady && !identityToken) {
      dispatch(Redirect(true))
      window.location.href = authURL
    }}, [identityToken, dispatch, authReady, authURL])
}
