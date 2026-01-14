// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LMSR - Logarithmic Market Scoring Rule Library
 * @notice Fixed-point math library for LMSR prediction market calculations
 * @dev Uses 1e18 (WAD) scale for precision. Implements exp and ln using Taylor series.
 *
 * LMSR Cost Function: C = b * ln(e^(yes/b) + e^(no/b))
 * Price Function: p_yes = e^(yes/b) / (e^(yes/b) + e^(no/b))
 */
library LMSR {
    // Fixed-point constants (1e18 scale)
    uint256 internal constant WAD = 1e18;
    int256 internal constant iWAD = 1e18;

    // ln(2) in WAD scale
    int256 internal constant LN2 = 693147180559945309;

    // Maximum safe value for exp input to prevent overflow
    int256 internal constant MAX_EXP_INPUT = 130 * iWAD; // e^130 is close to uint256 max
    int256 internal constant MIN_EXP_INPUT = -41 * iWAD; // e^-41 is essentially 0

    error ExpOverflow(int256 x);
    error LnNonPositive(int256 x);
    error DivisionByZero();

    /**
     * @notice Calculate the LMSR cost function
     * @param yes Total YES shares outstanding (in WAD)
     * @param no Total NO shares outstanding (in WAD)
     * @param b Liquidity parameter (in WAD)
     * @return cost The total cost in WAD scale
     */
    function cost(uint256 yes, uint256 no, uint256 b) internal pure returns (uint256) {
        require(b > 0, "LMSR: b must be positive");

        // C = b * ln(e^(yes/b) + e^(no/b))
        // To avoid overflow, we use the log-sum-exp trick:
        // ln(e^a + e^b) = max(a,b) + ln(1 + e^(min-max))

        int256 yesOverB = int256((yes * WAD) / b);
        int256 noOverB = int256((no * WAD) / b);

        int256 maxVal = yesOverB > noOverB ? yesOverB : noOverB;
        int256 minVal = yesOverB > noOverB ? noOverB : yesOverB;
        int256 diff = minVal - maxVal;

        // ln(e^max + e^min) = max + ln(1 + e^(min-max))
        // Since min-max is always <= 0, e^(min-max) <= 1
        int256 expDiff = exp(diff);
        int256 lnSum = maxVal + ln(iWAD + expDiff);

        // Multiply by b
        int256 result = (int256(b) * lnSum) / iWAD;

        return result > 0 ? uint256(result) : 0;
    }

    /**
     * @notice Calculate YES token price
     * @param yes Total YES shares outstanding (in WAD)
     * @param no Total NO shares outstanding (in WAD)
     * @param b Liquidity parameter (in WAD)
     * @return price Price of YES token in WAD (0.5e18 = $0.50)
     */
    function price(uint256 yes, uint256 no, uint256 b) internal pure returns (uint256) {
        require(b > 0, "LMSR: b must be positive");

        // p_yes = e^(yes/b) / (e^(yes/b) + e^(no/b))
        // Using softmax trick: p_yes = 1 / (1 + e^((no-yes)/b))

        int256 diff = (int256(no) - int256(yes)) * iWAD / int256(b);

        // Prevent overflow for extreme values
        if (diff > MAX_EXP_INPUT) {
            return 0; // YES price approaches 0
        }
        if (diff < MIN_EXP_INPUT) {
            return WAD; // YES price approaches 1
        }

        int256 expDiff = exp(diff);

        // p = 1 / (1 + e^diff) = WAD * WAD / (WAD + expDiff)
        uint256 denominator = uint256(iWAD + expDiff);
        if (denominator == 0) revert DivisionByZero();

        return (WAD * WAD) / denominator;
    }

    /**
     * @notice Calculate cost to buy shares
     * @param isYes True for YES shares, false for NO shares
     * @param shares Number of shares to buy (in WAD)
     * @param yes Current YES shares outstanding (in WAD)
     * @param no Current NO shares outstanding (in WAD)
     * @param b Liquidity parameter (in WAD)
     * @return buyCost Cost to purchase the shares in WAD
     */
    function costToBuy(
        bool isYes,
        uint256 shares,
        uint256 yes,
        uint256 no,
        uint256 b
    ) internal pure returns (uint256) {
        uint256 currentCost = cost(yes, no, b);

        uint256 newYes = isYes ? yes + shares : yes;
        uint256 newNo = isYes ? no : no + shares;

        uint256 newCost = cost(newYes, newNo, b);

        // Cost to buy = new cost - current cost
        return newCost > currentCost ? newCost - currentCost : 0;
    }

    /**
     * @notice Calculate payout from selling shares
     * @param isYes True for YES shares, false for NO shares
     * @param shares Number of shares to sell (in WAD)
     * @param yes Current YES shares outstanding (in WAD)
     * @param no Current NO shares outstanding (in WAD)
     * @param b Liquidity parameter (in WAD)
     * @return sellPayout Amount received from selling in WAD
     */
    function costToSell(
        bool isYes,
        uint256 shares,
        uint256 yes,
        uint256 no,
        uint256 b
    ) internal pure returns (uint256) {
        uint256 currentCost = cost(yes, no, b);

        uint256 newYes = isYes ? yes - shares : yes;
        uint256 newNo = isYes ? no : no - shares;

        uint256 newCost = cost(newYes, newNo, b);

        // Payout from selling = current cost - new cost
        return currentCost > newCost ? currentCost - newCost : 0;
    }

    /**
     * @notice Fixed-point exponential function e^x
     * @dev Uses a combination of integer powers of 2 and Taylor series for fractional part
     * @param x Input in WAD scale (1e18 = 1.0)
     * @return result e^x in WAD scale
     */
    function exp(int256 x) internal pure returns (int256) {
        if (x > MAX_EXP_INPUT) revert ExpOverflow(x);
        if (x < MIN_EXP_INPUT) return 0;

        // Handle negative exponents: e^(-x) = 1/e^x
        bool isNegative = x < 0;
        if (isNegative) x = -x;

        // Decompose x = k * ln(2) + r where |r| < ln(2)/2
        // Then e^x = 2^k * e^r
        int256 k = x / LN2;
        int256 r = x - (k * LN2);

        // Compute e^r using Taylor series: 1 + r + r^2/2! + r^3/3! + ...
        // We compute up to 12 terms for good precision
        int256 result = iWAD;
        int256 term = r;
        result += term;

        term = (term * r) / iWAD / 2;
        result += term;

        term = (term * r) / iWAD / 3;
        result += term;

        term = (term * r) / iWAD / 4;
        result += term;

        term = (term * r) / iWAD / 5;
        result += term;

        term = (term * r) / iWAD / 6;
        result += term;

        term = (term * r) / iWAD / 7;
        result += term;

        term = (term * r) / iWAD / 8;
        result += term;

        term = (term * r) / iWAD / 9;
        result += term;

        term = (term * r) / iWAD / 10;
        result += term;

        term = (term * r) / iWAD / 11;
        result += term;

        term = (term * r) / iWAD / 12;
        result += term;

        // Multiply by 2^k
        if (k > 0) {
            // 2^k = (2^1)^k, we do it iteratively to avoid overflow
            for (int256 i = 0; i < k; i++) {
                result = (result * 2);
            }
        } else if (k < 0) {
            for (int256 i = 0; i > k; i--) {
                result = result / 2;
            }
        }

        if (isNegative) {
            // e^(-x) = 1/e^x = WAD^2 / result
            result = (iWAD * iWAD) / result;
        }

        return result;
    }

    /**
     * @notice Fixed-point natural logarithm ln(x)
     * @dev Uses the identity ln(x) = 2 * artanh((x-1)/(x+1)) with Taylor series
     * @param x Input in WAD scale (must be positive)
     * @return result ln(x) in WAD scale
     */
    function ln(int256 x) internal pure returns (int256) {
        if (x <= 0) revert LnNonPositive(x);

        // Count powers of 2: find k such that 1 <= x/2^k < 2
        int256 k = 0;
        int256 y = x;

        while (y >= 2 * iWAD) {
            y = y / 2;
            k++;
        }
        while (y < iWAD) {
            y = y * 2;
            k--;
        }

        // Now 1 <= y < 2, compute ln(y) using Taylor series for artanh
        // ln(y) = 2 * artanh((y-1)/(y+1))
        // artanh(z) = z + z^3/3 + z^5/5 + z^7/7 + ...

        int256 z = ((y - iWAD) * iWAD) / (y + iWAD);
        int256 zSquared = (z * z) / iWAD;

        int256 result = z;
        int256 term = z;

        term = (term * zSquared) / iWAD;
        result += term / 3;

        term = (term * zSquared) / iWAD;
        result += term / 5;

        term = (term * zSquared) / iWAD;
        result += term / 7;

        term = (term * zSquared) / iWAD;
        result += term / 9;

        term = (term * zSquared) / iWAD;
        result += term / 11;

        term = (term * zSquared) / iWAD;
        result += term / 13;

        term = (term * zSquared) / iWAD;
        result += term / 15;

        // Multiply by 2 for artanh
        result = result * 2;

        // Add k * ln(2)
        result = result + (k * LN2);

        return result;
    }
}
