// Open Payments Client Tutorial - Workshop
// Goal make a peer to peer payment between two wallet addresses using test wallet

// Open Payments Client => YOUR CLIENT WA
// Sender => YOUR SENDER WA
// Receiver => YOUR RECEIVER WA

import {
  createAuthenticatedClient,
  isFinalizedGrant,
} from "@interledger/open-payments";
import readline from "readline/promises";

(async () => {
  const client = await createAuthenticatedClient({
    walletAddressUrl: "", //CLIENT WAS,
    privateKey: "private.key", //CREATE PRIVATE KEY,
    keyId: "", //PUT KEY ID,
  });

  // 1. Fetch sender and receiver address
  const senderWalletAddress = await client.walletAddress.get({
    url: "", //SENDERWA,
  });

  const receiverWalletAddress = await client.walletAddress.get({
    url: "", //RECEIVER WA,
  });

  console.log({ senderWalletAddress, receiverWalletAddress });

  // 2. Get a grant for an incoming payment

  const incomingPaymentGrant = await client.grant.request(
    {
      url: receiverWalletAddress.authServer,
    },
    {
      access_token: {
        access: [
          {
            type: "incoming-payment",
            actions: ["create"],
          },
        ],
      },
    }
  );

  if (!isFinalizedGrant(incomingPaymentGrant)) {
    throw new Error("Expected finalized grant");
  }

  console.log({ incomingPaymentGrant });
  // 3. Create an incoming payment for the receiver

  const incomingPayment = await client.incomingPayment.create(
    {
      url: receiverWalletAddress.resourceServer,
      accessToken: incomingPaymentGrant.access_token.value,
    },
    {
      walletAddress: receiverWalletAddress.id,
      incomingAmount: {
        assetCode: receiverWalletAddress.assetCode,
        assetScale: receiverWalletAddress.assetScale,
        value: "10000",
      },
    }
  );

  console.log({ incomingPayment });
  // 4. Get a grant for a quote

  const quoteGrant = await client.grant.request(
    {
      url: senderWalletAddress.authServer,
    },
    {
      access_token: {
        access: [{ type: "quote", actions: ["create"] }],
      },
    }
  );

  if (!isFinalizedGrant(quoteGrant)) {
    throw new Error("Expected fnalized grant");
  }

  console.log({ quoteGrant });
  // 5. Create a quote for the sender

  const quote = await client.quote.create(
    {
      url: senderWalletAddress.resourceServer,
      accessToken: quoteGrant.access_token.value,
    },
    {
      walletAddress: senderWalletAddress.id,
      receiver: incomingPayment.id,
      method: "ilp",
    }
  );

  console.log({ quote });
  // 6. Get a grant for an outgoing payment

  const outgoingPaymentGrant = await client.grant.request(
    {
      url: senderWalletAddress.authServer,
    },
    {
      access_token: {
        access: [
          {
            type: "outgoing-payment",
            actions: ["create"],
            limits: {
              debitAmount: quote.debitAmount,
            },
            identifier: senderWalletAddress.id,
          },
        ],
      },
      interact: {
        start: ["redirect"],
      },
    }
  );

  console.log({ outgoingPaymentGrant });
  // 7. (Go through user interaction)

  await readline
    .createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    .question("Accept the grant and press enter...");
  // 8. Continue outgoing payment grant

  const finalizedOutgoingPaymentGrant = await client.grant.continue({
    url: outgoingPaymentGrant.continue.uri,
    accessToken: outgoingPaymentGrant.continue.access_token.value,
  });

  if (!isFinalizedGrant(finalizedOutgoingPaymentGrant)) {
    throw new Error("Expected finalized grant");
  }

  console.log({ finalizedOutgoingPaymentGrant });
  // 9. Create outgoing payment for sender

  const outgoingPayment = await client.outgoingPayment.create(
    {
      url: senderWalletAddress.resourceServer,
      accessToken: finalizedOutgoingPaymentGrant.access_token.value,
    },
    { walletAddress: senderWalletAddress.id, quoteId: quote.id }
  );

  console.log({ outgoingPayment });
})();
