import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useCallback, useContext, useEffect, useState } from 'react'
import { ErrorDialog, errorStore, generateIssueLink } from '../../context/errors/errors.provider'
import { ErrorIds, Remove, RemoveAll, ToggleShow } from '../../context/errors/errors.actions'
import { useCustomer } from '../../hooks/billing/use-customer-hook/use-customer'
import { useManageCb } from '../../hooks/billing/use-manage-cb'
import { useUpgradeCb } from '../../hooks/billing/use-upgrade-cb'
import { navigationStore } from '../../context/navigation/navigation.provider'
import { useLoginCb } from '../../hooks/auth/use-login-cb'

export default function ErrorDisplay() {
  const {state, dispatch} = useContext(errorStore)
  const {errors, show} = state
  const [mainError, setMainError] = useState<ErrorDialog>()
  const {customer} = useCustomer()
  const {state: navState} = useContext(navigationStore)
  const {identityToken} = navState
  const loginCB = useLoginCb()
  const manageCB = useManageCb()
  const updradeCB = useUpgradeCb()

  const generateIssueCb = useCallback(() => {
    if(!mainError) return

    window.open(generateIssueLink(mainError), '_blank')
    dispatch(Remove(mainError.id))
  }, [dispatch, mainError])

  useEffect(() => {
    if(errors.length > 0) {
      setMainError(errors[0])
    } else {
      dispatch(ToggleShow(false))
      setMainError(undefined)
    }
  }, [errors, dispatch])

  useEffect(() => {
    if(mainError?.id === ErrorIds.CtaRequire) dispatch(ToggleShow(true))
    }, [mainError, dispatch])

  const close = () => {
    dispatch(ToggleShow(false))
    dispatch(RemoveAll())
  }

  const render = () => {
    if(!mainError) return <></>
    return (
    <Dialog open={show ?? false} as="div" className="relative z-10 focus:outline-none" onClose={close}>

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-white/90">
        <div className="flex min-h-full items-center justify-center p-4">

          <DialogPanel
            transition
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0" // Use bg-white for solid white background
          >
            <div className="flex justify-between items-start mb-4"> {/* Flex container for counter and title */}
            <DialogTitle as="h3" className="text-base font-medium text-gray-800">
              {mainError?.header}
            </DialogTitle>
            <div className="text-gray-500"> {/* Counter aligned to the right */}
              {`#${errors.length}`}
            </div>
          </div>
            <p className="mt-2 text-sm text-gray-600"> {/* Adjusted text color for better visibility */}
              {mainError?.body}
            </p>
            {errors.length > 1 ?
            <p className="mt-2 text-xs text-gray-500"> {/* Adjusted text color for better visibility */}
              Click outside this model to dismiss all.
            </p> : null
            }
            <div className="mt-4 flex justify-between">
              <Button

                className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600"
                onClick={() => dispatch(Remove(mainError.id))}
              >
                Dismiss
              </Button>
              <Button
                className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600"
                onClick={mainError.id !== ErrorIds.CtaRequire ?
                  generateIssueCb : !identityToken ?
                    loginCB : customer ?
                      manageCB : updradeCB
                }
              >
                {mainError.id !== ErrorIds.CtaRequire ?
                  'Submit Issue' : !identityToken ?
                    'Login' : customer ?
                      'Manage Subscription' : 'Upgrade Account'}
              </Button>

            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )}

  return render()
}
