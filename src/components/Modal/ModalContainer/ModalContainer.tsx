/* eslint-disable jsx-a11y/control-has-associated-label */
import React from "react";

import s from "./ModalContainer.module.scss";

interface Props {
  children: React.ReactNode;
  open: boolean;
  isClosing: boolean;
  onClose: () => void;
}

function ModalContainer({ children, open, isClosing, onClose }: Props) {
  return (
    <div
      className={`${s.modal} ${open ? s.open : ""} ${
        isClosing ? s.isClosing : ""
      }`}
    >
      <div className={s.content}>{children}</div>
      <button
        type="button"
        onClick={onClose}
        className={s.background}
        disabled={isClosing}
      />
    </div>
  );
}

export default ModalContainer;
