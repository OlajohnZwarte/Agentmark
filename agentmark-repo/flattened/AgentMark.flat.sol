// Sources flattened with hardhat v2.29.2 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/AgentMark.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentMark — Verified Agent Badge & Service Registry
/// @notice A soulbound (non-transferable) ERC-721 badge that can only be claimed by
///         holders of a Binance Agent ID (name.ai), plus an on-chain registry where
///         verified agents publish a service and endorse each other.
///
///         Agent ID integration (the core of this product):
///         - Claiming a badge requires `balanceOf(msg.sender) > 0` on the official
///           Agent ID contract (SPACE ID Agent ID, symbol AI, ERC-721, non-transferable).
///         - Registering a service and endorsing other agents both require holding
///           the AgentMark badge, which itself can only exist on an Agent ID address.
///         - One badge per address, forever bound to that address (soulbound).
///
///         Safety / owner permissions (fully disclosed):
///         - The contract holds NO user funds and has NO payable functions.
///         - Claiming is free; users only pay their own gas.
///         - The owner (deployer) has exactly ONE power: updating the metadata base
///           URI (`setBaseURI`). The owner cannot mint, pause, freeze, tax, transfer
///           or withdraw anything. There is no mint function besides `claimBadge`,
///           which any qualifying Agent ID holder calls for themselves.
///         - Badges can never be transferred or approved to another address.

interface IAgentID {
    function balanceOf(address account) external view returns (uint256);
}

contract AgentMark {
    // ------------------------------------------------------------------
    // ERC-721 metadata
    // ------------------------------------------------------------------
    string public name = "AgentMark Badge";
    string public symbol = "AMARK";
    string public baseURI;

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------
    IAgentID public immutable agentID;

    uint256 public totalClaimed;
    mapping(address => uint256) public badgeOf;       // owner => tokenId (0 = none)
    mapping(uint256 => address) public ownerOfBadge;   // tokenId => owner
    mapping(address => uint256) private _badgeBalance; // ERC-721 balanceOf support

    struct Service {
        string agentName;    // display name for the agent / service
        string category;     // e.g. "Trading", "Research", "Minting", "Data"
        string description;  // short public description
        string contact;      // public contact (X handle, website, etc.)
        bool registered;
    }

    mapping(address => Service) public services;
    address[] public registeredAgents;

    mapping(address => mapping(address => bool)) public hasEndorsed; // endorser => agent => done
    mapping(address => uint256) public endorsementCount;

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------
    event BadgeClaimed(address indexed agent, uint256 indexed tokenId);
    event ServiceRegistered(address indexed agent, string agentName, string category);
    event ServiceUpdated(address indexed agent);
    event Endorsed(address indexed endorser, address indexed agent, uint256 newCount);
    event BaseURIUpdated(string newBaseURI);

    // ------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------
    address public owner;

    constructor(address agentIDContract, string memory initialBaseURI) {
        require(agentIDContract != address(0), "AgentMark: zero Agent ID contract");
        agentID = IAgentID(agentIDContract);
        baseURI = initialBaseURI;
        owner = msg.sender;
    }

    // ------------------------------------------------------------------
    // Agent ID gate
    // ------------------------------------------------------------------
    /// @notice True if `account` currently holds an Agent ID (name.ai).
    function isAgentIDHolder(address account) public view returns (bool) {
        return agentID.balanceOf(account) > 0;
    }

    /// @notice True if `account` holds an Agent ID AND has claimed its badge.
    function isVerifiedAgent(address account) public view returns (bool) {
        return badgeOf[account] != 0;
    }

    // ------------------------------------------------------------------
    // Badge claim (free, one per Agent ID address, soulbound)
    // ------------------------------------------------------------------
    function claimBadge() external returns (uint256 tokenId) {
        require(isAgentIDHolder(msg.sender), "AgentMark: no Agent ID");
        require(badgeOf[msg.sender] == 0, "AgentMark: badge already claimed");

        totalClaimed += 1;
        tokenId = totalClaimed;
        badgeOf[msg.sender] = tokenId;
        ownerOfBadge[tokenId] = msg.sender;
        _badgeBalance[msg.sender] = 1;

        emit BadgeClaimed(msg.sender, tokenId);
    }

    // ------------------------------------------------------------------
    // Service registry (badge holders only)
    // ------------------------------------------------------------------
    function registerService(
        string calldata agentName,
        string calldata category,
        string calldata description,
        string calldata contact
    ) external {
        require(badgeOf[msg.sender] != 0, "AgentMark: claim your badge first");
        require(bytes(agentName).length > 0, "AgentMark: name required");

        bool firstTime = !services[msg.sender].registered;
        services[msg.sender] = Service({
            agentName: agentName,
            category: category,
            description: description,
            contact: contact,
            registered: true
        });
        if (firstTime) {
            registeredAgents.push(msg.sender);
            emit ServiceRegistered(msg.sender, agentName, category);
        } else {
            emit ServiceUpdated(msg.sender);
        }
    }

    function getService(address agent) external view returns (Service memory) {
        return services[agent];
    }

    function registeredAgentCount() external view returns (uint256) {
        return registeredAgents.length;
    }

    // ------------------------------------------------------------------
    // Endorsements (badge holders only, one per pair, no self-endorsement)
    // ------------------------------------------------------------------
    function endorse(address agent) external {
        require(badgeOf[msg.sender] != 0, "AgentMark: claim your badge first");
        require(agent != msg.sender, "AgentMark: cannot endorse yourself");
        require(badgeOf[agent] != 0, "AgentMark: target has no badge");
        require(!hasEndorsed[msg.sender][agent], "AgentMark: already endorsed");

        hasEndorsed[msg.sender][agent] = true;
        endorsementCount[agent] += 1;
        emit Endorsed(msg.sender, agent, endorsementCount[agent]);
    }

    // ------------------------------------------------------------------
    // Minimal ERC-721 surface (read-only; transfers are disabled)
    // ------------------------------------------------------------------
    function balanceOf(address account) external view returns (uint256) {
        return _badgeBalance[account];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = ownerOfBadge[tokenId];
        require(o != address(0), "AgentMark: nonexistent token");
        return o;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(ownerOfBadge[tokenId] != address(0), "AgentMark: nonexistent token");
        return string(abi.encodePacked(baseURI, _toString(tokenId)));
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        // ERC-165 and ERC-721 interfaces
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd;
    }

    // Soulbound: every transfer / approval path reverts, permanently.
    function transferFrom(address, address, uint256) external pure {
        revert("AgentMark: soulbound, non-transferable");
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert("AgentMark: soulbound, non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("AgentMark: soulbound, non-transferable");
    }

    function approve(address, uint256) external pure {
        revert("AgentMark: soulbound, non-transferable");
    }

    function setApprovalForAll(address, bool) external pure {
        revert("AgentMark: soulbound, non-transferable");
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    // ------------------------------------------------------------------
    // The owner's single disclosed power: metadata base URI
    // ------------------------------------------------------------------
    function setBaseURI(string calldata newBaseURI) external {
        require(msg.sender == owner, "AgentMark: not owner");
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
