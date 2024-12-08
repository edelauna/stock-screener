import { MenuButton } from "@headlessui/react"
import { useContext } from "react"
import { navigationStore } from "../context/navigation/navigation.provider"
import { useAuth } from "../hooks/auth/use-auth"
import { Redirect } from "../context/navigation/navigation.actions"

export const LoginButton = () => {
  const {state, dispatch} = useContext(navigationStore)
  const {identityToken} = state
  const {ready: authReady, authURL} = useAuth()

  return <MenuButton
  key='login'
  as="a"
  onClick={() => {
    if(authReady && !identityToken) {
      dispatch(Redirect(true))
      window.location.href = authURL
    }}}
  className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
>
  {identityToken ? `Hi ${identityToken.payload.name}` : 'Login' }
</MenuButton>
}
