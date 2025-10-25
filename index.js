// Open Payments Client Tutorial - Workshop
// Goal make a peer to peer payment between two wallet addresses using test wallet

import {
  createAuthenticatedClient,
  isFinalizedGrant,
} from "@interledger/open-payments";
import { read } from "fs";
import readline from "readline/promises";

(async () => {
  const client = await createAuthenticatedClient({
    walletAddressUrl: "PASTE YOUR CLIENT WA",
    privateKey: "private.key",
    keyId: "PASTE YOUR KEYID",
  });

  // 1. Fetch sender and receiver address
  const senderWA = await client.walletAddress.get({
    url: "PASTE YOUR SENDER WA",
  });

  const receiverWA = await client.walletAddress.get({
    url: "PASTE YOUR RECEIVER WA",
  });

  console.log({ senderWA, receiverWA });
  // 2. Get a grant for an incoming payment

  const incomingPaymentGrant = await client.grant.request(
    {
      url: receiverWA.authServer,
    },
    {
      access_token: {
        access: [{ type: "incoming-payment", actions: ["create"] }],
      },
    }
  );

  if (!isFinalizedGrant(incomingPaymentGrant)) {
    throw new Error("Expected finalized grant");
  }

  console.log({ incomingPaymentGrant });
  // 3. Create an incoming payment for the receiver

  const incominPayment = await client.incomingPayment.create(
    {
      url: receiverWA.resourceServer,
      accessToken: incomingPaymentGrant.access_token.value,
    },
    {
      walletAddress: receiverWA.id,
      incomingAmount: {
        value: "10000",
        assetCode: receiverWA.assetCode,
        assetScale: receiverWA.assetScale,
      },
    }
  );

  console.log({ incominPayment });
  // 4. Get a grant for a quote

  const quoteGrant = await client.grant.request(
    {
      url: senderWA.authServer,
    },
    {
      access_token: {
        access: [{ type: "quote", actions: ["create"] }],
      },
    }
  );

  if (!isFinalizedGrant(quoteGrant)) {
    throw new Error("Expected finalized grant");
  }

  console.log({ quoteGrant });
  // 5. Create a quote for the sender

  const quote = await client.quote.create(
    {
      url: senderWA.resourceServer,
      accessToken: quoteGrant.access_token.value,
    },
    {
      walletAddress: senderWA.id,
      receiver: incominPayment.id,
      method: "ilp",
    }
  );

  console.log({ quote });
  // 6. Get a grant for an outgoing payment

  const outgoingPaymentGrant = await client.grant.request(
    {
      url: senderWA.authServer,
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
            identifier: senderWA.id,
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
    .createInterface({ input: process.stdin, output: process.stdout })
    .question("Accept my click on idp");
  // 8. Continue outgoing payment grant

  const finalizeGrant = await client.grant.continue({
    url: outgoingPaymentGrant.continue.uri,
    accessToken: outgoingPaymentGrant.continue.access_token.value,
  });

  if (!isFinalizedGrant(finalizeGrant)) {
    throw new Error("Expected finalized grant");
  }
  console.log({ finalizeGrant });
  // 9. Create outgoing payment for sender

  const outgoingPayment = await client.outgoingPayment.create(
    {
      url: senderWA.resourceServer,
      accessToken: finalizeGrant.access_token.value,
    },
    {
      walletAddress: senderWA.id,
      quoteId: quote.id,
    }
  );

  console.log({ outgoingPayment });
})();
