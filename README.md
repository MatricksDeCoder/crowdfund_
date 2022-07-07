# Crowdfundr

### Introduction

Allows creators to register new projects for crowdfunding. Individuals can contribute a minimum of 0.01 ETH with no upper bound to a project. If users contribute 1ETH or more they receive a contributor badge in the form of a NFT token which is tradeable. If project goal is met, creator can withdraw funds, else all the funds wil be returned to contributors if goal not met within the speficied timeframe.

### Specifications

- The smart contract is reusable; multiple projects can be registered and accept ETH concurrently.
  - Specifically, you should use the factory contract pattern.
- The goal is a preset amount of ETH.
  - This cannot be changed after a project gets created.
- Regarding contributing:
  - The contribute amount must be at least 0.01 ETH.
  - There is no upper limit.
  - Anyone can contribute to the project, including the creator.
  - One address can contribute as many times as they like.
  - No one can withdraw their funds until the project either fails or gets cancelled.
- Regarding contributer badges:
  - An address receives a badge if their **total contribution** is at least 1 ETH.
  - One address can receive multiple badges, but should only receive 1 badge per 1 ETH.
- If the project is not fully funded within 30 days:
  - The project goal is considered to have failed.
  - No one can contribute anymore.
  - Supporters get their money back.
  - Contributor badges are left alone. They should still be tradable.
- Once a project becomes fully funded:
  - No one else can contribute (however, the last contribution can go over the goal).
  - The creator can withdraw any amount of contributed funds.
- The creator can choose to cancel their project before the 30 days are over, which has the same effect as a project failing.

### Design Decisions

1. Will make use of the battle tested OpenZeppelin ERC721 contracts for the Badge / NFT component
2. When supporters get their money back, a pull pattern is used as opposed to push pattern which many be costly to send back all the ETH to many users e.g using a loop. In pull pattern, users can come and withdraw their contribution amounts
3. Once goal has been reached a project creator cannot cancel the project, the project creator can only withdraw the funds
4. Project is open immediately for receiving contributions once its created
5. Project details to be kept minimal no description, name, details, etc kept onchain => just project ID, goal, deadline, owner will
   automatically be the project creator or caller of the function to create project
6. Since minimal contribution is 0.01 will require minium project goal to be same amount
7. Even if project is cancelled or fails to meet target, contributors keep their NFT's
8. Design to be as minimal and as secure as possible

### Prerequisites

Due to time constraints will not use Hardhat Advanced TypeScript config or Github paulrburg/solidity-template on this project
but for the upcoming ones

- Solidity https://docs.soliditylang.org/
- Ethers https://docs.ethers.io/v5/
- Hardhat https://docs.soliditylang.org/
- OpenZeppelin ERC721 https://docs.openzeppelin.com/contracts/2.x/api/token/erc721
- Chai Testing https://www.chaijs.com/
- JavaScript https://www.javascript.com/

### Use, Test, Deploy

1. Install packages => npm install
2. Run local hardhat node => npx hardhat node
3. Run tests => npx hardhat test
4. Deploy => npx hardhat run --network localhost scripts/deploy.js

## Security Analysis Done on RemixIDE

1. Slither

- no issues picked directly linked to contracts

2. Mythril

- no serious issues detected
- only aspects of Low warning for ERC165 which is not related to our contracts

# TO DO 

- fix failign test
- fix logic related to failign test
- remove numerous modifiers where possible
- use clone pattern for factory 
- gas optimizations 
- make code cleaner