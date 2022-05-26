import React from "react";

import {
  Routes as RouterRoutes,
  Route,
  Navigate,
} from "react-router-dom";

import ClaimPage from "./views/ClaimPage/ClaimPage";

function Routes() {
  return (
    <RouterRoutes>
      <Route path="/claim" element={<ClaimPage />} />
      <Route path="/" element={<Navigate to="/claim" />} />
    </RouterRoutes>
  );
}

export default Routes;
