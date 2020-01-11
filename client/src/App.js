import React, { Component } from "react";
import BankContract from "./contracts/bank.json";
import NFTContract from "./contracts/NFToken.json";
import ERC721Contract from "./contracts/ERC721.json";
import getWeb3 from "./getWeb3";

import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';

import "./App.css";

import Card from './components/Card'

class App extends Component {
  state = {
    tokenId: 0,
    web3: null,
    accounts: null,
    contract: null,
    bankBalance: 0,
    ownerBalance: 0
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = BankContract.networks[networkId];
      const NFTdeployedNetwork = NFTContract.networks[networkId];
    
      const BankInstance = new web3.eth.Contract(
        BankContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      const NFTInstance = new web3.eth.Contract(
        NFTContract.abi,
        NFTdeployedNetwork && NFTdeployedNetwork.address,
      );
      const ERC721Instance = new web3.eth.Contract(
        ERC721Contract.abi,
        NFTdeployedNetwork && NFTdeployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      const newState = { web3, accounts, BankInstance, ERC721Instance, NFTInstance }
      console.log(newState)
      this.setState(newState);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  getNftBalanceOf = async (address) => {
    const { ERC721Instance } = this.state
    let result = null;
    try {
      result = await ERC721Instance.methods.balanceOf(address).call()
      console.log({address, balanceOf: result})
    } catch (error) {
      console.log(error)
    }
    return result
  }
  
  handleTokenIdInput = (event) => {
    this.setState({ tokenId: Number(event.target.value)})
  }

  mintTokenTransfer = async () => {
    const { NFTInstance, accounts, tokenId } = this.state
    const owner = accounts[0]
    try {
      const mintResponse = await NFTInstance.methods.mintToken(owner, tokenId).send({ from: owner, gas: 5000000 })
      console.log({mintResponse})
      // const safeTransferResponse = await ERC721Instance.methods.safeTransferFrom(owner, BankInstance._address, tokenId).send({ from: owner, gas: 5000000 })
      // console.log({safeTransferResponse})
    } catch (error) {
      console.log(error)
    }
    this.updateTokenCount()
  }

  checkBank = async () => {
    const { ERC721Instance, BankInstance, accounts, tokenId } = this.state
    const owner = accounts[0]
    try {
      const beforeSafeTransfer = await BankInstance.methods._tokenOwner(ERC721Instance._address, tokenId).call({ from: owner, gas: 5000000 })
      console.log({beforeSafeTransfer})
      const bankResponse = await BankInstance.methods.safeTransferFrom(ERC721Instance._address, owner, owner, tokenId, '0x0a').send({ from: owner, gas: 5000000 })
      console.log({bankResponse})
      const afterSafeTransfer = await BankInstance.methods._tokenOwner(ERC721Instance._address, tokenId).call({ from: owner, gas: 5000000 })
      console.log({afterSafeTransfer})
      // const response = await BankInstance.methods._tokenOwner(ERC721Instance._address, Number(tokenId)).call({ from: owner, gas: 5000000 })
      // console.log(response)
    } catch (error) {
      console.log(error)
    }
  }

  withdraw = async () => {
    const { ERC721Instance, BankInstance, accounts, tokenId } = this.state
    const owner = accounts[0]
    const bankResponse = await BankInstance.methods.safeTransferFrom(ERC721Instance._address, owner, owner, tokenId, '0x0a').send({ from: owner, gas: 5000000 })
    console.log({bankResponse})

    this.updateTokenCount()
  }

  deposit = async () => {
    const { ERC721Instance, BankInstance, accounts, tokenId } = this.state
    const owner = accounts[0]
    const safeTransferResponse = await ERC721Instance.methods.safeTransferFrom(owner, BankInstance._address, tokenId).send({ from: owner, gas: 5000000 })
    console.log({safeTransferResponse})

    this.updateTokenCount()
  }

  updateTokenCount = async () => {
    const { BankInstance, accounts } = this.state
    const owner = accounts[0]
    const bankBalance = await this.getNftBalanceOf(BankInstance._address)
    const ownerBalance = await this.getNftBalanceOf(owner)
    console.log({bankBalance, ownerBalance})
    this.setState({bankBalance, ownerBalance})
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    const AccountCardProps = {
      title: 'Personal Wallet',
      address: this.state.accounts[0],
      balance: this.state.ownerBalance
    }
    const NFTCardProps = {
      title: 'NFT Contract',
      address: this.state.NFTInstance._address,
      actions: [
        {
          value: 'Mint token',
          onClick: this.mintTokenTransfer
        }
      ]
    }
    const bankCardProps = {
      title: 'Bank Contract',
      address: this.state.BankInstance._address,
      balance: this.state.bankBalance,
      actions: [
        {
          value: 'Deposit',
          onClick: this.deposit
        },
        {
          value: 'Withdraw',
          onClick: this.withdraw
        }
      ]
    }
    return (
      <div className="App">
        <h2>MVP Banking</h2>
        <p>
          Try changing the Token ID {this.state.tokenId} (number) and click mint, see Personal balance +1.
        </p>
        <p>
          Keep the same Token ID {this.state.tokenId} and click Deposit to deposit this NFT token on Bank contract.
        </p>
        <p>
          Last, click Withdraw to transfer NFT token {this.state.tokenId} from Bank contract to Personal wallet
        </p>
        <TextField
          id="filled-full-width"
          label="Token ID"
          style={{ margin: 8 }}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          variant="filled"
          onChange={this.handleTokenIdInput}
          value={this.state.tokenId}
        />
        <Grid container justify="center" spacing={2}>
          <Grid item>
            <Card {...AccountCardProps}/>
          </Grid>
          <Grid item>
            <Card {...NFTCardProps}/>
          </Grid>
          <Grid item>
            <Card {...bankCardProps}/>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default App;
