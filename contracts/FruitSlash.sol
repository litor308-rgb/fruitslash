// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FruitSlash is Ownable {
    uint256 public constant MAX_LEADERBOARD = 100;

    struct Score {
        address player;
        uint256 score;
        uint256 timestamp;
    }

    mapping(address => uint256) public highScores;
    mapping(address => uint256) public totalGamesPlayed;

    Score[] public leaderboard;
    uint256 public totalPlayers;

    event ScoreSubmitted(address indexed player, uint256 score);
    event LeaderboardUpdated(address indexed player, uint256 rank);

    constructor() Ownable(msg.sender) {}

    function submitScore(uint256 score) external {
        require(score > 0, "Score must be positive");
        require(score > highScores[msg.sender], "Not a high score");
        require(score <= 999999, "Score exceeds maximum");

        if (highScores[msg.sender] == 0) {
            totalPlayers++;
        }

        highScores[msg.sender] = score;
        totalGamesPlayed[msg.sender]++;
        _updateLeaderboard(msg.sender, score);

        emit ScoreSubmitted(msg.sender, score);
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
}
