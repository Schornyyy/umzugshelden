// components/Sidebar.tsx
import { auth } from "@/config/firebase";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { signOut } from "firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { useState } from "react";
import { FiLogOut, FiMenu, FiSettings, FiUser } from 'react-icons/fi';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const {companyData} = useCompanyData()

  const navigation = [
    { name: "Einstellungen", icon: <FiSettings />, path: "/" },
    { name: "Dienstleistungen", icon: <FiUser />, path: "/services" },
  ];

  const handleNavigation = (path: string) => {
    router.push(`/user/${companyData!.id}/${path}`);
    setIsOpen(false);
  };

  function handleLogout() {
    signOut(auth);
    router.push('/login')
    }


  return (
    <div className="flex">
      {/* Mobile menu toggle */}
      <button
        className="flex flex-row w-full justify-end bg-green-500 absolute md:hidden p-2 text-gray-600 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiMenu size={24} className="group-hover:text-white" />
      </button>
      
      {/* Sidebar */}
      <div
        className={`fixed z-50 top-0 left-0 h-full bg-gray-800 text-white w-52 p-5 transform transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static`}
      >
        <Image alt="JobSmith Logo" src={"/images/JobSmith_Logo_Green.png"} height={126} width={265} className="object-cover mb-12"/>
        <ul className="space-y-4">
          {navigation.map((item) => (
            <li
              key={item.name}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded-md"
              onClick={() => handleNavigation(item.path)}
            >
              {item.icon}
              <span>{item.name}</span>
            </li>
          ))}
          <button className="flex items-center gap-2 bg-red-500 px-3 py-2 rounded-md hover:bg-red-600 md:hidden" onClick={handleLogout}>
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
        </ul>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Sidebar;
