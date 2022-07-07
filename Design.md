## Support multiple tiers of Badges 

Smart contracts have a hard limit of 24kb. Crowdfundr hands out an NFT to everyone who contributes. However, consider how Kickstarter has multiple contribution tiers. How would you design your contract to support this, without creating three separate NFT contracts?

## Solution 

- would use the ERC1155 token standard which is a multi token standrd in 1 contract
- ensure there are 3 different names tiers e,g named as required for project 
```
uint256 public constant TIER1 = 0;
uint256 public constant TIER2 = 1;
uint256 public constant TIER3 = 2;
```

