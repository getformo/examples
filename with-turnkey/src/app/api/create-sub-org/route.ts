import { NextRequest, NextResponse } from "next/server";
import { Turnkey } from "@turnkey/sdk-server";

const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
const defaultOrganizationId = process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID;

if (!apiPrivateKey || !apiPublicKey || !defaultOrganizationId) {
  throw new Error(
    "Missing required Turnkey server environment variables (TURNKEY_API_PRIVATE_KEY, TURNKEY_API_PUBLIC_KEY, NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID). Please check your .env file."
  );
}

const turnkeyServer = new Turnkey({
  apiBaseUrl: "https://api.turnkey.com",
  apiPrivateKey,
  apiPublicKey,
  defaultOrganizationId,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, challenge, attestation } = body;

    if (!email || !challenge || !attestation) {
      return NextResponse.json(
        { error: "Missing required fields: email, challenge, attestation" },
        { status: 400 }
      );
    }

    const apiClient = turnkeyServer.apiClient();

    const result = await apiClient.createSubOrganization({
      subOrganizationName: `Sub-Org ${Date.now()}`,
      rootUsers: [
        {
          userName: email,
          userEmail: email,
          authenticators: [
            {
              authenticatorName: "Passkey",
              challenge,
              attestation,
            },
          ],
          oauthProviders: [],
          apiKeys: [],
        },
      ],
      rootQuorumThreshold: 1,
      wallet: {
        walletName: "Default Wallet",
        accounts: [
          {
            curve: "CURVE_SECP256K1",
            pathFormat: "PATH_FORMAT_BIP32",
            path: "m/44'/60'/0'/0/0",
            addressFormat: "ADDRESS_FORMAT_ETHEREUM",
          },
        ],
      },
    });

    return NextResponse.json({
      subOrganizationId: result.subOrganizationId,
      walletId: result.wallet?.walletId,
    });
  } catch (error) {
    console.error("Failed to create sub-organization:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create sub-organization",
      },
      { status: 500 }
    );
  }
}
