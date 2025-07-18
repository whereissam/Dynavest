use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Distance, SearchPointsBuilder, CreateCollectionBuilder, VectorParamsBuilder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub user_id: String,
    pub session_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub message: String,
    pub keywords: Vec<String>,
    pub ui_suggestions: Vec<UISuggestion>,
    pub session_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UISuggestion {
    pub component: String,
    pub data: HashMap<String, String>,
}

pub struct ChatService {
    qdrant_client: Qdrant,
    openai_client: openai_api_rs::v1::api::Client,
}

impl ChatService {
    pub fn new(qdrant_client: Qdrant, openai_api_key: String) -> Self {
        let openai_client = openai_api_rs::v1::api::Client::new(openai_api_key);
        
        Self {
            qdrant_client,
            openai_client,
        }
    }

    pub async fn initialize_collection(&self) -> Result<(), Box<dyn std::error::Error>> {
        let collection_name = "defi_knowledge";
        
        // Create collection if it doesn't exist
        let collections = self.qdrant_client.list_collections().await?;
        let collection_exists = collections
            .collections
            .iter()
            .any(|c| c.name == collection_name);

        if !collection_exists {
            info!("Creating Qdrant collection: {}", collection_name);
            
            self.qdrant_client
                .create_collection(
                    CreateCollectionBuilder::new(collection_name)
                        .vectors_config(VectorParamsBuilder::new(1536, Distance::Cosine))
                )
                .await?;
        }

        Ok(())
    }

    pub async fn get_embedding(&self, text: &str) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        let request = openai_api_rs::v1::embedding::EmbeddingRequest {
            model: "text-embedding-ada-002".to_string(),
            input: text.to_string(),
            user: None,
        };

        let response = self.openai_client.embedding(request)?;
        
        if let Some(embedding) = response.data.first() {
            Ok(embedding.embedding.clone())
        } else {
            Err("No embedding returned".into())
        }
    }

    pub async fn search_knowledge(&self, query: &str, limit: u64) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let collection_name = "defi_knowledge";
        let embedding = self.get_embedding(query).await?;

        let search_result = self.qdrant_client
            .search_points(
                SearchPointsBuilder::new(collection_name, embedding, limit)
                    .with_payload(true)
            )
            .await?;
        
        let mut contexts = Vec::new();
        for point in search_result.result {
            if let Some(content) = point.payload.get("content") {
                if let Some(text) = content.as_str() {
                    contexts.push(text.to_string());
                }
            }
        }

        Ok(contexts)
    }

    pub async fn generate_response(&self, user_message: &str, context: &[String]) -> Result<ChatResponse, Box<dyn std::error::Error>> {
        let context_str = context.join("\n\n");
        
        let system_prompt = format!(
            "You are DynaVest AI, a DeFi strategy advisor. Use the following context to answer questions about DeFi strategies, yield farming, and investment opportunities.\n\nContext:\n{}\n\nProvide helpful, accurate advice about DeFi strategies. Include relevant keywords and UI suggestions in your response.",
            context_str
        );

        let request = openai_api_rs::v1::chat_completion::ChatCompletionRequest {
            model: "gpt-3.5-turbo".to_string(),
            messages: vec![
                openai_api_rs::v1::chat_completion::ChatCompletionMessage {
                    role: openai_api_rs::v1::chat_completion::MessageRole::system,
                    content: system_prompt,
                    name: None,
                    function_call: None,
                },
                openai_api_rs::v1::chat_completion::ChatCompletionMessage {
                    role: openai_api_rs::v1::chat_completion::MessageRole::user,
                    content: user_message.to_string(),
                    name: None,
                    function_call: None,
                },
            ],
            functions: None,
            function_call: None,
            temperature: Some(0.7),
            top_p: None,
            n: None,
            stream: None,
            stop: None,
            max_tokens: Some(500),
            presence_penalty: None,
            frequency_penalty: None,
            logit_bias: None,
            user: None,
        };

        let response = self.openai_client.chat_completion(request)?;
        
        if let Some(choice) = response.choices.first() {
            let content = choice.message.content.as_deref().unwrap_or("No response generated");
            let keywords = self.extract_keywords(content);
            let ui_suggestions = self.generate_ui_suggestions(&keywords);
            
            return Ok(ChatResponse {
                message: content.to_string(),
                keywords,
                ui_suggestions,
                session_id: uuid::Uuid::new_v4().to_string(),
            });
        }

        Err("No response generated".into())
    }

    fn extract_keywords(&self, content: &str) -> Vec<String> {
        let mut keywords = Vec::new();
        let content_lower = content.to_lowercase();
        
        // DeFi-related keywords
        let defi_keywords = vec![
            "yield", "farming", "staking", "liquidity", "pool", "apy", "apr",
            "defi", "ethereum", "polygon", "arbitrum", "optimism", "uniswap",
            "compound", "aave", "makerdao", "curve", "balancer", "strategy",
            "risk", "reward", "portfolio", "diversification", "impermanent loss",
            "smart contract", "dapp", "protocol", "governance", "dao",
        ];
        
        for keyword in defi_keywords {
            if content_lower.contains(keyword) {
                keywords.push(keyword.to_string());
            }
        }
        
        keywords
    }

    fn generate_ui_suggestions(&self, keywords: &[String]) -> Vec<UISuggestion> {
        let mut suggestions = Vec::new();
        
        for keyword in keywords {
            match keyword.as_str() {
                "yield" | "farming" | "staking" => {
                    suggestions.push(UISuggestion {
                        component: "YieldFarmingCard".to_string(),
                        data: HashMap::from([
                            ("title".to_string(), "Yield Farming Opportunities".to_string()),
                            ("action".to_string(), "explore_yield".to_string()),
                        ]),
                    });
                }
                "liquidity" | "pool" => {
                    suggestions.push(UISuggestion {
                        component: "LiquidityPoolCard".to_string(),
                        data: HashMap::from([
                            ("title".to_string(), "Liquidity Pool Strategies".to_string()),
                            ("action".to_string(), "view_pools".to_string()),
                        ]),
                    });
                }
                "risk" | "portfolio" => {
                    suggestions.push(UISuggestion {
                        component: "RiskAnalysisCard".to_string(),
                        data: HashMap::from([
                            ("title".to_string(), "Risk Assessment".to_string()),
                            ("action".to_string(), "analyze_risk".to_string()),
                        ]),
                    });
                }
                "strategy" => {
                    suggestions.push(UISuggestion {
                        component: "StrategyBuilderCard".to_string(),
                        data: HashMap::from([
                            ("title".to_string(), "Build Your Strategy".to_string()),
                            ("action".to_string(), "create_strategy".to_string()),
                        ]),
                    });
                }
                _ => {}
            }
        }
        
        // Remove duplicates
        suggestions.sort_by(|a, b| a.component.cmp(&b.component));
        suggestions.dedup_by(|a, b| a.component == b.component);
        
        suggestions
    }

    pub async fn process_chat(&self, request: ChatRequest) -> Result<ChatResponse, Box<dyn std::error::Error>> {
        info!("Processing chat request from user: {}", request.user_id);
        
        // Search for relevant context
        let context = self.search_knowledge(&request.message, 3).await?;
        
        // Generate response
        let response = self.generate_response(&request.message, &context).await?;
        
        Ok(response)
    }
}