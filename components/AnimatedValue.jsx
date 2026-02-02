"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

export default function AnimatedValue({ value, duration = 1500, decimals = 1 }) {
    const countRef = useRef(null);
    const prevValueRef = useRef(0);

    useEffect(() => {
        const target = { val: prevValueRef.current };

        animate(target, {
            val: value,
            round: Math.pow(10, decimals),
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            duration: duration,
            onRender: () => {
                if (countRef.current) {
                    countRef.current.innerHTML = target.val.toFixed(decimals);
                }
            },
        });

        prevValueRef.current = value;
    }, [value, duration, decimals]);

    return <span ref={countRef}>{prevValueRef.current.toFixed(decimals)}</span>;
}
