import { useEffect, useState } from 'react'

const useMount = () => {
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => setMounted(true), [])

  return { isMounted: mounted }
}

export default useMount
