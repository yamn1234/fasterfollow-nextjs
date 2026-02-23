"use client";
import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OverviewTab from "@/components/dashboard/OverviewTab";
import NewOrderTab from "@/components/dashboard/NewOrderTab";
import OrdersTab from "@/components/dashboard/OrdersTab";
import TransactionsTab from "@/components/dashboard/TransactionsTab";
import BalanceTab from "@/components/dashboard/BalanceTab";
import SupportTab from "@/components/dashboard/SupportTab";
import RedeemCouponTab from "@/components/dashboard/RedeemCouponTab";
import ProfileTab from "@/components/dashboard/ProfileTab";
import SettingsTab from "@/components/dashboard/SettingsTab";
import DashboardNavigation from "@/components/dashboard/DashboardNavigation";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import SEOHead from "@/components/SEOHead";

export type TabType = "overview" | "new-order" | "orders" | "transactions" | "balance" | "coupon" | "support" | "profile" | "settings";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab onNavigate={(tab) => setActiveTab(tab as TabType)} />;
      case "new-order":
        return <NewOrderTab />;
      case "orders":
        return <OrdersTab />;
      case "transactions":
        return <TransactionsTab />;
      case "balance":
        return <BalanceTab />;
      case "coupon":
        return <RedeemCouponTab />;
      case "support":
        return <SupportTab />;
      case "profile":
        return <ProfileTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <SEOHead
        title="لوحة التحكم"
        description="لوحة تحكم فاستر فولو - أدر طلباتك ورصيدك وحسابك"
        canonicalUrl="/dashboard"
        noIndex
      />
      <DashboardHeader onGoHome={() => setActiveTab("overview")} onNavigate={(tab) => setActiveTab(tab as TabType)} />
      <DashboardNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-3 md:p-6 overflow-auto pb-20 md:pb-6">
        {renderContent()}
      </main>
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Dashboard;
