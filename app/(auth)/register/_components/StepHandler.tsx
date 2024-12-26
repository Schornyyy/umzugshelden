import { useRegisterData } from '@/customHooks/useRegisterData'
import React from 'react'
import Step1 from './step.1';

const StepHandler = () => {
    const {step} = useRegisterData();

    function handleShowenStep() {
        switch (step) {
            case 0:
                return (
                    <Step1 />
                )

            default:
                return(
                    <p>Step: {Number(step)}</p>
                )
        }
    }

  return (
    <>
    {handleShowenStep()}
    </>
  )
}

export default StepHandler