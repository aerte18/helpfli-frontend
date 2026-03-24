import React from "react";
import Navbar from "../components/Navbar";
import NearbyProviders from "../components/NearbyProviders";

const NearbyProvidersPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1">
        <NearbyProviders />
      </div>
    </div>
  );
};

export default NearbyProvidersPage;