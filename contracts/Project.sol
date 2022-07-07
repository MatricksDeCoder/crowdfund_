// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/*
   Project Contract that keeps track of project details e.g goal, open time period; allows for contributions, withdraw by 
   the owner if goal reached after closePeriod; withdraw by users if goal not reached or project cancelled. 
*/

/*
To do : - audit fixes
        - cleaning up code
        - Natspec
        - contributions tracking
*/

contract Project is ERC721 {

    address public immutable creator;
    bool public isCancelled;
    uint256 public immutable projectId;
    uint256 public constant daysOpen = 30 days;
    // unused variable 
    uint256 public immutable startDate;
    uint256 public immutable closeDate;
    uint256 public immutable goal;
    uint256 public constant minContribution = 0.01 ether;
    uint256 public contributed;
    uint256 public contributionsLeft;

    uint public badgeIds;

    mapping(address => uint256) public contributors;

    event Contribute(address indexed contributor, uint256 indexed amount);
    event ProjectCancel(uint256 indexed id, bool indexed isCancelled);
    event CreatorWithdraw(uint256 indexed id, address indexed creator, uint256 amount);
    event UserWithdraw(uint256 indexed id, address indexed contributor, uint256 indexed amount);

    constructor(address _creator, uint256 _projectId, uint256 _goal, string memory _badgeName, string memory _badgeSymbol) ERC721(_badgeName, _badgeSymbol) {
        require(_goal >= minContribution, 'goal too low');
        creator = _creator;
        projectId = _projectId;
        goal = _goal;
        startDate = block.timestamp;
        closeDate = block.timestamp + daysOpen;              
    }

    modifier onlyCreator() {
        require(msg.sender == creator, 'not project creator');
        _;
    }

    modifier onlyActive() {
        require(block.timestamp <= closeDate, 'project is closed' );
        require(!isCancelled, 'project is cancelled');
        require(contributed < goal, 'project goal reached');
        _;
    }

    function contribute() external payable onlyActive {
        require(msg.value >= minContribution, 'minimum contribition 0.01 ETH');
        contributors[msg.sender] += msg.value;
        contributed += msg.value;
        contributionsLeft = contributed;
        //to resolve for potential reentrancy
        if(msg.value >= 1 ether) {
        _mintBadge(msg.sender);
        }
        emit Contribute(msg.sender, msg.value);
    }
    
    function cancel() external onlyCreator onlyActive {
        isCancelled = true;
        emit ProjectCancel(projectId, isCancelled);
    }

    function contributorWithdraw() external {
        require(isCancelled || block.timestamp > closeDate && contributed < goal, 'project succeeded or still active');
        uint256 _amount = contributors[msg.sender];
        require(_amount > 0, 'already withdrew');
        contributors[msg.sender] = 0;
        (bool success, ) = msg.sender.call{ value: _amount }('');
        require(success);
        emit UserWithdraw(projectId, msg.sender, _amount);
    }

    function creatorWithdraw(uint256 _amount) external onlyCreator  {
        //creator should be able to withdraw as soon as goal is reached ???
        require(!isCancelled && block.timestamp > closeDate && contributed >= goal, 'project cancelled or didnt succeed or still active');
        require(_amount > 0 && _amount <= contributed);
        contributionsLeft -= _amount;
        (bool success, ) = msg.sender.call{ value: _amount }('');
        require(success);
        emit CreatorWithdraw(projectId, creator, _amount);
    }

    function _mintBadge(address recipient)
        internal
        returns (uint256)
    {
        badgeIds += 1;
        _mint(recipient, badgeIds);
        return badgeIds;
    }

}