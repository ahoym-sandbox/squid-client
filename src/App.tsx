import { decode } from "querystring";
import { useEffect, useState } from "react";
import "./App.css";
import logo from "./logo.svg";
import { xrplClient } from "./XrplApiSandbox";

// Can import and run TS scripts this way if so desired
// import './XrplApiSandbox/scripts/sendXrp';
// import './XrplApiSandbox/scripts/sendEscrow';

const bankWallet = "r9p1bSBqgBF96GAexQhDqcwmnPjVF43ji7";
const oracleWallet = "r9p1bSBqgBF96GAexQhDqcwmnPjVF43ji7";

// Generate testnet wallets
var walletCreated = xrplClient.generateFaucetWallet();

var playerWallet;

// send a payment
var paymentSent = walletCreated.then((result) => {
  console.log("wallet created");
  console.log(result);
  playerWallet = result?.account;
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

function App() {
  console.log("App called");
  const [logs, setLogs] = useState<unknown[]>([]);

  // useEffect(() => {
  //   walletCreated.then((result) => {
  //     setLogs((logState) => [
  //       result,
  //       "Created faucet wallet for Client",
  //       ...logState,
  //     ]);
  //   });
  // }, []);

  // useEffect(() => {
  //   walletCreated.then(() => {
  //     xrplClient
  //       .sendPayment(1, bankWallet)
  //       .then((result) =>
  //         setLogs((logState) => [result, "Sent 1 XRP to bank", ...logState])
  //       );
  //   });
  // }, []);

  // useEffect(() => {
  //   transactionResceived.then((event: any) => {
  //     if (event) {
  //       if ("AccountSet" === event["transaction"].TransactionType) {
  //         setLogs((logState) => [
  //           event,
  //           "This is an account set event",
  //           ...logState,
  //         ]);
  //       }
  //     }
  //   });
  // }, []);

  // useEffect(() => {
  //   txSubscription.then((result) => {
  //     setLogs((logState) => [
  //       result,
  //       "Received transaction event",
  //       ...logState,
  //     ]);
  //   });
  // });

  // useEffect(() => {
  //   generateWalletRequestTwo.then((result) => {
  //     setLogs((logState) => [
  //       result,
  //       'Created faucet wallet for Client 2',
  //       ...logState,
  //     ]);
  //   });
  // }, []);

  // useEffect(() => {
  //   // After testnet wallet creations, send a 22 XRP payment
  //   Promise.all([generateWalletRequestOne, generateWalletRequestTwo])
  //     .then(() =>
  //       xrplClient.sendPayment(22, xrplClientTwo.wallet()?.account.address!)
  //     )
  //     .then((result) => {
  //       setLogs((logState) => [
  //         result,
  //         'Sent transaction from Wallet 1 to Wallet 2',
  //         ...logState,
  //       ]);
  //     });
  // }, []);

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
  console.log(hex_to_ascii(memo[0].Memo.MemoData));
  console.log(hex_to_ascii(memo[1].Memo.MemoData));
  console.log(hex_to_ascii(memo[2].Memo.MemoData));
  console.log(hex_to_ascii(memo[3].Memo.MemoData));
}

function hex_to_ascii(input: any) {
  var hex = input.toString();
  var str = "";
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
export default App;
