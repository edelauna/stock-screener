import { useCallback, useContext } from "react"
import { navigationStore } from "../../context/navigation/navigation.provider"
import { Redirect } from "../../context/navigation/navigation.actions"

export const useLoginCb = () => {
  const {state, dispatch} = useContext(navigationStore)
  const {identityToken} = state

  return useCallback(() => {
    if(state.authUrl && !identityToken) {
      dispatch(Redirect(true))
      window.location.href = state.authUrl
    }}, [identityToken, dispatch, state.authUrl])
}
