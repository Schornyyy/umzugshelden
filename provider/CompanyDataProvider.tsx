import { getUserById } from "@/actions/userActions";
import { auth } from "@/config/firebase";
import { User } from "@/types/UserType";
import { useParams, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface CompanyDataContextType {
  companyData: User | null;
  setCompanyData: React.Dispatch<React.SetStateAction<User | null>>;
}

const CompanyDataContext = createContext<CompanyDataContextType | undefined>(
  undefined
);

export const useCompanyData = () => {
  const context = useContext(CompanyDataContext);
  if (!context) {
    throw new Error("useCompanyData must be used within a CompanyDataProvider");
  }
  return context;
};

export const CompanyDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [companyData, setCompanyData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const params = useParams<{ userid: string }>();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const data = await getUserById(params.userid);

          if (data) {
            setCompanyData(data);
          } else {
            router.push("/login");
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        } catch (error: any) {
          router.push("/login");
        }
      } else {
        setAuthChecked(true);
        router.push("/login");
      }
      setAuthChecked(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [params.userid, router]);

  useEffect(() => {
    if (authChecked && auth.currentUser) {
      const fetchCompanyData = async () => {
        const data = await getUserById(params.userid);

        if (data) {
          setCompanyData(data);
        } else {
          router.push("/login");
        }
      };
      fetchCompanyData();
    }
  }, [authChecked, params.userid, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <CompanyDataContext.Provider value={{ companyData, setCompanyData }}>
      {children}
    </CompanyDataContext.Provider>
  );
};
