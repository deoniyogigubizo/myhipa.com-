import { NextResponse } from "next/server";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

const platformSettings = {
  general: {
    platformName: "myHipa",
    tagline: "Rwanda's Premier E-commerce Marketplace",
    defaultCurrency: "RWF",
    supportedCurrencies: ["RWF", "USD", "KES", "UGX"],
    defaultLanguage: "en",
    supportedLanguages: ["en", "rw", "fr"],
    timezone: "Africa/Kigali",
    supportedCountries: ["RW", "KE", "UG", "TZ", "NG", "GH"],
  },
  escrow: {
    disputeWindowDays: 3,
    autoReleaseEnabled: true,
    minimumEscrowAmount: 1000,
  },
  commissions: {
    standardRate: 3,
    silverRate: 2.5,
    goldRate: 2,
    proRate: 1.5,
  },
  shipping: {
    defaultCarrier: "DHL",
    freeShippingThreshold: 50000,
  },
  security: {
    twoFactorRequired: false,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
  },
  maintenance: {
    enabled: false,
    message: "",
    scheduledAt: null,
  },
};

async function getSettings(request: AuthenticatedRequest) {
  return NextResponse.json({
    success: true,
    data: platformSettings,
  });
}

async function updateSettings(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    // In production, persist to a settings collection or env
    Object.assign(platformSettings, body);
    return NextResponse.json({
      success: true,
      message: "Settings updated",
      data: platformSettings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getSettings);
export const PUT = withSuperAdminAuth(updateSettings);
