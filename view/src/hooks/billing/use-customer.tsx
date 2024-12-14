import { useContext, useEffect, useRef, useState } from "react"
import { useLocalKey } from "../auth/use-keys"
import { base64UrlDecoder, navigationStore } from "../../context/navigation/navigation.provider"
import { useLocation, useNavigate } from "react-router"
import { Redirect } from "../../context/navigation/navigation.actions"
import { errorStore } from "../../context/errors/errors.provider"
import { Add } from "../../context/errors/errors.actions"

const scanForCustomerCookie = () => document.cookie.split(';').find(c => c.split('=')[0] === 'customer')?.split('=')[1]

const deleteCustomerCookie = () => {
  const nonCustomerCookies = document.cookie.split(';').filter(c => c.split('=')[0] !== 'customer')
  document.cookie = [
    ...nonCustomerCookies,
    "customer=; Path=/; Max-Age=0; SameSite=Strict"
  ].join(';')
}

export const useCustomer = () => {
  const [rawCustomer, setRawCustomer] = useState(() => scanForCustomerCookie())
  const [customer, setCustomer] = useState()
  const cookieRef = useRef(rawCustomer)
  const location = useLocation()
  const navigate = useNavigate()
  const checkoutIdRef = useRef('')
  const {state, dispatch} = useContext(navigationStore)
  const {dispatch: errorDispatch} = useContext(errorStore)

  useEffect(() => {
    const cookieIntervalCheck = setInterval(() => {
      const customerCookie = scanForCustomerCookie()
      if(cookieRef.current !== customerCookie) {
        cookieRef.current = customerCookie
        setRawCustomer(customerCookie)
      }
    }, 500)
    return () => clearInterval(cookieIntervalCheck)
  })

  const { localKey } = useLocalKey()

  useEffect(() => {
    const verify = async (payload: string) => {
      const [body, signature] = payload.split('.')
      const encoder = new TextEncoder()
      const key = await window.crypto.subtle.importKey(
        'jwk',
        localKey!,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: { name: 'SHA-256' }
        },
        false,
        ['verify']
      )
      const isValid = await window.crypto.subtle.verify(
          { name: 'RSASSA-PKCS1-v1_5' },
          key,
          Uint8Array.from(base64UrlDecoder(signature), c => c.charCodeAt(0)),
          encoder.encode(body)
        )
      if (isValid) {
        setCustomer(JSON.parse(base64UrlDecoder(body)))
      } else {
        setCustomer(undefined)
      }

    }
    if(localKey && rawCustomer) verify(rawCustomer)
  }, [localKey, rawCustomer])

  useEffect(() => {
    const updateCustomerData = async (checkoutId: string) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}billing/redirected?checkout_session_id=${checkoutId}`, {
          credentials: 'include'
        })
        if(!response.ok) return errorDispatch(Add({
          header: 'useCustomer::Genrate customer Data response not ok',
          body: await response.text()
        }))
        setRawCustomer(scanForCustomerCookie())
        navigate("/")
      }catch(e) {
        errorDispatch(Add({
          header: 'useCustomer::Error updating customer data',
          body: (e as Error).message
        }))
      }finally{
        dispatch(Redirect(false))
      }
    }

    if(location.pathname.startsWith('/checkout_redirected')){
      const search = new URLSearchParams(location.search)
      const checkoutId = search.get('checkout_session_id')
      if(checkoutId && checkoutId !== checkoutIdRef.current) {
        dispatch(Redirect(true))
        checkoutIdRef.current = checkoutId
        updateCustomerData(checkoutId)
      }
    }
  }, [location, dispatch, errorDispatch, navigate])

  useEffect(() => {
    if(rawCustomer && state.rawIdentityToken === ''){
      deleteCustomerCookie()
      setCustomer(undefined)
      setRawCustomer(undefined)
    }
  }, [rawCustomer, state.rawIdentityToken, navigate])

  return { customer }
}
