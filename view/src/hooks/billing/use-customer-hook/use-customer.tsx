import { useContext, useEffect, useState } from "react"
import { PartialRSAJWK, useLocalKey } from "../../auth/use-keys"
import { navigationStore } from "../../../context/navigation/navigation.provider"
import { useLocation, useNavigate } from "react-router"
import { RawCustomer } from "../../../context/navigation/navigation.actions"
import { errorStore } from "../../../context/errors/errors.provider"
import { useUpdateCustomerData } from "./use-callbacks/use-update-customer-data"
import { useVerifyCB } from "./use-callbacks/use-verify-cb"

export const useCustomer = () => {
  const [customer, setCustomer] = useState()
  const location = useLocation()
  const navigate = useNavigate()
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const {state, dispatch} = useContext(navigationStore)
  const {dispatch: errorDispatch} = useContext(errorStore)

  const { localKey } = useLocalKey()
  const verifyCB = useVerifyCB()

  useEffect(() => {
    const verify = async (key: PartialRSAJWK,jwt: string) => {
      const {isValid, payload} = await verifyCB(key, jwt)
      if(isValid) {
        setCustomer(payload)
      } else {
        setCustomer(undefined)
      }
    }
    if(localKey && state.rawCustomerToken !== '') verify(localKey, state.rawCustomerToken)
  }, [localKey, state.rawCustomerToken, verifyCB])

  useUpdateCustomerData(checkoutId)

  useEffect(() => {
    if(location.pathname.startsWith('/checkout_redirected')){
      const search = new URLSearchParams(location.search)
      const checkoutId = search.get('checkout_session_id')
      setCheckoutId(checkoutId)
    }
  }, [location, dispatch, errorDispatch, navigate])

  useEffect(() => {
    if(state.rawCustomerToken !== '' && state.rawIdentityToken === ''){
      dispatch(RawCustomer(''))
      setCustomer(undefined)
    }
  }, [state.rawCustomerToken, state.rawIdentityToken, dispatch])

  return { customer }
}
