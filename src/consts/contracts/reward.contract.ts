export const REWARD_CONTRACT_INFO = {
    address: "0xb2d1AbA1931E06D9EF9aF440e6b1a3E7499fbaFC",
    abi: [
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_tokenContract",
              "type": "address"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "user",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "rewardAmount",
              "type": "uint256"
            }
          ],
          "name": "RewardDistributed",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "user",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokenAmount",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "paymentAmount",
              "type": "uint256"
            }
          ],
          "name": "TokensPurchased",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "tokenAmount",
              "type": "uint256"
            }
          ],
          "name": "buyTokensWithNativeCurrency",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "tokenAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "paymentTokenAmount",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "paymentTokenAddress",
              "type": "address"
            }
          ],
          "name": "buyTokensWithOtherTokens",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "user",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "distributeReward",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "tokenContract",
          "outputs": [
            {
              "internalType": "contract IERC20",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ]
}