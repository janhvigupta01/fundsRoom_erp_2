import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { LoginScreen } from "./components/LoginScreen";
import { InventoryScreen } from "./components/InventoryScreen";
import { WorkOrdersScreen } from "./components/WorkOrdersScreen";
import { TransfersScreen } from "./components/TransfersScreen";
import { CustomerOrdersScreen } from "./components/CustomerOrdersScreen";
import { ConcurrencyLabScreen } from "./components/ConcurrencyLabScreen";
import { AuditTrailModal } from "./components/AuditTrailModal";

export const App = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [prefilledTransfer, setPrefilledTransfer] = useState(null);

  // If user is not authenticated, render Login Screen
  if (!user) {
    return <LoginScreen />;
  }

  // Cross-screen integration: Work order shortage triggers transfer screen
  const handleInitiateTransferFromWO = (transferData) => {
    setPrefilledTransfer(transferData);
    setActiveTab("transfers");
  };

  return (
    <div className="app-container">
      {/* Top Navbar with Royal Blue & White Branding & Role Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAudit={() => setShowAuditModal(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === "inventory" && <InventoryScreen />}
        {activeTab === "work-orders" && (
          <WorkOrdersScreen onInitiateTransfer={handleInitiateTransferFromWO} />
        )}
        {activeTab === "transfers" && (
          <TransfersScreen
            prefilledTransfer={prefilledTransfer}
            onClearPrefill={() => setPrefilledTransfer(null)}
          />
        )}
        {activeTab === "orders" && <CustomerOrdersScreen />}
        {activeTab === "concurrency" && <ConcurrencyLabScreen />}
      </main>

      {/* Audit Log Modal */}
      <AuditTrailModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
};

export default App;
