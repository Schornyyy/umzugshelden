"use client"
import { auth } from "@/config/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import React from "react";
import { FiLogOut } from "react-icons/fi";

const Navbar = () => {

    const router = useRouter()

    function handleLogout() {
        signOut(auth);
        router.push('/login')
    }



  return (
    <div className="bg-gray-800 text-white px-6 py-4 flex justify-end items-center max-md:hidden">
      <div className="flex items-center space-x-4">
        <button className="flex items-center gap-2 bg-red-500 px-3 py-2 rounded-md hover:bg-red-600" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
