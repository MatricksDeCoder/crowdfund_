## **[H-1]** Attacker can mint unlimited NFT tokens after contributing >= 1 ETH

On line 59-61, Project.sol has the following code:

    if(msg.value >= 1 ether) {
        _mintBadge(msg.sender);
    }

While this code is valid for the first mint >= 1 ETH, any subsequent contribution after will result in the user receiving another NFT
We want to only allow users to mint an NFT per 1 ETH contribution
No funds has been hacked, but users are able to mint an unlimited number of NFTs if contribution is >= 1 ETH

Consider: A way to prevent this is to add an additional check to the `_mintBadge` function to ensure that a user is only allowed
to mint 1 NFT per 1 ETH contribution.

## **[H-2]** Creator cannot withdraw funds when project is successfully funded

On line 80, Project.sol has the following code:

    require(!isCancelled && block.timestamp > closeDate && contributed >= goal, 'project cancelled or didnt succeed or still active');

All the statements have to be true for the creator to withdraw funds
The require statement here is blocking the user from withdrawing funds even if `contributed >= goal` and project has not been cancelled
When funding is successful, we should allow the creator to withdraw funds otherwise funds are lost as creator is no longer
able to cancel the project given the `onlyActive` modifer on `cancel()`

Consider: updating your require statement

## **[L-1]** When contributors withdraw funds the balance of the smart contract is not updated

On line 74-77, Project.sol has the following code:

    contributors[msg.sender] = 0;

The contributor balance is zeroed out, however we need to ensure the balance of the smart contract is updated

Consider: Adding another line of code to update the balance of the smart contract `contributed` or `contributionsLeft`

## **[Q-1]** When creator withdraw funds the balance of the smart contract is not updated

On line 82-83, Project.sol has the following code:

    require(_amount > 0 && _amount <= contributed);
    contributionsLeft -= _amount;

Although this would fail given the previous bug [H-2], believe this could be updated
The required statement is checking against contributed, although we are deducting `contributionsLeft`
Could just be the variable naming that's making this part a bit opaque

Consider: updating variable naming / require statement to reflect `contributionsLeft`
