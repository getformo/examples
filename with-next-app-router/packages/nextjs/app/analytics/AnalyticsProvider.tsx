"use client";

import React, { FC } from "react";
import { FormoAnalyticsProvider, FormoAnalyticsProviderProps } from "@formo/analytics";

// The provider component
export const AnalyticsProvider: FC<FormoAnalyticsProviderProps> = ({ writeKey, options, children, disabled }) => {
  return (
    <FormoAnalyticsProvider writeKey={writeKey} options={options} disabled={disabled}>
      {children}
    </FormoAnalyticsProvider>
  );
};

export default AnalyticsProvider;
