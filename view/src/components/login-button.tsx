import { MenuButton } from "@headlessui/react"
import { useContext } from "react"
import { navigationStore } from "../context/navigation/navigation.provider"
import { useLoginCb } from "../hooks/auth/use-login-cb"

export const LoginButton = () => {
  const {state} = useContext(navigationStore)
  const {identityToken} = state

  return <MenuButton
  key='login'
  as="a"
  onClick={useLoginCb}
  className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
>
  {identityToken ? `Hi ${identityToken.payload.name}` : 'Login' }
</MenuButton>
}
