import { useState } from "react";

const useCloseModal = (closeHandler: () => void) => {
  const [isClosing, setIsClosing] = useState(false);

  const onClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      closeHandler();
    }, 300);
  };

  return { isClosing, onClose };
};

export default useCloseModal;
