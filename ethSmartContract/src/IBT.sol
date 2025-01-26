// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title Interoperable Bridge Token (IBT)
/// @dev ERC20 token with mint and burn capabilities restricted to the owner
contract IBT is ERC20, Ownable {
    uint256 public constant TOKEN_TO_ETH_RATE = 1; // 1 IBT = 1 ETH

    /// @notice Constructor initializes the ERC20 token and sets the owner
    constructor()
        ERC20("Interoperable Bridge Token", "IBT")
        Ownable(msg.sender)
    {}

    /// @notice Mint tokens to a specific address
    /// @param to Address to receive the tokens
    /// @param amount Number of tokens to mint (in IBT units)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn tokens from a specific address
    /// @param from Address to burn tokens from
    /// @param amount Number of tokens to burn (in IBT units)
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /// @notice Get the ETH value of a given token amount
    /// @param tokenAmount Amount of tokens to convert
    /// @return ethValue The equivalent value in Ether
    function tokenToETH(
        uint256 tokenAmount
    ) public pure returns (uint256 ethValue) {
        return tokenAmount * TOKEN_TO_ETH_RATE;
    }

    /// @notice Get the token value of a given Ether amount
    /// @param ethAmount Amount of Ether to convert
    /// @return tokenValue The equivalent value in IBT tokens
    function ethToToken(
        uint256 ethAmount
    ) public pure returns (uint256 tokenValue) {
        require(
            ethAmount % TOKEN_TO_ETH_RATE == 0,
            "Must be a whole number conversion"
        );
        return ethAmount / TOKEN_TO_ETH_RATE;
    }
}
