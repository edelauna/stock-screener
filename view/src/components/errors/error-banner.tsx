import { Button } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import ErrorDisplay from './error-dialog'
import { useContext, useEffect, useState } from 'react'
import { errorStore } from '../../context/errors/errors.provider'
import { ToggleShow } from '../../context/errors/errors.actions'

export default function ErrorBanner() {
  const {state, dispatch} = useContext(errorStore)
  const [showBanner, setShowBanner] = useState(false)
  const {errors} = state

  useEffect(() => errors.length > 0 ? setShowBanner(true) : setShowBanner(false), [errors])

  return (<>
    {showBanner  ?
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-red-50 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <div
        aria-hidden="true"
        className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
      >
      </div>
      <div
        aria-hidden="true"
        className="absolute left-[max(45rem,calc(50%+8rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
      >
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm/6 text-gray-900">
          There were some recent errors
        </p>
        <Button
          onClick={() => dispatch(ToggleShow(true))}
          className="flex-none rounded-full bg-red-400 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          See Errors <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
      <div className="flex flex-1 justify-end">
        <Button
          type="button"
          className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
          onClick={() => setShowBanner(false)}
        >
          <span className="sr-only">Dismiss</span>
          <XMarkIcon aria-hidden="true" className="size-5 text-gray-900" />
        </Button>
      </div>
    </div> : null }
    <ErrorDisplay />
    </>
  )
}
