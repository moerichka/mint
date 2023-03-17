import React, { useState } from "react";

import useCloseModal from "hooks/modal/useCloseModal";

import ModalContainer from "../ModalContainer";

import s from "./NftResponseModal.module.scss";

interface Props {
  open: boolean;
  close: () => void;
}

function NftResponseModal({ open, close }: Props) {
  const { isClosing, onClose } = useCloseModal(close);

  return (
    <ModalContainer open={open} onClose={onClose} isClosing={isClosing}>
      <div className={s.modalWindowWrapper}>
        <div className={s.modalWindow}>
          <div className={s.summeryWrapper}>
            <div className={s.summery}>
              <div className={s.title}>Congratulations!</div>
              <button type="button" className={s.close} onClick={onClose}>
                <div className={s.iconClose}>
                  <span className={s.line} />
                  <span className={s.line} />
                </div>
              </button>
            </div>
          </div>
          <div className={s.content}>
            {/* <div className={s.title}>Referral request form</div> */}
            <div className={s.textBlock}>
              <p>
                You have received your NFT Pass on your wallet, don&apos;t lose it!
                This pass is your key to future adventures in the MetaTrace
                Universe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
}

export default NftResponseModal;
