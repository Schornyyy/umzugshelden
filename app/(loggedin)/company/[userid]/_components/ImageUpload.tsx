"use client";

import { updateCompanyInDatabase } from "@/actions/companyActions";
import { storage } from "@/config/firebase";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { CompanyType } from "@/types/RegisterTypye";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import Image from "next/image";
import { useEffect, useState } from "react";

const ImageUploadComponent: React.FC = () => {
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false]);
  const { companyData } = useCompanyData();

  useEffect(() => {
    if (companyData) {
      const fetchedImages = companyData?.images || [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setImages((prev) =>
        [...fetchedImages, ...Array(3 - fetchedImages.length).fill(null)].slice(
          0,
          3
        )
      );
    }
  }, [companyData]);

  const handleFileChange = async (index: number, file: File | null) => {
    if (!file) return;

    const storageRef = ref(
      storage,
      `uploads/${companyData!.id!}/${file.name}-${Date.now()}`
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading((prev) => {
      const newUploading = [...prev];
      newUploading[index] = true;
      return newUploading;
    });

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Upload error:", error);
        setUploading((prev) => {
          const newUploading = [...prev];
          newUploading[index] = false;
          return newUploading;
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Update Firestore
        const companyDocRef: CompanyType = {
          ...companyData!,
          images: [...companyData!.images!, downloadURL],
        };
        await updateCompanyInDatabase(companyDocRef);

        setImages((prev) => {
          const newImages = [...prev];
          newImages[index] = downloadURL;
          return newImages;
        });

        setUploading((prev) => {
          const newUploading = [...prev];
          newUploading[index] = false;
          return newUploading;
        });
      }
    );
  };

  const handleDeleteImage = async (index: number) => {
    const imageUrl = images[index];
    if (!imageUrl) return;

    // Lösche das Bild aus Firebase Storage
    const imageRef = ref(
      storage,
      decodeURIComponent(imageUrl.split("/o/")[1].split("?")[0])
    );
    await deleteObject(imageRef).catch((error) =>
      console.error("Error deleting image:", error)
    );

    // Entferne die URL aus Firestore
    const companyDocRef: CompanyType = { ...companyData! };
    companyDocRef.images = companyData!.images!.filter(
      (img) => img !== imageUrl
    );
    await updateCompanyInDatabase(companyDocRef).then((res) => {
      console.log(res);
    });

    // Aktualisiere den Zustand
    setImages((prev) => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });
  };

  return (
    <div className='flex flex-col md:flex-row flex-wrap  gap-12'>
      {images.map((image, index) => (
        <div
          key={index}
          className='relative w-64 h-64 border border-gray-300 rounded-md overflow-hidden'>
          {uploading[index] ? (
            <div className='flex items-center justify-center h-full'>
              <div className='loader'></div>
            </div>
          ) : image ? (
            <div className='relative w-full h-full'>
              <Image
                src={image}
                alt={`Uploaded ${index}`}
                height={500}
                width={500}
                className='w-full h-full object-cover'
              />
              <button
                onClick={() => handleDeleteImage(index)}
                className='absolute top-2 right-2 bg-red-500 text-white h-[32px] w-[32px] text-center rounded-full text-sm'>
                ✕
              </button>
            </div>
          ) : (
            <label className='flex items-center justify-center w-full h-full cursor-pointer bg-gray-100 text-gray-500'>
              <span>+</span>
              <input
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) =>
                  handleFileChange(index, e.target.files?.[0] || null)
                }
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageUploadComponent;
