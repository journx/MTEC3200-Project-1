"use client";

import { useState } from "react";
import Dashboard from "@/components/dashboard";
import WelcomeScreen from "@/components/welcome-screen";

export default function AppEntry() {
  const [hasEnteredPlanner, setHasEnteredPlanner] = useState(false);

  if (hasEnteredPlanner) {
    return <Dashboard />;
  }

  return <WelcomeScreen onContinue={() => setHasEnteredPlanner(true)} />;
}
