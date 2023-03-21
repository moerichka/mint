/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/display-name */
import React, { forwardRef, useCallback } from "react";
import {
  useSnackbar,
  SnackbarContent,
  SnackbarKey,
  CustomContentProps,
} from "notistack";

import s from "./SnackBar.module.scss";

interface SnackBarProps extends CustomContentProps {
  id: SnackbarKey;
  customTitle: React.ReactNode;
  customMessage: React.ReactNode;
  type: "error" | "default" | "correct";
}

const SnackBar = forwardRef<HTMLDivElement, SnackBarProps>(
  ({ id, customTitle, customMessage, type, ...props }, ref) => {
    const { closeSnackbar } = useSnackbar();

    const handleDismiss = useCallback(() => {
      closeSnackbar(id);
    }, [id, closeSnackbar]);

    const snackBarClass = `${s.snackBar} ${s[type]}`;

    return (
      <SnackbarContent {...props} ref={ref} className={snackBarClass}>
        <div className={s.content}>
          {customTitle && <div className={s.title}>{customTitle}</div>}
          {customMessage && <div className={s.message}>{customMessage}</div>}
        </div>
        <button type="button" className={s.closeButton} onClick={handleDismiss}>
          <div className={s.iconClose}>
            <span className={s.line} />
            <span className={s.line} />
          </div>
        </button>
      </SnackbarContent>
    );
  }
);

SnackBar.displayName = "SnackBar";

export default SnackBar;
