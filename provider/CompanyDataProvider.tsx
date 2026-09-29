import { getUserByEmail } from "@/actions/userActions";
import { auth } from "@/config/firebase";
import { User } from "@/types/UserType";
import { useParams, usePathname, useRouter } from "next/navigation";
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
  const params = useParams<{ userid: string }>();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user?.email) {
        setCompanyData(null);
        setLoading(false);
        router.replace("/login");
        return;
      }

      try {
        await user.reload();
        const account = user.email ? await getUserByEmail(user.email) : null;
        if (!account || account.role !== "admin") {
          setCompanyData(null);
          router.replace("/login");
          return;
        }

        setCompanyData(account);
        if (params.userid !== account.id) {
          router.replace(
            pathname.replace(/^\/admin\/[^/]+/, `/admin/${account.id}`)
          );
        }
      } catch {
        setCompanyData(null);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [params.userid, pathname, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <CompanyDataContext.Provider value={{ companyData, setCompanyData }}>
      {children}
    </CompanyDataContext.Provider>
  );
};
