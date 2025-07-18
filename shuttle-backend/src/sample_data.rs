use crate::rag_system::RAGSystem;
use std::collections::HashMap;
use tracing::info;

pub async fn populate_sample_data(rag_system: &RAGSystem) -> Result<(), anyhow::Error> {
    info!("Populating RAG system with sample DeFi data...");
    
    let sample_documents = vec![
        (
            "DeFi yield farming is a strategy where cryptocurrency holders provide liquidity to decentralized protocols in exchange for rewards. Popular protocols include Uniswap for DEX trading, Aave for lending/borrowing, and Compound for earning interest on crypto assets.".to_string(),
            HashMap::from([
                ("category".to_string(), "yield_farming".to_string()),
                ("topic".to_string(), "defi_strategies".to_string()),
                ("difficulty".to_string(), "beginner".to_string()),
            ])
        ),
        (
            "Impermanent loss occurs when providing liquidity to automated market makers (AMMs) like Uniswap. It happens when the price ratio of your deposited tokens changes compared to when you deposited them. The loss is 'impermanent' because it only becomes permanent when you withdraw your liquidity.".to_string(),
            HashMap::from([
                ("category".to_string(), "impermanent_loss".to_string()),
                ("topic".to_string(), "amm_risks".to_string()),
                ("difficulty".to_string(), "intermediate".to_string()),
            ])
        ),
        (
            "Liquidity mining involves providing liquidity to decentralized exchanges or lending protocols in exchange for token rewards. This is different from traditional yield farming as it often involves receiving governance tokens as additional rewards on top of trading fees.".to_string(),
            HashMap::from([
                ("category".to_string(), "liquidity_mining".to_string()),
                ("topic".to_string(), "defi_rewards".to_string()),
                ("difficulty".to_string(), "intermediate".to_string()),
            ])
        ),
        (
            "Aave is a decentralized lending protocol that allows users to lend and borrow cryptocurrencies. Lenders earn interest on their deposits while borrowers pay interest on their loans. Aave offers both stable and variable interest rates, and users can switch between them.".to_string(),
            HashMap::from([
                ("category".to_string(), "aave".to_string()),
                ("topic".to_string(), "lending_protocol".to_string()),
                ("difficulty".to_string(), "beginner".to_string()),
            ])
        ),
        (
            "Compound is a DeFi protocol that allows users to supply crypto assets and earn interest, or borrow assets against their collateral. Interest rates are determined algorithmically based on supply and demand. Users receive cTokens representing their supplied assets.".to_string(),
            HashMap::from([
                ("category".to_string(), "compound".to_string()),
                ("topic".to_string(), "lending_protocol".to_string()),
                ("difficulty".to_string(), "beginner".to_string()),
            ])
        ),
        (
            "Uniswap is a decentralized exchange (DEX) that uses an automated market maker (AMM) model. Instead of traditional order books, it uses liquidity pools where users can trade directly against smart contracts. Liquidity providers earn fees from trades.".to_string(),
            HashMap::from([
                ("category".to_string(), "uniswap".to_string()),
                ("topic".to_string(), "dex".to_string()),
                ("difficulty".to_string(), "beginner".to_string()),
            ])
        ),
        (
            "Smart contract risk is one of the biggest risks in DeFi. Bugs in smart contract code can lead to loss of funds. Always research the protocol's security audits, bug bounty programs, and track record before investing significant amounts.".to_string(),
            HashMap::from([
                ("category".to_string(), "smart_contract_risk".to_string()),
                ("topic".to_string(), "defi_risks".to_string()),
                ("difficulty".to_string(), "intermediate".to_string()),
            ])
        ),
        (
            "Risk management in DeFi involves diversifying across different protocols, understanding liquidation risks, monitoring your positions regularly, and never investing more than you can afford to lose. Consider using stop-loss mechanisms and position sizing strategies.".to_string(),
            HashMap::from([
                ("category".to_string(), "risk_management".to_string()),
                ("topic".to_string(), "defi_strategies".to_string()),
                ("difficulty".to_string(), "advanced".to_string()),
            ])
        ),
        (
            "Staking involves locking up cryptocurrency to support blockchain network operations and earn rewards. In Ethereum 2.0, validators stake ETH to secure the network. Liquid staking protocols like Lido allow users to stake while maintaining liquidity.".to_string(),
            HashMap::from([
                ("category".to_string(), "staking".to_string()),
                ("topic".to_string(), "ethereum".to_string()),
                ("difficulty".to_string(), "beginner".to_string()),
            ])
        ),
        (
            "Flash loans are uncollateralized loans that must be repaid within the same blockchain transaction. They're commonly used for arbitrage, liquidations, and other advanced DeFi strategies. Aave and dYdX are popular flash loan providers.".to_string(),
            HashMap::from([
                ("category".to_string(), "flash_loans".to_string()),
                ("topic".to_string(), "advanced_defi".to_string()),
                ("difficulty".to_string(), "advanced".to_string()),
            ])
        ),
        (
            "Polkadot is a multi-chain network that enables different blockchains to interoperate. It uses a relay chain and parachains architecture. ink! is Polkadot's smart contract language for building DeFi applications on substrate-based chains.".to_string(),
            HashMap::from([
                ("category".to_string(), "polkadot".to_string()),
                ("topic".to_string(), "blockchain_infrastructure".to_string()),
                ("difficulty".to_string(), "intermediate".to_string()),
            ])
        ),
        (
            "Cross-chain DeFi enables users to access liquidity and yield opportunities across different blockchain networks. Bridges, cross-chain protocols, and multi-chain strategies are becoming increasingly important for maximizing DeFi yields.".to_string(),
            HashMap::from([
                ("category".to_string(), "cross_chain".to_string()),
                ("topic".to_string(), "multichain_defi".to_string()),
                ("difficulty".to_string(), "advanced".to_string()),
            ])
        ),
    ];

    let mut successful_inserts = 0;
    for (text, metadata) in sample_documents {
        match rag_system.add_document(&text, metadata).await {
            Ok(_) => {
                successful_inserts += 1;
            }
            Err(e) => {
                info!("Failed to insert sample document: {}", e);
            }
        }
    }

    info!("Successfully inserted {} sample documents into RAG system", successful_inserts);
    Ok(())
}