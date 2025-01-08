import { MenuButton } from "@headlessui/react"
import { useContext } from "react"
import { navigationStore } from "../context/navigation/navigation.provider"
import { useLoginCb } from "../hooks/auth/use-login-cb"

export const LoginButton = () => {
  const {state} = useContext(navigationStore)
  const {identityToken} = state
  const cb = useLoginCb()

  return <MenuButton
  key='login'
  as="a"
  onClick={cb}
  className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white relative bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
>
  {identityToken ? `Hi ${identityToken.payload.name}` : 'Login' }
</MenuButton>
}
