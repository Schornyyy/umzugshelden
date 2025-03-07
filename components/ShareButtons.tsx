import { useEffect, useState } from "react";
import {
  FaFacebook,
  FaWhatsapp,
  FaTwitter,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa";
import Headings from "./Headings";

const ShareButtons = () => {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const shareLinks = [
    {
      icon: <FaFacebook className='text-blue-600' />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      label: "Facebook",
    },
    {
      icon: <FaWhatsapp className='text-green-500' />,
      url: `https://api.whatsapp.com/send?text=${url}`,
      label: "WhatsApp",
    },
    {
      icon: <FaTwitter className='text-blue-400' />,
      url: `https://twitter.com/intent/tweet?url=${url}`,
      label: "Twitter",
    },
    {
      icon: <FaLinkedin className='text-blue-700' />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      label: "LinkedIn",
    },
    {
      icon: <FaEnvelope className='text-gray-600' />,
      url: `mailto:?subject=Schau dir das an!&body=${url}`,
      label: "E-Mail",
    },
  ];

  return (
    <div className='flex flex-col space-y-2'>
      <Headings level={5}>Teilen auf:</Headings>
      <div className='flex flex-row gap-4'>
        {shareLinks.map((share, index) => (
          <a
            key={index}
            href={share.url}
            target='_blank'
            rel='noopener noreferrer'
            className='p-2 rounded-full shadow-md hover:bg-gray-100 transition-all'
            aria-label={`Teilen auf ${share.label}`}>
            {share.icon}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ShareButtons;
