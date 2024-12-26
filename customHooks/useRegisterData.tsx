import { RegisterDataContext } from "@/app/(auth)/register/provider/RegisterDataProviderr"
import { useContext } from "react"

export const useRegisterData = () => {
    const context = useContext(RegisterDataContext);

    if (!context) {
        throw new Error("useRegisterData must be used within a RegisterDataProvider");
    }

    return context;
}