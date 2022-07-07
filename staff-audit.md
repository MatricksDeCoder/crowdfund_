https://github.com/ShipyardDAO/student.MatricksDeCoder/tree/a6932e505c94979d61b3ae3a7f763b55b4c69abf/crowdfund

The following is a micro audit of git commit a6932e505c94979d61b3ae3a7f763b55b4c69abf by Melvillian

# General Comments

1. Excellent test coverage! 39 tests is the most I have never seen for this project, impressive. I especially like how you test the same function call on different states of your contract (like cancelling a project that has already been cancelled, or had its funding goal met, or which has passed 30 days).

2. In your test code I see logic that's trying to implement a "close to" function:

`let reconcile = (totalContributed - (Number(ethAfter))  + (Number(ethBefore)))/ 10**18`

There exists a waffle Chai matcher for this, called `closeTo`. To see how it works, go to this page and Ctrl + F for "closeTo": https://ethereum-waffle.readthedocs.io/en/latest/matchers.html

3. nice job setting some of your storage variables to `immutable` that saves a lot of gas.

# Design Exercise

Nice! This is my preferred approach too. I think one downside is that by not using ERC721, you make it so your NFT can't interact with certain protocols, namely the one's that do not support ERC1155.

# Issues

**[M-1]** Use of `_mint` instead of `_safeMint`

In line 94 of `Project.sol`, NFT's are minted to users with the `ERC721._mint` function. However, this function does not check if the `_to` address is able to handle ERC721 tokens, which would not be the case if the `msg.sender` was a contract that does not implement the equivalent of [IERC721Receiver](htt
ps://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721Receiver.sol) interface.

Consider using `_safeMint` instead, but then must then make sure that all functions that call `_mintBadge` are non susceptible to reentrancy attacks

**[M-2]** Technical Mistake with regards to when NFT's get minted

In line 59 of `Project.sol` you gate the NFT minting on the following check:

`if(msg.value >= 1 ether) {`

but this is not right. According to the spec, the contract should mint 1 NFT for every 1 ETH **that gets donated to the project**. The way you have it coded here, even if a user contributed 0.5 ETH in one tx, and 0.5 ETH in another, they would receive 0 NFT's, when really they should receive 1. It's about the cumulative ETH contributed to the project by a user.

**[Q-1]** `startDate` is never read or used

`startDate` is declared but never used, which is a waste of gas. Consider removing it. You could always make a function called `startDate` which is simply `return closeDate - 30 days;`.

**[Q-2]** `contributionsLeft` is redundant

`contributionsLeft` is never read from, and it tracks the same data as `address(this).balance`. Consider removing it for the more standard contract balance variable.

# Nitpicks

# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | - |
| Vulnerability              | 2 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | 2 |

Total: 4
Great job!