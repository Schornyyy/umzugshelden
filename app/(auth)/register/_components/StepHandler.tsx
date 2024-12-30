import { useRegisterData } from '@/customHooks/useRegisterData'
import React from 'react'
import ChooseStep from './ChooseStep';
import RegisterStep from './RegisterStep';
import CompanyRegister from './CompanyRegister';

const StepHandler = () => {
    const {step} = useRegisterData();

    function handleShowenStep() {
        switch (step) {
            case "choose":
                return (
                    <ChooseStep />
                )
            case "register":
                return (
                    <RegisterStep />
                )
            case "companyRegister":
                return (
                    <CompanyRegister/>
                )
            default:
                return(
                    <p>Step: {step}</p>
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