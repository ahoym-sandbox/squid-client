import { useState } from "react";
import "./App.css";
import logo from "./logo.svg";
import { xrplClient } from "./XrplApiSandbox";

// Can import and run TS scripts this way if so desired
// import './XrplApiSandbox/scripts/sendXrp';
// import './XrplApiSandbox/scripts/sendEscrow';

// wallet addresses
const bankWallet = "rUEqxgBLfgoqZWC8B94shLXUV8pUxhwrnX";
const oracleWallet = "rDDqrVxbVgyxkit5jEd84ndwi1YpxGqgL7";
var playerWallet: any;

// game state (=== escrow state)
var escrowCondition: string; // if defined you're in the game
var escrowFulfilment: string; // if defined, you won

// Generate testnet wallets
var walletCreated = xrplClient.generateFaucetWallet();

// send a payment
var paymentSent = walletCreated.then((result) => {
  console.log("wallet created");
  console.log(result);
  playerWallet = result?.account?.address;
  return xrplClient.sendPayment(1, bankWallet);
});

// listen for account sets
var transactionResceived = paymentSent.then((result) => {
  console.log("payment sent");
  console.log(result);
  return xrplClient.subscribeToAccountTransactions(
    {
      accounts: [oracleWallet],
    },
    (event: any) => {
      if ("AccountSet" === event["transaction"].TransactionType) {
        console.log("account set event received");
        console.log(event);
        decodeMemo(event["transaction"].Memos);
      }
      return Promise.resolve(event);
    }
  );
});

// listen for escrow creation
paymentSent.then((result) => {
  return xrplClient.subscribeToAccountTransactions(
    {
      accounts: [playerWallet],
    },
    (event: any) => {
      if ("EscrowCreate" === event["transaction"].TransactionType) {
        console.log("escrow create event received");
        console.log(event);
      }
      return Promise.resolve(event);
    }
  );
});

function App() {
  console.log("App called");
  const [logs, setLogs] = useState<unknown[]>([]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

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

        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

function decodeMemo(memo: any[]) {
  memo.forEach((m, idx) => {
    var hex = m.Memo.MemoData.toString();
    var str = "";
    for (var n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    if (idx == 1) {
      escrowCondition = str;
      console.log("you're in the squid game!");
    }
    if (idx == 2) {
      escrowFulfilment = str;
      console.log("you won the squid game!");

      // TODO execute the escrow
    }
  });
}

export default App;
