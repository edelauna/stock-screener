import React, { useContext, useEffect, useState } from "react"
import { navigationStore } from "../../context/navigation/navigation.provider"
import { Navigate } from "../../context/navigation/navigation.actions"

export const useObserver = (ref: React.MutableRefObject<any>) => {
  const {dispatch} = useContext(navigationStore)
  const [refs, setRef] = useState<React.MutableRefObject<any>[]>([])

  useEffect(() => setRef(r => {
    if(!r.includes(ref)) r.push(ref)
      console.log(`useObserver:refs.length:${r.length}`)
    return r
  }), [ref])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // set the active nav link
        console.log(`${entry.target.id}intersectionRatio:${entry.intersectionRatio}:isIntersecting:${entry.isIntersecting}`)
        if(entry.isIntersecting) dispatch(Navigate(entry.target.id))
      })
    }, {threshold: 0.5})

    refs.forEach(ref => {
      if(ref.current) observer.observe(ref.current)
    })

    return () => {
      refs.forEach(ref => {
        if(ref.current) observer.unobserve(ref.current)
      })
    }
  }, [refs, dispatch])

  return ref
}