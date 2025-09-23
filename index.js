// // Open Payments Client Tutorial - Workshop
// // Goal make a peer to peer payment between two wallet addresses using test wallet

// // Open Payments Client => https://ilp.interledger-test.dev/interledger
// // Sender => https://ilp.interledger-test.dev/alma
// // Receiver => https://ilp.interledger-test.dev/erik

// import {
//   createAuthenticatedClient,
//   isFinalizedGrant,
// } from "@interledger/open-payments";
// import readline from "readline/promises";

// (async () => {
//   const client = await createAuthenticatedClient({
//     walletAddressUrl: "https://ilp.interledger-test.dev/euro",
//     privateKey: "private.key",
//     keyId: "7d5c873b-fc2c-4af7-b7f6-763b3619b331",
//   });

//   // 1. Fetch sender and receiver address
//   const senderWalletAddress = await client.walletAddress.get({
//     url: "https://ilp.interledger-test.dev/alma",
//   });

//   const receiverWalletAddress = await client.walletAddress.get({
//     url: "https://ilp.interledger-test.dev/erik",
//   });

//   console.log({ senderWalletAddress, receiverWalletAddress });

//   // 2. Get a grant for an incoming payment

//   const incomingPaymentGrant = await client.grant.request(
//     {
//       url: receiverWalletAddress.authServer,
//     },
//     {
//       access_token: {
//         access: [
//           {
//             type: "incoming-payment",
//             actions: ["create"],
//           },
//         ],
//       },
//     }
//   );

//   if (!isFinalizedGrant(incomingPaymentGrant)) {
//     throw new Error("Expected finalized grant");
//   }

//   console.log({ incomingPaymentGrant });
//   // 3. Create an incoming payment for the receiver

//   const incomingPayment = await client.incomingPayment.create(
//     {
//       url: receiverWalletAddress.resourceServer,
//       accessToken: incomingPaymentGrant.access_token.value,
//     },
//     {
//       walletAddress: receiverWalletAddress.id,
//       incomingAmount: {
//         assetCode: receiverWalletAddress.assetCode,
//         assetScale: receiverWalletAddress.assetScale,
//         value: "10000",
//       },
//     }
//   );

//   console.log({ incomingPayment });
//   // 4. Get a grant for a quote

//   const quoteGrant = await client.grant.request(
//     {
//       url: senderWalletAddress.authServer,
//     },
//     {
//       access_token: {
//         access: [{ type: "quote", actions: ["create"] }],
//       },
//     }
//   );

//   if (!isFinalizedGrant(quoteGrant)) {
//     throw new Error("Expected fnalized grant");
//   }

//   console.log({ quoteGrant });
//   // 5. Create a quote for the sender

//   const quote = await client.quote.create(
//     {
//       url: senderWalletAddress.resourceServer,
//       accessToken: quoteGrant.access_token.value,
//     },
//     {
//       walletAddress: senderWalletAddress.id,
//       receiver: incomingPayment.id,
//       method: "ilp",
//     }
//   );

//   console.log({ quote });
//   // 6. Get a grant for an outgoing payment

//   const outgoingPaymentGrant = await client.grant.request(
//     {
//       url: senderWalletAddress.authServer,
//     },
//     {
//       access_token: {
//         access: [
//           {
//             type: "outgoing-payment",
//             actions: ["create"],
//             limits: {
//               debitAmount: quote.debitAmount,
//             },
//             identifier: senderWalletAddress.id,
//           },
//         ],
//       },
//       interact: {
//         start: ["redirect"],
//       },
//     }
//   );

//   console.log({ outgoingPaymentGrant });
//   // 7. (Go through user interaction)

//   await readline
//     .createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     })
//     .question("Accept the grant and press enter...");
//   // 8. Continue outgoing payment grant

//   const finalizedOutgoingPaymentGrant = await client.grant.continue({
//     url: outgoingPaymentGrant.continue.uri,
//     accessToken: outgoingPaymentGrant.continue.access_token.value,
//   });

//   if (!isFinalizedGrant(finalizedOutgoingPaymentGrant)) {
//     throw new Error("Expected finalized grant");
//   }

//   console.log({ finalizedOutgoingPaymentGrant });
//   // 9. Create outgoing payment for sender

//   const outgoingPayment = await client.outgoingPayment.create(
//     {
//       url: senderWalletAddress.resourceServer,
//       accessToken: finalizedOutgoingPaymentGrant.access_token.value,
//     },
//     { walletAddress: senderWalletAddress.id, quoteId: quote.id }
//   );

