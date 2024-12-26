import { useRegisterData } from '@/customHooks/useRegisterData';
import React from 'react'

const Step1 = () => {

    const {updateStep, step} = useRegisterData();

  return (
    <div className='flex flex-col gap-12 container mx-auto'>
        <div className='flex flex-row gap-12'>
          Step: {step}
        </div>
        <div className='flex flex-row items-end justify-end'>
            <button className='bg-green-700 text-white font-bold py-3 px-7 rounded-md ' onClick={() => updateStep(step + 1)}>
                Nächster Schritt
            </button>
        </div>
    </div>
  )
}

export default Step1;