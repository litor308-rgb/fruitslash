// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FruitSlash is ERC721, Ownable {
    uint256 public constant MAX_LEADERBOARD = 100;
    uint256 public constant CHECK_IN_RESET_HOUR = 2; // 2 AM UTC

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

    mapping(address => uint256) public highScores;
    mapping(address => uint256) public totalGamesPlayed;
    mapping(address => uint256) public totalSlashes;
    mapping(address => bool) public hasFruitNFT;
    mapping(address => CheckInData) public checkIns;

    Score[] public leaderboard;
    uint256 public totalPlayers;
    uint256 public totalSlashCount;

    event Slashed(address indexed player, uint256 totalSlashes);
    event FruitNFTMinted(address indexed player, uint256 tokenId);
    event CheckedIn(address indexed player, uint256 streak, uint256 totalCheckIns);
    event ScoreSubmitted(address indexed player, uint256 score);
    event LeaderboardUpdated(address indexed player, uint256 rank);

    constructor() ERC721("Fruit NFT", "FRUIT") Ownable(msg.sender) {}

    // --- Core transaction functions ---

    function slash() external {
        totalSlashes[msg.sender]++;
        totalSlashCount++;

        if (!hasFruitNFT[msg.sender]) {
            _nextTokenId++;
            _safeMint(msg.sender, _nextTokenId);
            hasFruitNFT[msg.sender] = true;
            totalPlayers++;
            emit FruitNFTMinted(msg.sender, _nextTokenId);
        }

        emit Slashed(msg.sender, totalSlashes[msg.sender]);
    }

    function checkIn() external {
        uint256 currentDay = _getCheckInDay(block.timestamp);
        uint256 lastDay = _getCheckInDay(checkIns[msg.sender].lastCheckIn);

        require(currentDay > lastDay || checkIns[msg.sender].lastCheckIn == 0, "Already checked in today");

        if (currentDay == lastDay + 1) {
            checkIns[msg.sender].streak++;
        } else {
            checkIns[msg.sender].streak = 1;
        }

        checkIns[msg.sender].lastCheckIn = block.timestamp;
        checkIns[msg.sender].totalCheckIns++;

        emit CheckedIn(msg.sender, checkIns[msg.sender].streak, checkIns[msg.sender].totalCheckIns);
    }

    function submitScore(uint256 score) external {
        require(score > 0, "Score must be positive");
        require(score > highScores[msg.sender], "Not a high score");
        require(score <= 999999, "Score exceeds maximum");

        highScores[msg.sender] = score;
        totalGamesPlayed[msg.sender]++;
        _updateLeaderboard(msg.sender, score);

        emit ScoreSubmitted(msg.sender, score);
    }

    // --- Read functions ---

    function getCheckInInfo(address player) external view returns (uint256 lastCheckIn, uint256 streak, uint256 totalCheckIns, bool checkedInToday) {
        CheckInData memory data = checkIns[player];
        uint256 currentDay = _getCheckInDay(block.timestamp);
        uint256 lastDay = _getCheckInDay(data.lastCheckIn);
        return (data.lastCheckIn, data.streak, data.totalCheckIns, currentDay == lastDay && data.lastCheckIn != 0);
    }

    function getTopScores(uint256 limit) external view returns (Score[] memory) {
        uint256 count = limit > leaderboard.length ? leaderboard.length : limit;
        Score[] memory topScores = new Score[](count);
        for (uint256 i = 0; i < count; i++) {
            topScores[i] = leaderboard[i];
        }
        return topScores;
    }

    function getLeaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }

    // --- Internal ---

    function _getCheckInDay(uint256 timestamp) private pure returns (uint256) {
        // Day boundary at 2 AM UTC: subtract 2 hours, then divide by 86400
        return (timestamp - CHECK_IN_RESET_HOUR * 3600) / 86400;
    }

    function _updateLeaderboard(address player, uint256 score) private {
        int256 existingIdx = -1;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                existingIdx = int256(i);
                break;
            }
        }

        if (existingIdx >= 0) {
            leaderboard[uint256(existingIdx)].score = score;
            leaderboard[uint256(existingIdx)].timestamp = block.timestamp;
        } else if (leaderboard.length < MAX_LEADERBOARD) {
            leaderboard.push(Score(player, score, block.timestamp));
        } else {
            uint256 minIdx = 0;
            uint256 minScore = leaderboard[0].score;
            for (uint256 i = 1; i < leaderboard.length; i++) {
                if (leaderboard[i].score < minScore) {
                    minScore = leaderboard[i].score;
                    minIdx = i;
                }
            }
            if (score > minScore) {
                leaderboard[minIdx] = Score(player, score, block.timestamp);
            }
        }

        for (uint256 i = 0; i < leaderboard.length; i++) {
            for (uint256 j = i + 1; j < leaderboard.length; j++) {
                if (leaderboard[j].score > leaderboard[i].score) {
                    Score memory temp = leaderboard[i];
                    leaderboard[i] = leaderboard[j];
                    leaderboard[j] = temp;
                }
            }
        }

        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                emit LeaderboardUpdated(player, i + 1);
                break;
            }
        }
    }
}
