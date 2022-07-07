// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/*
   Project Contract that keeps track of project details e.g goal, open time period; allows for contributions, withdraw by 
   the owner if goal reached after closePeriod; withdraw by users if goal not reached or project cancelled. 
*/

contract Project is ERC721, ReentrancyGuard {
    address public immutable creator;
    bool public isCancelled;
    uint256 public immutable projectId;
    uint256 public constant daysOpen = 30 days;
    uint256 public immutable closeDate;
    uint256 public immutable goal;
    uint256 public constant minContribution = 0.01 ether;
    uint256 public contributed;
    uint256 public contributionsLeft;
    uint256 public badgeIds;

    mapping(address => uint256) public contributors;
    mapping(address => uint256) public numBadges;

    event Contribute(address indexed contributor, uint256 indexed amount);
    event ProjectCancel(uint256 indexed id, bool indexed isCancelled);
    event CreatorWithdraw(
        uint256 indexed id,
        address indexed creator,
        uint256 amount
    );
    event UserWithdraw(
        uint256 indexed id,
        address indexed contributor,
        uint256 indexed amount
    );

    constructor(
        address _creator,
        uint256 _projectId,
        uint256 _goal,
        string memory _badgeName,
        string memory _badgeSymbol
    ) ERC721(_badgeName, _badgeSymbol) {
        require(_goal >= minContribution, "goal too low");
        creator = _creator;
        projectId = _projectId;
        goal = _goal;
        closeDate = block.timestamp + daysOpen;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "not project creator");
        _;
    }

    modifier onlyOpenTime() {
        require(block.timestamp <= closeDate, "project is closed");
        _;
    }

    modifier onlyNotCancelled() {
        require(!isCancelled, "project is cancelled");
        _;
    }

    modifier onlyNotReachedGoal() {
        require(contributed < goal, "project goal reached");
        _;
    }

    modifier onlyProjectFailed() {
        require(
            isCancelled || (block.timestamp > closeDate && contributed < goal),
            "only project failed"
        );
        _;
    }

    modifier onlySuccess() {
        require(
            block.timestamp > closeDate && contributed >= goal,
            "project not successful"
        );
        _;
    }

    function contribute()
        external
        payable
        nonReentrant
        onlyOpenTime
        onlyNotReachedGoal
    {
        require(!isCancelled, "project is cancelled");
        require(msg.value >= minContribution, "minimum contribition 0.01 ETH");
        uint256 _badges = numBadges[msg.sender];
        contributors[msg.sender] += msg.value;
        contributed += msg.value;
        if (contributors[msg.sender] - numBadges[msg.sender] >= 1 ether) {
            numBadges[msg.sender] += 1;
            _mintBadge(msg.sender);
        }
        emit Contribute(msg.sender, msg.value);
    }

    function cancel() external onlyCreator onlyOpenTime onlyNotReachedGoal {
        isCancelled = true;
        emit ProjectCancel(projectId, isCancelled);
    }

    function contributorWithdraw() external onlyProjectFailed {
        uint256 _amount = contributors[msg.sender];
        require(_amount > 0, "already withdrew");
        contributors[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success);
        emit UserWithdraw(projectId, msg.sender, _amount);
    }

    function creatorWithdraw(uint256 _amount) external onlyNotCancelled onlySuccess {
        require(_amount > 0 && _amount <= address(this).balance);
        contributionsLeft -= _amount;
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success);
        emit CreatorWithdraw(projectId, creator, _amount);
    }

    function _mintBadge(address recipient) internal returns (uint256) {
        badgeIds += 1;
        _safeMint(recipient, badgeIds);
        return badgeIds;
    }
}
