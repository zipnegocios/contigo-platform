'use client'

import { useEffect } from 'react'
import type { CustomBlockData } from '@/types/pageBlocks'

interface Props { data: CustomBlockData }

export function CustomBlock({ data }: Props) {
  useEffect(() => {
    if (!data.js) return
    try {
      // eslint-disable-next-line no-new-func
      new Function(data.js)()
    } catch (e) {
      console.warn('[CustomBlock JS error]', e)
    }
  }, [data.js])

  return (
    <section>
      {data.css && <style dangerouslySetInnerHTML={{ __html: data.css }} />}
      <div dangerouslySetInnerHTML={{ __html: data.html }} />
    </section>
  )
}
