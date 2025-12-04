import { ReactNode } from 'react'

const FELT_IMAGE = '/assets/poker-felt-texture.png'

interface TableFeltProps {
  children?: ReactNode
}

/**
 * Poker table with wooden frame and felt texture.
 * Container only - community cards and pot positioned separately.
 */
export function TableFelt({ children }: TableFeltProps) {
  return (
    <div className="h-[315px] relative w-[743px]">
      <div 
        className="absolute bg-gradient-to-b border-2 border-black 
                   border-solid bottom-[0.09%] from-[#e7b182] left-0 
                   right-[0.04%] rounded-[157.356px] 
                   shadow-[5px_5px_4px_0px_rgba(0,0,0,0.5)] 
                   to-[#e1a159] top-0" 
      />
      <div 
        className="absolute border-2 border-black border-solid 
                   inset-[7.62%_3.16%_7.46%_3.23%] rounded-[247.609px]"
      >
        <img 
          alt="" 
          className="absolute inset-0 max-w-none object-50%-50% 
                     object-cover pointer-events-none 
                     rounded-[247.609px] size-full" 
          src={FELT_IMAGE} 
        />
      </div>
      {children}
    </div>
  )
}
