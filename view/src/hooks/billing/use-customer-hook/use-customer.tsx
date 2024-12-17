import { useContext, useEffect, useState } from "react"
import { PartialRSAJWK, useLocalKey } from "../../auth/use-keys"
import { navigationStore } from "../../../context/navigation/navigation.provider"
import { RawCustomer } from "../../../context/navigation/navigation.actions"
import { useVerifyCB } from "./use-callbacks/use-verify-cb"

export type Customer = {
  oid: string
  customer: {
    id: string,
    object: 'customer',
    metadata: {
      oid?: string
    },
    subscriptions?: {
      data: {
        items: {
          data: {
            plan: {
              id: string
            }
          }[]
        }
      }[]
    }
  }
}

export const useCustomer = () => {
  const [customer, setCustomer] = useState<Customer | undefined>()
  const {state, dispatch} = useContext(navigationStore)

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

  useEffect(() => {
    if(state.rawCustomerToken !== '' && state.rawIdentityToken === ''){
      dispatch(RawCustomer(''))
      setCustomer(undefined)
    }
  }, [state.rawCustomerToken, state.rawIdentityToken, dispatch])

  return { customer }
}
