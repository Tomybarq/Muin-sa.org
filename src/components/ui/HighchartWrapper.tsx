"use client";

import React, { useEffect, useRef } from "react";
import Highcharts from "highcharts";

// Enable highcharts-more for Polar / Radar charts if window/Highcharts exists
if (typeof window !== "undefined") {
  try {
    const highchartsMore = require("highcharts/highcharts-more");
    if (typeof highchartsMore === "function") {
      highchartsMore(Highcharts);
    }
  } catch (e) {
    console.warn("Highcharts-more load error", e);
  }
}

interface HighchartWrapperProps {
  options: Highcharts.Options;
  className?: string;
}

export default function HighchartWrapper({ options, className = "h-full w-full" }: HighchartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const mergedOptions: Highcharts.Options = {
        accessibility: { enabled: false },
        ...options,
      };
      chartInstanceRef.current = Highcharts.chart(containerRef.current, mergedOptions);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [options]);

  return <div ref={containerRef} className={className} />;
}
