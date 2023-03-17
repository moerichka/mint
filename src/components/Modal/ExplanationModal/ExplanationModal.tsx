import React, { useState } from "react";

import useCloseModal from "hooks/modal/useCloseModal";

import ModalContainer from "../ModalContainer";

import s from "./ExplanationModal.module.scss";

interface Props {
  open: boolean;
  close: () => void;
}

function ExplanationModal({ open, close }: Props) {
  const { isClosing, onClose } = useCloseModal(close);
  const [userInfo, setUserInfo] = useState("");

  const userInfoChangeHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInfo(e.target.value);
  };

  const formSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userInfo) {
      return;
    }

    onClose();
  };

  return (
    <ModalContainer open={open} onClose={onClose} isClosing={isClosing}>
      <div className={s.modalWindowWrapper}>
        <div className={s.modalWindow}>
          <div className={s.summeryWrapper}>
            <div className={s.summery}>
              <div className={s.title}>HOW IT WORKS?</div>
              <button type="button" className={s.close} onClick={onClose}>
                <div className={s.iconClose}>
                  <span className={s.line} />
                  <span className={s.line} />
                </div>
              </button>
            </div>
          </div>
          <div className={s.content}>
            <div className={s.title}>Free mint for first presale holders!</div>
            <div className={s.textBlock}>
              <p>
                To mint NFT Pass, link your MetaMask wallet. Please note that
                you will need a small amount of MATIC to pay for gas fees.
              </p>
              <p>
                After the mint process, an NFT Pass with a unique ID will be
                sent to your wallet. It will grant you access to all activities
                and events in the MetaTrace!
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
}

export default ExplanationModal;
