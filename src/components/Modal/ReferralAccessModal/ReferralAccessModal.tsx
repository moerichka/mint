import React, { useState } from "react";

import useCloseModal from "hooks/modal/useCloseModal";

import ModalContainer from "../ModalContainer";

import s from "./ReferralAccessModal.module.scss";

interface Props {
  open: boolean;
  close: () => void;
}

function ReferralAccessModal({ open, close }: Props) {
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
            <div className={s.title}>Referral request form</div>
            <div className={s.textBlock}>
              <p>
                The Trace referral system is designed for influencers around the
                world. Bring value and get rewarded!
                <br />
                Apply by telling us about yourself and your amazing experience:
              </p>
              <p>
                The Trace referral system is designed for influencers around the
                world. Bring value and get rewarded!
                <br />
                Apply by telling us about yourself and your amazing experience:
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
}

export default ReferralAccessModal;
