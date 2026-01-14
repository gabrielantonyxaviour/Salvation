# Compliance Declaration

## Project: Salvation

**Date:** January 2025
**Network:** Mantle Sepolia (Testnet)

---

## Regulated Assets Disclosure

### Does this project involve regulated assets?

**Yes** - Salvation involves tokenized infrastructure bonds and prediction markets, which may constitute securities and/or regulated financial instruments in various jurisdictions.

### Asset Classification

| Asset | Type | Regulatory Status |
|-------|------|-------------------|
| Bond Tokens (ERC-3643) | Yield-bearing tokens | **Likely Securities** - Represent debt instruments with expected returns from project revenue |
| YES/NO Tokens | Prediction market positions | **Potentially Regulated** - May be classified as derivatives or gambling instruments depending on jurisdiction |
| Yield Distributions | Revenue sharing | **Likely Securities** - Pro-rata distribution of operational revenue constitutes investment returns |

### Why These May Be Regulated

1. **Investment Contract Analysis (Howey Test)**:
   - Investment of money: Users purchase bond tokens with stablecoins
   - Common enterprise: Funds pooled for infrastructure projects
   - Expectation of profits: 8-15% APY from project revenue
   - Efforts of others: Returns depend on project operators and verifiers

2. **Prediction Markets**: Binary outcome markets may be classified as:
   - Derivatives (options/futures) in some jurisdictions
   - Gambling/betting in others
   - Requires specific licensing in most regulated markets

---

## Compliance Measures Implemented

### ERC-3643 Compliance Framework

The platform implements ERC-3643 (T-REX) standard specifically designed for regulated securities:

1. **Identity Registry**: KYC verification required before token purchase
2. **Transfer Restrictions**: `canTransfer()` hooks enforce compliance on every transfer
3. **Investor Verification**: Only allowlisted addresses can hold bond tokens
4. **Freeze Capabilities**: Per-address and global freeze for regulatory holds
5. **Forced Transfer**: Admin function for legal/regulatory asset recovery
6. **Compliance Module**: Pluggable rule enforcement for jurisdiction-specific requirements

### Additional Safeguards

- **Milestone-Based Release**: Funds released only upon verified project completion
- **Oracle Verification**: Multi-source verification prevents fraud
- **Insurance Pool**: 5% of purchases fund investor protection
- **Audit Trail**: All transactions recorded on-chain for regulatory review

---

## Current Deployment Status

- **Network**: Mantle Sepolia Testnet
- **Real Value**: None - testnet tokens only, no real infrastructure projects
- **KYC Status**: Mock verification for demo purposes
- **Production Plans**: Will require:
  - Securities law review per target jurisdiction
  - Regulatory licensing (if applicable)
  - Full KYC/AML integration
  - Legal entity structure

---

## Intended Regulatory Approach

For production deployment, Salvation intends to:

1. **Seek Legal Counsel**: Engage securities lawyers in target jurisdictions
2. **Regulatory Sandbox**: Apply for fintech sandbox programs where available
3. **Exemption Analysis**: Evaluate Reg D, Reg S, Reg A+, or equivalent exemptions
4. **Jurisdiction Selection**: Launch in crypto-friendly jurisdictions first
5. **Accredited Investors**: Initially limit to accredited/qualified investors if required

---

## Jurisdictional Considerations

| Jurisdiction | Bond Tokens | Prediction Markets |
|--------------|-------------|-------------------|
| United States | Likely securities (SEC) | Restricted (CFTC) |
| European Union | MiCA may apply | Varies by member state |
| United Kingdom | FCA regulated | Gambling Commission |
| Singapore | MAS securities framework | Regulated betting |
| UAE/ADGM | Progressive RWA framework | Case-by-case |

---

## Risk Acknowledgment

Users of this platform should understand:

1. Bond tokens may be securities requiring registration or exemption
2. Prediction markets may be illegal in certain jurisdictions
3. Tax implications vary by jurisdiction
4. This is experimental technology on testnet
5. No real value is at risk in current deployment

---

## Contact

For compliance and regulatory inquiries, contact the Salvation team.

---

*This declaration is provided for hackathon submission purposes and does not constitute legal advice. Salvation acknowledges the regulated nature of its core assets and commits to regulatory compliance before any production deployment.*
