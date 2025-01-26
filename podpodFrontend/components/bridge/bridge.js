import React, { useState , useEffect} from "react";
import Web3 from "web3";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { useSuiClient, useCurrentAccount, ConnectButton } from "@mysten/dapp-kit";

const IBT_CONTRACT_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },

];


const IBT_CONTRACT_ADDRESS = "0x663F3ad617193148711d28f5334eE4Ed07016602";

const BridgeComponent = () => {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [suiStatus, setSuiStatus] = useState("");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [ethereumBalance, setEthIbtBalance] = useState(0);
  const [suiBalance, setSuiIbtBalance] = useState(0);

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
  
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
  
        console.log("Connected MetaMask account:", accounts[0]);
  
        // Ensure Web3 instance is passed to fetch the balance
        await fetchEthereumIbtBalance(accounts[0], web3Instance);
      } catch (error) {
        console.error("MetaMask connection failed:", error.message);
      }
    } else {
      alert("MetaMask not detected! Please install MetaMask.");
    }
  };
  
  const fetchEthereumIbtBalance = async (account, web3Instance) => {
    try {
      if (!web3Instance) {
        throw new Error("Web3 instance is not initialized.");
      }
  
      // Initialize the contract instance
      const contract = new web3Instance.eth.Contract(IBT_CONTRACT_ABI, IBT_CONTRACT_ADDRESS);
  
      console.log("Fetching Ethereum IBT balance for account:", account);
  
      // Call the balanceOf function
      const balance = await contract.methods.balanceOf(account).call();
  
      // Convert balance from Wei format to Ether format
      const formattedBalance = web3Instance.utils.fromWei(balance, "ether");
  
      console.log(`IBT Balance for ${account}:`, formattedBalance);
      setEthIbtBalance(formattedBalance);
    } catch (error) {
      console.error("Failed to fetch Ethereum IBT balance:", error.message);
    }
  };
  

  const fetchSuiIbtBalance = async () => {
    if (!currentAccount?.address) return;

    try {
      const balance = await suiClient.getBalance({
        owner: currentAccount.address,
        coinType: "0x3092401fd0b53660e9bc7bbdc8cb045808089bb5d81b74c598bbab40c65f9fe9::IBT::IBT",
      });
      setSuiIbtBalance((balance?.totalBalance || 0) / 1e6); // Convert from microIBT to IBT
    } catch (error) {
      console.error("Failed to fetch Sui IBT balance:", error);
    }
  };

  useEffect(() => {
    fetchSuiIbtBalance();
  }, [currentAccount]);

  const convertToSuiFormat = (amountInEther) => {
    const etherToSuiMultiplier = 1e6; // 10^(6)
    return Math.floor(amountInEther * etherToSuiMultiplier);
  };

  const mintOnSui = async (formattedAmount) => {
    try {
      if (!suiClient || !currentAccount?.address) {
        alert("Sui client or account not available.");
        return;
      }

      setSuiStatus("Minting on Sui...");
      const senderAddress = currentAccount.address;
      const mnemonic = "move awesome warrior strategy noodle sugar deposit help float possible core buffalo"; // Replace with your mnemonic
      const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

      const tx = new Transaction();
      tx.moveCall({
        target: "0x3092401fd0b53660e9bc7bbdc8cb045808089bb5d81b74c598bbab40c65f9fe9::IBT::mint",
        arguments: [
          tx.object("0xfca9c8b2efdcfca97cf7f6bce4528d65303312618664504b6519a2823355772c"),
          tx.pure.u64(formattedAmount),
          tx.pure.address(senderAddress),
        ],
      });

      const result = await suiClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
      });

      console.log("Minted on Sui:", result);
      setSuiStatus(`Successfully minted ${(formattedAmount / 1e6).toFixed(6)} tokens on Sui`);
    } catch (error) {
      console.error("Error minting on Sui:", error);
      setSuiStatus("Failed to mint tokens on Sui");
    }
  };
  const mintOnEthereum = async (amountInEther) => {
    try {
      if (!web3 || !account) {
        alert("Please connect MetaMask first.");
        return;
      }

      setStatus("Minting on Ethereum...");
      const contract = new web3.eth.Contract(IBT_CONTRACT_ABI, IBT_CONTRACT_ADDRESS);

      await contract.methods.mint(account, web3.utils.toWei(amountInEther.toString(), "ether")).send({
        from: account,
        gas: 100000,
        gasPrice: web3.utils.toWei("20", "gwei"),
      });

      console.log(`Minted ${amountInEther} tokens on Ethereum.`);
      setStatus(`Successfully minted ${amountInEther} tokens on Ethereum.`);
    } catch (error) {
      console.error("Error minting on Ethereum:", error);
      setStatus("Failed to mint tokens on Ethereum.");
    }
  };

  const handleTransferToEthereum = async () => {
    if (!amount) {
      alert("Please set an amount and try again.");
      return;
    }

    console.log("Initiating burn on Sui and mint on Ethereum...");
  const burnAmount = Number(amount);

  await handleDeployerDirectBurn(burnAmount);

  await mintOnEthereum((burnAmount));
  };

  const handleTransferToSui = async () => {
    if (!web3 || !account || !amount) {
      alert("Please connect MetaMask, set an amount, and try again.");
      return;
    }

    try {
      const contract = new web3.eth.Contract(IBT_CONTRACT_ABI, IBT_CONTRACT_ADDRESS);

      const amountInWei = web3.utils.toWei(amount.toString(), "ether");
      console.log(`Burning ${amount} tokens (${amountInWei} in Wei) from ${account}...`);

      await contract.methods.burn(account, amountInWei).send({
        from: account,
        gas: 100000,
        gasPrice: web3.utils.toWei("20", "gwei"),
      });

      const formattedAmount = convertToSuiFormat(Number(amount));
      console.log(`Minting ${formattedAmount / 1e6} tokens on Sui...`);

      await mintOnSui(formattedAmount);
      setStatus("Burn and mint completed successfully.");
    } catch (error) {
      console.error("Failed to execute transfer:", error);
      setStatus("Burn failed.");
    }
  };
  const handleDeployerDirectBurn = async (burnAmount) => {
    console.log("USER BURNING IS DEPLOYER!");
    const mnemonic = "move awesome warrior strategy noodle sugar deposit help float possible core buffalo"; // Replace with your mnemonic
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  
    try {
      const coinType = "0x3092401fd0b53660e9bc7bbdc8cb045808089bb5d81b74c598bbab40c65f9fe9::IBT::IBT";
      console.log("Checking balance for coin type:", coinType);
      const burnAmountInSui = Math.floor(burnAmount * 1e6); 
      console.log(`Burn Amount in Sui Format: ${burnAmountInSui}`);
  
      const balance = await suiClient.getBalance({
        owner: currentAccount.address,
        coinType,
      });
  
      console.log("Deployer Address:", currentAccount.address);
      console.log("Deployer Balance:", balance?.totalBalance || 0);
  
      if (!balance || balance.totalBalance < burnAmountInSui) {
        throw new Error(
          `Insufficient balance to burn. Current balance: ${balance?.totalBalance || 0}`
        );
      }
  
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType,
      });
  
      console.log("COINS LIST:", coins.data);
  
      let burnCoin = coins.data.find((c) => Number(c.balance) === burnAmountInSui);
      if (!burnCoin) {
        burnCoin = coins.data.find((c) => Number(c.balance) > burnAmountInSui);
      }
  
      if (!burnCoin) {
        console.log("Merging coins to meet the burn amount...");
        let totalBalance = 0;
        let coinsToMerge = [];
  
        for (const coin of coins.data) {
          totalBalance += Number(coin.balance);
          coinsToMerge.push(coin);
          if (totalBalance >= burnAmountInSui) break;
        }
  
        if (totalBalance < burnAmountInSui) {
          throw new Error(
            `Insufficient total balance even after merging. Total balance: ${totalBalance}, Burn amount: ${burnAmountInSui}`
          );
        }
  
        const mergeTx = new Transaction();
        mergeTx.mergeCoins(
          mergeTx.object(coinsToMerge[0].coinObjectId),
          coinsToMerge.slice(1).map((coin) => mergeTx.object(coin.coinObjectId))
        );
  
        const mergeResult = await suiClient.signAndExecuteTransaction({
          signer: keypair,
          transaction: mergeTx,
        });
  
        console.log("MERGE RESULT", mergeResult);
  
        burnCoin = {
          coinObjectId: mergeResult.effects.mutated[0].reference.objectId, 
          balance: burnAmountInSui,
        };
      }
  
      if (Number(burnCoin.balance) > burnAmountInSui) {
        console.log("Splitting coin to match the burn amount...");
        const splitTx = new Transaction();
  
        if (!burnCoin.coinObjectId) {
          throw new Error("Invalid coin object structure: Missing coinObjectId.");
        }
  
        const [coinToBurn, remainingCoin] = splitTx.splitCoins(
          splitTx.object(burnCoin.coinObjectId), 
          [splitTx.pure.u64(burnAmountInSui)] 
        );
  
        splitTx.transferObjects([remainingCoin], splitTx.pure.address(currentAccount.address));
  
        const splitResult = await suiClient.signAndExecuteTransaction({
          signer: keypair,
          transaction: splitTx,
        });
  
        console.log("SPLIT RESULT:", splitResult);
  
        burnCoin = { coinObjectId: splitResult.effects.created[0].reference.objectId };
      }
      if (!burnCoin || !burnCoin.coinObjectId) {
        throw new Error("Unable to find or split a coin for burning.");
      }
  
      console.log("Burning coin:", burnCoin.coinObjectId);
  
      const burnTx = new Transaction();
      burnTx.moveCall({
        target: "0x3092401fd0b53660e9bc7bbdc8cb045808089bb5d81b74c598bbab40c65f9fe9::IBT::burn",
        arguments: [
          burnTx.object("0xfca9c8b2efdcfca97cf7f6bce4528d65303312618664504b6519a2823355772c"), 
          burnTx.object(burnCoin.coinObjectId),
        ],
      });
  
      const burnResult = await suiClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: burnTx,
      });
  
      console.log("BURN RESULT", burnResult);
      setSuiStatus("Burn successful!");
    } catch (error) {
      console.error("Error during deployer direct burn:", error.message);
      setSuiStatus(`Failed to burn tokens: ${error.message}`);
    }
  };
  
  
  
  return (
     <div className="bridge-container">
      {/* Wallet connect button on the left */}
      <div className="wallet-section wallet-left">
        <ConnectButton />
        <div className="wallet-balance">IBT Balance: {suiBalance} IBT</div>
      </div>

      {/* Wallet connect button on the right */}
      <div className="wallet-section wallet-right">
        <button className="wallet-connect-btn" onClick={connectMetaMask}>
          Connect MetaMask
        </button>
        <div className="wallet-balance">IBT Balance: {ethereumBalance} IBT</div>
      </div>

      {/* Main App Container */}
      <div className="bridge-app">
        <h1 className="app-title">Bridge between Ethereum and Sui</h1>
        <div className="amount-input-container">
          <label className="amount-label">Amount</label>
          <input
            className="amount-input"
            type="number"
            placeholder="0"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button className="transfer-btn" onClick={handleTransferToSui}>
          Burn on Ethereum & Mint on Sui
        </button>
        <button className="transfer-btn" onClick={handleTransferToEthereum}>
          Burn on Sui & Mint on Ethereum
        </button>
        <div className="status-container">
          <p className="status-message">{status}</p>
          <p className="status-message">{suiStatus}</p>
        </div>
      </div>
    </div>
  );
};

export default BridgeComponent;