//   console.log({ outgoingPayment });
// })();

// Configuracion inicial
import { createAuthenticatedClient } from "@interledger/open-payments";
import fs from "fs";
import { isFinalizedGrant } from "@interledger/open-payments";
import Readline from "readline/promises";

// Importar dependencias y configurar el cliente
(async () => {
  // const privateKey = fs.readFileSync("private.key", "utf8");
  // const client = await createAuthenticatedClient({
  //   walletAddressURL: "https://ilp.interledger-test.dev/hackathon123", // direccion de la billetera remitente
  //   privateKey,
  //   keyId: "4141c4f0-cabf-4370-a1e6-12547bce2764", // ID de la clave asociada
  // });
  const client = await createAuthenticatedClient({
    walletAddressUrl: "https://ilp.interledger-test.dev/euro",
    privateKey: "private.key",
    keyId: "7d5c873b-fc2c-4af7-b7f6-763b3619b331",
  });

  // 1. Obtener una concesion para un pago entrante (receiver)
  const sendingWalletAddress = await client.walletAddress.get({
    url: "https://ilp.interledger-test.dev/alma",
  });

  const receivingwalletAddress = await client.walletAddress.get({
    url: "https://ilp.interledger-test.dev/erik",
  });

  console.log(sendingWalletAddress, receivingwalletAddress);

  // 2. Obtener una concesion para un pago entrante = incoming payment
  const incomingPaymentGrant = await client.grant.request(
    {
      url: receivingwalletAddress.authServer,
    },
    {
      access_token: {
        access: [
          {
            type: "incoming-payment",
            actions: ["list", "read", "read-all", "complete", "create"],
          },
        ],
      },
    }
  );

  if (!isFinalizedGrant(incomingPaymentGrant)) {
    throw new Error("Se espera finalice la concesión");
  }
  console.log(incomingPaymentGrant);

  // 3. Crear un pago entrante para el receptor
  const incomingPayment = await client.incomingPayment.create(
    {
      url: receivingwalletAddress.resourceServer,
      accessToken: incomingPaymentGrant.access_token.value,
    },
    {
      walletAddress: receivingwalletAddress.id,
      incomingAmount: {
        assetCode: receivingwalletAddress.assetCode,
        assetScale: receivingwalletAddress.assetScale,
        value: "1000",
      },
    }
  );
  console.log({ incomingPayment });

  // 4. Crear un concesion para una cotizacion
  const quoteGrant = await client.grant.request(
    {
      url: sendingWalletAddress.authServer,
    },
    {
      access_token: {
        access: [
          {
            type: "quote",
            actions: ["create"],
          },
        ],
      },
    }
  );

  if (!isFinalizedGrant(quoteGrant)) {
    throw new Error("Se espera finalice la concesion");
  }

  console.log(quoteGrant);

  // 5. Obtener una cotizacion para el remitente
  const quote = await client.quote.create(
    {
      url: receivingwalletAddress.resourceServer,
      accessToken: quoteGrant.access_token.value,
    },
    {
      walletAddress: sendingWalletAddress.id,
      receiver: incomingPayment.id,
      method: "ilp",
    }
  );
  console.log({ quote });

  // 6. Obtener una concesion para un pago saliente
  const outgoingPaymentGrant = await client.grant.request(
    {
      url: sendingWalletAddress.authServer,
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
            identifier: sendingWalletAddress.id,
          },
        ],
      },
      interact: {
        start: ["redirect"],
      },
    }
  );

  console.log({ outgoingPaymentGrant });

  // 7. Continuar con la concision del pago saliente
  await Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  }).question("Presione Enter para continuar con el pago saliente..");

  // 8. Finalizar la concesion del pago saliente
  const finalizedOutgoingPaymentGrant = await client.grant.continue({
    url: outgoingPaymentGrant.continue.uri,
    accessToken: outgoingPaymentGrant.continue.access_token.value,
  });
  if (!isFinalizedGrant(finalizedOutgoingPaymentGrant)) {
    throw new Error("Se espera finalice la concesion");
  }
  // 9. Continuar con la cotizacion del pago saliente
  const outgoingPayment = await client.outgoingPayment.create(
    {
      url: sendingWalletAddress.resourceServer,
      accessToken: finalizedOutgoingPaymentGrant.access_token.value,
    },
    {
      walletAddress: sendingWalletAddress.id,
      quoteid: quote.id,
    }
  );
  console.log({ outgoingPayment });
})();
