import { useState, useEffect, useCallback } from "react";
import "./App.css";
import logo from "./logo.svg";
import { Square } from "./shapes/Square";
import { Circle } from "./shapes/Circle";
import { Triangle } from "./shapes/Triangle";
import { xrplClient } from "./XrplApiSandbox";
import { Number } from "./shapes/Number";

// Can import and run TS scripts this way if so desired
// import './XrplApiSandbox/scripts/sendXrp';
// import './XrplApiSandbox/scripts/sendEscrow';

// wallet addresses
// const bankWallet = "rUEqxgBLfgoqZWC8B94shLXUV8pUxhwrnX";
// const oracleWallet = "rDDqrVxbVgyxkit5jEd84ndwi1YpxGqgL7";

const bankWallet = "rpMzbkZuxApNHJTAETbDB9e68b9XC9CY2C";
const oracleWallet = "rgbv6kNj77J9DTjZM39Q5xi1pzufv13g1";

// game state (=== escrow state)
var escrowCondition: string; // if defined you're in the game
var escrowFulfilment: string; // if defined, you won
var escrowOfferSequence: number; // necessary to finish the escrow

function App() {
  console.log("App called");
  const [logs, setLogs] = useState<unknown[]>([]);
  const [playerWallet, setPlayerWallet] = useState<any>(null);

  const finishEscrow = useCallback(() => {
    console.log("finishing escrow");
    console.log([
      bankWallet,
      escrowOfferSequence,
      escrowCondition,
      escrowFulfilment,
    ]);

    xrplClient
      .finishConditionalEscrow(
        bankWallet,
        playerWallet,
        escrowOfferSequence,
        escrowCondition,
        escrowFulfilment
      )
      .then((result) => console.log(result));
  }, [playerWallet]);

  console.log("playerwallet", playerWallet);

  const decodeMemo = useCallback(
    (memo: any[]) => {
      var addr: any;
      var condition: any;
      var fulfilment: any;
      var message: any;
      memo.forEach((m, idx) => {
        var hexValue = m.Memo.MemoData.toString();
        var value = "";
        for (let n = 0; n < hexValue.length; n += 2) {
          value += String.fromCharCode(parseInt(hexValue.substr(n, 2), 16));
        }

        var hexType = m.Memo.MemoType.toString();
        var type = "";
        for (let n = 0; n < hexType.length; n += 2) {
          type += String.fromCharCode(parseInt(hexType.substr(n, 2), 16));
        }
        if (type === "nft/0") {
          addr = value;
        }
        if (type === "nft/1") {
          condition = value;
        }
        if (type === "nft/2") {
          fulfilment = value;
        }
        if (type === "nft/3") {
          message = value;
        }
      });

      if (addr === playerWallet) {
        if (condition) {
          escrowCondition = condition;

          if (message) {
            console.log(message);
          } else {
            console.log("you're in the squid game!");
          }
        }
        if (fulfilment) {
          escrowFulfilment = fulfilment;
          console.log("you won the squid game!");
          finishEscrow();
        }
      }
    },
    [finishEscrow, playerWallet]
  );

  useEffect(() => {
    // Generate testnet wallets
    const walletCreated = xrplClient.generateFaucetWallet();

    // send a payment
    walletCreated.then((result) => {
      console.log("wallet created");
      console.log(result);
      setPlayerWallet(result?.account?.address);
    });
  }, []);

  useEffect(() => {
    if (playerWallet) {
      // send a payment
      console.log("sending payment");
      xrplClient.sendPayment(1, bankWallet);
    }
  }, [playerWallet]);

  useEffect(() => {
    if (playerWallet) {
      // listen for account sets

      console.log("listening for account sets");
      xrplClient.subscribeToAccountTransactions(
        {
          accounts: [oracleWallet],
        },
        (event: any) => {
          if ("AccountSet" === event["transaction"].TransactionType) {
            decodeMemo(event["transaction"].Memos);
          }
          return Promise.resolve(event);
        }
      );
    }
  }, [decodeMemo, playerWallet]);

  useEffect(() => {
    if (playerWallet) {
      // listen for escrow creation
      console.log("listening for escrow creation");
      xrplClient.subscribeToAccountTransactions(
        {
          accounts: [playerWallet],
        },
        (event: any) => {
          if ("EscrowCreate" === event["transaction"].TransactionType) {
            console.log("escrow create event received");
            console.log(event);
            escrowOfferSequence = event["transaction"].Sequence;
          }
          return Promise.resolve(event);
        }
      );
    }
  }, [playerWallet]);

  return (
    <div className="App">
      <div className="Squid">
        {playerWallet ? (
          <>
            <Number number={Math.floor(Math.random() * 10)} />
            <Number number={Math.floor(Math.random() * 10)} />
            <Number number={Math.floor(Math.random() * 10)} />
          </>
        ) : (
          <>
            <Number number={0} flip />
            <Number number={0} flip />
            <Number number={0} flip />
          </>
        )}

        <p className="wallet-address">{playerWallet}</p>
      </div>

      <div className="App-logs">
        {logs.map((log) => {
          if (typeof log === "string") {
            return (
              <p key={Math.random()} className="App-console-log">
                {log}
              </p>
            );
          } else if (typeof log === "object") {
            return (
              <div key={Math.random()}>
                <pre>{JSON.stringify(log, null, 2)}</pre>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default App;
