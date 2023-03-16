import React, { useEffect, useState } from "react";

import s from "./Timer.module.scss";

function Timer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
  });
  const endDate = new Date("Mar 20, 2023 00:00:00").getTime();

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const t = endDate - now;

      if (t >= 0) {
        const days = Math.floor(t / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const mins = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        // const secs = Math.floor((t % (1000 * 60)) / 1000);

        setTimeLeft({
          days,
          hours,
          mins,
        });
      }
    }, 10000);
    return () => {
      clearInterval(timerInterval);
    };
  }, [endDate]);

  return (
    <div className={s.timer}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={s.clockSvg}
        fill="none"
        viewBox="0 0 30 30"
      >
        <path
          fill="#FFA53B"
          stroke="#FFA53B"
          d="M12 1v5a1 1 0 1 0 2 0V3.201c5.038.523 9 4.62 9 9.799 0 5.535-4.465 10-10 10S3 18.535 3 13c0-2.454.882-4.687 2.346-6.426a1 1 0 1 0-1.532-1.289A11.95 11.95 0 0 0 1 13c0 6.616 5.385 12 12 12 6.616 0 12-5.384 12-12 0-6.615-5.384-12-12-12h-1ZM7.395 7.008c-.293.043-.512.386-.317.691 1.464 2.297 3.964 6.171 4.508 6.715a2 2 0 1 0 2.828-2.828C13.87 11.04 9.996 8.542 7.7 7.078a.44.44 0 0 0-.304-.07Z"
        />
      </svg>
      <span className={s.time}>
        {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.mins}m
      </span>
    </div>
  );
}

export default Timer;
