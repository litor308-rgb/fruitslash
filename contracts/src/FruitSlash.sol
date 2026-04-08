// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract FruitSlash is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_LEADERBOARD = 100;
    uint256 public constant CHECK_IN_RESET_HOUR = 2;
    uint256 public constant MAX_SCORE = 999999;

    uint256 private _nextTokenId;

    struct Score {
        address player;
        uint256 score;
        uint256 timestamp;
    }

    struct CheckInData {
        uint256 lastCheckIn;
        uint256 streak;
        uint256 totalCheckIns;
    }

    struct PlayerStats {
        uint256 highScore;
        uint256 totalGamesPlayed;
        uint256 totalSlashes;
        bool hasFruitNFT;
        uint256 tokenId;
    }

    mapping(address => PlayerStats) public players;
    mapping(address => CheckInData) public checkIns;

    Score[] public leaderboard;
    uint256 public totalPlayers;
    uint256 public totalSlashCount;
    uint256 public totalCheckInCount;

    event Slashed(address indexed player, uint256 totalSlashes);
    event FruitNFTMinted(address indexed player, uint256 tokenId);
    event CheckedIn(address indexed player, uint256 streak, uint256 totalCheckIns);
    event ScoreSubmitted(address indexed player, uint256 score);
    event LeaderboardUpdated(address indexed player, uint256 rank);

    constructor() ERC721("Fruit NFT", "FRUIT") Ownable(msg.sender) {}

    // ==================== WRITE FUNCTIONS ====================

    function slash() external {
        PlayerStats storage ps = players[msg.sender];
        ps.totalSlashes++;
        totalSlashCount++;

        if (!ps.hasFruitNFT) {
            ps.hasFruitNFT = true;
            _nextTokenId++;
            ps.tokenId = _nextTokenId;
            totalPlayers++;
            _safeMint(msg.sender, _nextTokenId);
            emit FruitNFTMinted(msg.sender, _nextTokenId);
        }

        emit Slashed(msg.sender, ps.totalSlashes);
    }

    function checkIn() external {
        CheckInData storage ci = checkIns[msg.sender];
        uint256 currentDay = _getCheckInDay(block.timestamp);

        if (ci.lastCheckIn == 0) {
            ci.streak = 1;
        } else {
            uint256 lastDay = _getCheckInDay(ci.lastCheckIn);
            require(currentDay > lastDay, "Already checked in today");
            ci.streak = (currentDay == lastDay + 1) ? ci.streak + 1 : 1;
        }

        ci.lastCheckIn = block.timestamp;
        ci.totalCheckIns++;
        totalCheckInCount++;

        emit CheckedIn(msg.sender, ci.streak, ci.totalCheckIns);
    }

    function submitScore(uint256 score) external {
        require(score > 0 && score <= MAX_SCORE, "Invalid score");

        PlayerStats storage ps = players[msg.sender];
        require(score > ps.highScore, "Not a high score");

        ps.highScore = score;
        ps.totalGamesPlayed++;
        _updateLeaderboard(msg.sender, score);

        emit ScoreSubmitted(msg.sender, score);
    }

    // ==================== READ FUNCTIONS ====================

    function getCheckInInfo(address player) external view returns (
        uint256 lastCheckIn,
        uint256 streak,
        uint256 totalPlayerCheckIns,
        bool checkedInToday
    ) {
        CheckInData memory ci = checkIns[player];
        bool done = false;
        if (ci.lastCheckIn > 0) {
            done = _getCheckInDay(block.timestamp) == _getCheckInDay(ci.lastCheckIn);
        }
        return (ci.lastCheckIn, ci.streak, ci.totalCheckIns, done);
    }

    function getPlayerStats(address player) external view returns (
        uint256 highScore,
        uint256 totalGamesPlayed,
        uint256 totalSlashes,
        bool hasFruitNFT,
        uint256 tokenId
    ) {
        PlayerStats memory ps = players[player];
        return (ps.highScore, ps.totalGamesPlayed, ps.totalSlashes, ps.hasFruitNFT, ps.tokenId);
    }

    function getTopScores(uint256 limit) external view returns (Score[] memory) {
        uint256 count = limit > leaderboard.length ? leaderboard.length : limit;
        Score[] memory result = new Score[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = leaderboard[i];
        }
        return result;
    }

    function getLeaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }

    // Keep backward compat for ABI
    function highScores(address player) external view returns (uint256) {
        return players[player].highScore;
    }

    function hasFruitNFT(address player) external view returns (bool) {
        return players[player].hasFruitNFT;
    }

    function totalSlashes(address player) external view returns (uint256) {
        return players[player].totalSlashes;
    }

    // ==================== NFT METADATA ====================

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">',
            '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">',
            '<stop offset="0%" stop-color="#0E0620"/>',
            '<stop offset="50%" stop-color="#3D1545"/>',
            '<stop offset="100%" stop-color="#6B2040"/>',
            '</linearGradient></defs>',
            '<rect width="512" height="512" fill="url(#bg)"/>',
            '<text x="256" y="200" text-anchor="middle" font-size="120">',
            unicode'🍉',
            '</text>',
            '<text x="256" y="300" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="36" fill="white">',
            'FruitSlash',
            '</text>',
            '<text x="256" y="350" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#00D4FF">',
            '#', tokenId.toString(),
            '</text>',
            '</svg>'
        ));

        string memory json = string(abi.encodePacked(
            '{"name":"Fruit NFT #', tokenId.toString(),
            '","description":"FruitSlash player pass on Base","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '","attributes":[{"trait_type":"Game","value":"FruitSlash"},{"trait_type":"Chain","value":"Base"}]}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    // ==================== INTERNAL ====================

    function _getCheckInDay(uint256 timestamp) private pure returns (uint256) {
        uint256 offset = CHECK_IN_RESET_HOUR * 3600;
        if (timestamp < offset) return 0;
        return (timestamp - offset) / 86400;
    }

    function _updateLeaderboard(address player, uint256 score) private {
        uint256 len = leaderboard.length;
        uint256 existingIdx = type(uint256).max;

        for (uint256 i = 0; i < len; i++) {
            if (leaderboard[i].player == player) {
                existingIdx = i;
                break;
            }
        }

        if (existingIdx != type(uint256).max) {
            leaderboard[existingIdx].score = score;
            leaderboard[existingIdx].timestamp = block.timestamp;
        } else if (len < MAX_LEADERBOARD) {
            leaderboard.push(Score(player, score, block.timestamp));
        } else {
            uint256 minIdx = 0;
            uint256 minScore = leaderboard[0].score;
            for (uint256 i = 1; i < len; i++) {
                if (leaderboard[i].score < minScore) {
                    minScore = leaderboard[i].score;
                    minIdx = i;
                }
            }
            if (score > minScore) {
                leaderboard[minIdx] = Score(player, score, block.timestamp);
            } else {
                return;
            }
        }

        // Insertion sort for the changed entry (more gas efficient than bubble sort)
        len = leaderboard.length;
        for (uint256 i = 1; i < len; i++) {
            Score memory key = leaderboard[i];
            uint256 j = i;
            while (j > 0 && leaderboard[j - 1].score < key.score) {
                leaderboard[j] = leaderboard[j - 1];
                j--;
            }
            leaderboard[j] = key;
        }

        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                emit LeaderboardUpdated(player, i + 1);
                break;
            }
        }
    }
}
